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
}
