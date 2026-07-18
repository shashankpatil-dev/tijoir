package com.tijoir.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.notification.email.EmailMessage;
import com.tijoir.notification.email.EmailSender;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
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
class NotificationDeliveryFailureIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void verificationAndInviteExposeFailedDeliveryState() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Failure Delivery Org",
                                  "organizationEmail": "security@failure-delivery.test",
                                  "userName": "Owner User",
                                  "userEmail": "owner@failure-delivery.test",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailDeliveryStatus").value("FAILED"))
                .andExpect(jsonPath("$.emailDeliveryError").value("forced-email-delivery-failure"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String verificationToken = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + verificationToken + "\"}"))
                .andExpect(status().isOk());

        String ownerToken = login("owner@failure-delivery.test", "StrongPass@123");

        mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "member@failure-delivery.test",
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailDeliveryStatus").value("FAILED"))
                .andExpect(jsonPath("$.emailDeliveryError").value("forced-email-delivery-failure"));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].type").value("ORGANIZATION_INVITE"))
                .andExpect(jsonPath("$.items[0].emailDeliveryStatus").value("FAILED"))
                .andExpect(jsonPath("$.items[0].emailDeliveryError").value("forced-email-delivery-failure"))
                .andExpect(jsonPath("$.items[1].type").value("EMAIL_VERIFICATION"))
                .andExpect(jsonPath("$.items[1].emailDeliveryStatus").value("FAILED"))
                .andExpect(jsonPath("$.items[1].emailDeliveryError").value("forced-email-delivery-failure"));
    }

    private String login(String email, String password) throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(loginResponse);
        return json.get("accessToken").asText();
    }

    @TestConfiguration
    static class FailingEmailSenderConfig {
        @Bean
        @Primary
        EmailSender failingEmailSender() {
            return new EmailSender() {
                @Override
                public DeliveryResult send(EmailMessage message) {
                    return DeliveryResult.failed("forced-email-delivery-failure");
                }
            };
        }
    }
}
