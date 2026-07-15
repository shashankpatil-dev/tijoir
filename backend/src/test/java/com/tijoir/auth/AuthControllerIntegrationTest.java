package com.tijoir.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.notification.NotificationRecord;
import com.tijoir.notification.NotificationRecordRepository;
import com.tijoir.notification.NotificationType;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    private UserAccountRepository userAccountRepository;

    @Autowired
    private NotificationRecordRepository notificationRecordRepository;

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

    @Test
    void passwordResetSetsNewPasswordAndBlocksOldOne() throws Exception {
        registerAndVerify("Acme Reset", "org@acme-reset.test", "owner@acme-reset.test");

        mockMvc.perform(post("/api/auth/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner@acme-reset.test\"}"))
                .andExpect(status().isOk());

        String resetToken = latestPasswordResetToken("owner@acme-reset.test");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + resetToken + "\",\"newPassword\":\"NewStrong@456\"}"))
                .andExpect(status().isOk());

        // Old password no longer works (unique IP so the failure counter stays isolated).
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "198.51.100.60")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-reset.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        // New password works.
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "198.51.100.61")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-reset.test",
                                  "password": "NewStrong@456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString());
    }

    @Test
    void passwordResetRejectsUnknownEmailWithGenericResponse() throws Exception {
        mockMvc.perform(post("/api/auth/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@nowhere.test\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void changePasswordRequiresCorrectCurrentPassword() throws Exception {
        registerAndVerify("Acme Change", "org@acme-change.test", "owner@acme-change.test");
        SessionResponse session = login("owner@acme-change.test", "StrongPass@123");

        mockMvc.perform(post("/api/auth/password/change")
                        .header("Authorization", bearer(session.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"WrongPass@000\",\"newPassword\":\"NewStrong@456\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/password/change")
                        .header("Authorization", bearer(session.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass@123\",\"newPassword\":\"NewStrong@456\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "198.51.100.70")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@acme-change.test",
                                  "password": "NewStrong@456"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void ownerCanUpdateDisplayName() throws Exception {
        registerAndVerify("Acme Profile", "org@acme-profile.test", "owner@acme-profile.test");
        SessionResponse session = login("owner@acme-profile.test", "StrongPass@123");

        mockMvc.perform(patch("/api/auth/me")
                        .header("Authorization", bearer(session.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Renamed Owner\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.name").value("Renamed Owner"));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.name").value("Renamed Owner"));
    }

    @Test
    void ownerCanRenameOrganization() throws Exception {
        registerAndVerify("Acme Org Rename", "org@acme-orgrename.test", "owner@acme-orgrename.test");
        SessionResponse session = login("owner@acme-orgrename.test", "StrongPass@123");

        mockMvc.perform(put("/api/organization")
                        .header("Authorization", bearer(session.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Acme Renamed Inc\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme Renamed Inc"));
    }

    @Test
    void twoStepSignupDefaultsOrganizationEmailToOwnerEmail() throws Exception {
        // Two-step signup omits organizationEmail; the backend defaults it to the owner email.
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Acme No Org Email",
                                  "userName": "Acme Owner",
                                  "userEmail": "owner@acme-noorgemail.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerificationToken").isString());
    }

    private String latestPasswordResetToken(String email) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(email)
                .orElseThrow(() -> new IllegalStateException("user not found"));
        NotificationRecord record = notificationRecordRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 20))
                .stream()
                .filter(candidate -> candidate.getType() == NotificationType.PASSWORD_RESET)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("no password reset notification"));
        Matcher matcher = Pattern.compile("token=([^&]+)").matcher(record.getActionUrl());
        if (!matcher.find()) {
            throw new IllegalStateException("no token in reset link");
        }
        return URLDecoder.decode(matcher.group(1), StandardCharsets.UTF_8);
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
