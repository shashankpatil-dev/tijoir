package com.tijoir.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

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
                .andExpect(jsonPath("$.message").value("Too many failed login attempts from this network. Try again later."));

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-cooldown.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(cookie().exists("tijoir_refresh"));
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

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }

    private record SessionResponse(String accessToken, String refreshToken) {
    }
}
