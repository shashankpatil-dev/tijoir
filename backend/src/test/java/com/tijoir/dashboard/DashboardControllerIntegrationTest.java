package com.tijoir.dashboard;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void summaryReflectsMutationsAndCacheInvalidation() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Dashboard", "owner@acme-dashboard.test");

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secretCount").value(0))
                .andExpect(jsonPath("$.activeShareLinks").value(0))
                .andExpect(jsonPath("$.vendorCount").value(0))
                .andExpect(jsonPath("$.memberCount").value(1))
                .andExpect(jsonPath("$.pendingInvites").value(0));

        String secretId = createSecret(ownerToken, "Vendor API Key", "API_KEY", "super-secret-key");

        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "member@acme-dashboard.test",
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secretCount").value(1))
                .andExpect(jsonPath("$.memberCount").value(1))
                .andExpect(jsonPath("$.pendingInvites").value(1))
                .andExpect(jsonPath("$.latestSecret.secretKey").value("vendor-api-key"));

        mockMvc.perform(post("/api/organization/invites/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "name": "Member User",
                                  "password": "MemberPass@123"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk());

        String shareResponse = mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Primary vendor",
                                  "permission": "VIEW_ONCE"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(shareResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2))
                .andExpect(jsonPath("$.pendingInvites").value(0))
                .andExpect(jsonPath("$.activeShareLinks").value(1));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONSUMED"));

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeShareLinks").value(0));
    }

    private String createSecret(String ownerToken, String name, String type, String value) throws Exception {
        String createResponse = mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "type": "%s",
                                  "value": "%s"
                                }
                                """.formatted(name, type, value)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(createResponse).get("id").asText();
    }

    private String registerVerifyAndLogin(String organizationName, String ownerEmail) throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "%s",
                                  "organizationEmail": "security-%s",
                                  "userName": "Owner User",
                                  "userEmail": "%s",
                                  "password": "StrongPass@123"
                                }
                                """.formatted(organizationName, ownerEmail, ownerEmail)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode registerJson = objectMapper.readTree(registerResponse);
        String verificationToken = registerJson.get("emailVerificationToken").asText();

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk());

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "StrongPass@123"
                                }
                                """.formatted(ownerEmail)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }
}
