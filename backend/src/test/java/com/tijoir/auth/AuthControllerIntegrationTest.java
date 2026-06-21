package com.tijoir.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.auth.mfa.MfaTotpService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MfaTotpService mfaTotpService;

    @Test
    void registerVerifyLoginAndReadCurrentUser() throws Exception {
        String registerBody = """
                {
                  "organizationName": "Acme Integrations",
                  "organizationEmail": "security@acme.test",
                  "userName": "Acme Owner",
                  "userEmail": "owner@acme.test",
                  "password": "StrongPass@123"
                }
                """;

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.auth").doesNotExist())
                .andExpect(jsonPath("$.emailVerificationToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode registerJson = objectMapper.readTree(registerResponse);
        String verificationToken = registerJson.get("emailVerificationToken").asText();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Email verification is required before login"));

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.user.emailVerified").value(true))
                .andExpect(cookie().exists("tijoir_refresh"))
                .andReturn();

        String loginResponse = loginResult.getResponse().getContentAsString();
        JsonNode loginJson = objectMapper.readTree(loginResponse);
        String loginToken = loginJson.get("accessToken").asText();
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("acme-integrations"));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(loginResult.getResponse().getCookie("tijoir_refresh")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("tijoir_refresh"));
    }

    @Test
    void loginRejectsBadPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "missing@example.test",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshCookieSession() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Acme Logout",
                                  "organizationEmail": "security@acme-logout.test",
                                  "userName": "Acme Owner",
                                  "userEmail": "owner@acme-logout.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String verificationToken = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-logout.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("tijoir_refresh"))
                .andReturn();

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(loginResult.getResponse().getCookie("tijoir_refresh")))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("tijoir_refresh", 0));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(loginResult.getResponse().getCookie("tijoir_refresh")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void failedLoginAttemptsTriggerCooldownForSameEmailAndNetwork() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Acme Cooldown",
                                  "organizationEmail": "security@acme-cooldown.test",
                                  "userName": "Acme Owner",
                                  "userEmail": "owner@acme-cooldown.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String verificationToken = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();
        mockMvc.perform(post("/api/auth/verify-email")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk());

        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "203.0.113.10")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email": "owner@acme-cooldown.test",
                                      "password": "WrongPass@123"
                                    }
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-cooldown.test",
                                  "password": "WrongPass@123"
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Too many failed login attempts. Try again later."));

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-cooldown.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Too many failed login attempts. Try again later."));
    }

    @Test
    void resendVerificationIsRateLimitedPerEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header("X-Forwarded-For", "198.51.100.22")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Acme Resend",
                                  "organizationEmail": "security@acme-resend.test",
                                  "userName": "Acme Owner",
                                  "userEmail": "owner@acme-resend.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated());

        for (int attempt = 1; attempt <= 3; attempt++) {
            mockMvc.perform(post("/api/auth/resend-verification")
                            .header("X-Forwarded-For", "198.51.100.22")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email": "owner@acme-resend.test"
                                    }
                                    """))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/auth/resend-verification")
                        .header("X-Forwarded-For", "198.51.100.23")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-resend.test"
                                }
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Too many verification resend attempts for this email. Try again later."));
    }

    @Test
    void userCanEnrollMfaAndLoginWithChallenge() throws Exception {
        registerAndVerify(
                "Acme MFA",
                "security@acme-mfa.test",
                "owner@acme-mfa.test"
        );
        SessionResponse initialSession = login("owner@acme-mfa.test", "StrongPass@123");

        mockMvc.perform(get("/api/auth/mfa/status")
                        .header("Authorization", bearer(initialSession.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        JsonNode startEnrollmentJson = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/mfa/enroll/start")
                                .header("Authorization", bearer(initialSession.accessToken())))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.challengeId").isString())
                        .andExpect(jsonPath("$.secret").isString())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        String enrollmentChallengeId = startEnrollmentJson.get("challengeId").asText();
        String enrollmentSecret = startEnrollmentJson.get("secret").asText();

        mockMvc.perform(post("/api/auth/mfa/enroll/confirm")
                        .header("Authorization", bearer(initialSession.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId": "%s",
                                  "code": "%s"
                                }
                                """.formatted(
                                enrollmentChallengeId,
                                mfaTotpService.currentCode(enrollmentSecret, Instant.now())
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.enrolledAt").isString());

        JsonNode challengedLoginJson = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "owner@acme-mfa.test",
                                          "password": "StrongPass@123"
                                        }
                                        """))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.mfaRequired").value(true))
                        .andExpect(jsonPath("$.mfaChallengeId").isString())
                        .andExpect(jsonPath("$.user.mfaEnabled").value(true))
                        .andExpect(cookie().doesNotExist("tijoir_refresh"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        SessionResponse completedSession = verifyMfaChallenge(
                challengedLoginJson.get("mfaChallengeId").asText(),
                mfaTotpService.currentCode(enrollmentSecret, Instant.now())
        );

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearer(completedSession.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.mfaEnabled").value(true))
                .andExpect(jsonPath("$.organization.slug").value("acme-mfa"));
    }

    @Test
    void mfaChallengeLocksAfterRepeatedFailuresAndCanBeDisabled() throws Exception {
        registerAndVerify(
                "Acme MFA Disable",
                "security@acme-mfa-disable.test",
                "owner@acme-mfa-disable.test"
        );
        SessionResponse initialSession = login("owner@acme-mfa-disable.test", "StrongPass@123");

        JsonNode startEnrollmentJson = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/mfa/enroll/start")
                                .header("Authorization", bearer(initialSession.accessToken())))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        String enrollmentChallengeId = startEnrollmentJson.get("challengeId").asText();
        String enrollmentSecret = startEnrollmentJson.get("secret").asText();

        mockMvc.perform(post("/api/auth/mfa/enroll/confirm")
                        .header("Authorization", bearer(initialSession.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId": "%s",
                                  "code": "%s"
                                }
                                """.formatted(
                                enrollmentChallengeId,
                                mfaTotpService.currentCode(enrollmentSecret, Instant.now())
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));

        JsonNode loginChallengeJson = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "owner@acme-mfa-disable.test",
                                          "password": "StrongPass@123"
                                        }
                                        """))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        String challengeId = loginChallengeJson.get("mfaChallengeId").asText();
        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/auth/mfa/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "challengeId": "%s",
                                      "code": "000000"
                                    }
                                    """.formatted(challengeId)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid MFA code"));
        }

        mockMvc.perform(post("/api/auth/mfa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId": "%s",
                                  "code": "000000"
                                }
                                """.formatted(challengeId)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("MFA challenge has been locked after too many failed attempts"));

        JsonNode freshChallengeJson = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "owner@acme-mfa-disable.test",
                                          "password": "StrongPass@123"
                                        }
                                        """))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        SessionResponse mfaSession = verifyMfaChallenge(
                freshChallengeJson.get("mfaChallengeId").asText(),
                mfaTotpService.currentCode(enrollmentSecret, Instant.now())
        );

        mockMvc.perform(post("/api/auth/mfa/disable")
                        .header("Authorization", bearer(mfaSession.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "password": "StrongPass@123",
                                  "code": "%s"
                                }
                                """.formatted(mfaTotpService.currentCode(enrollmentSecret, Instant.now()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-mfa-disable.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaRequired").doesNotExist())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(cookie().exists("tijoir_refresh"));
    }

    private void registerAndVerify(
            String organizationName,
            String organizationEmail,
            String userEmail
    ) throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "%s",
                                  "organizationEmail": "%s",
                                  "userName": "Acme Owner",
                                  "userEmail": "%s",
                                  "password": "StrongPass@123"
                                }
                                """.formatted(organizationName, organizationEmail, userEmail)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String verificationToken = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk());
    }

    private SessionResponse login(String email, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(cookie().exists("tijoir_refresh"))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return new SessionResponse(
                loginJson.get("accessToken").asText(),
                loginResult.getResponse().getCookie("tijoir_refresh").getValue()
        );
    }

    private SessionResponse verifyMfaChallenge(String challengeId, String code) throws Exception {
        MvcResult verifyResult = mockMvc.perform(post("/api/auth/mfa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId": "%s",
                                  "code": "%s"
                                }
                                """.formatted(challengeId, code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(cookie().exists("tijoir_refresh"))
                .andReturn();

        JsonNode verifyJson = objectMapper.readTree(verifyResult.getResponse().getContentAsString());
        return new SessionResponse(
                verifyJson.get("accessToken").asText(),
                verifyResult.getResponse().getCookie("tijoir_refresh").getValue()
        );
    }

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }

    private record SessionResponse(String accessToken, String refreshToken) {
    }
}
