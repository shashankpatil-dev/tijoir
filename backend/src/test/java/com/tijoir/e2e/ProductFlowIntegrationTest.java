package com.tijoir.e2e;

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
class ProductFlowIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void existingIdentityCanJoinSecondOrganizationAndSwitchWorkspaceEndToEnd() throws Exception {
        String memberEmail = "member@product-flow.test";
        String firstOrgToken = registerVerifyAndLogin("Alpha Product Org", memberEmail);
        String secondOrgOwnerToken = registerVerifyAndLogin("Beta Product Org", "owner@beta-product.test");

        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + secondOrgOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "role": "ADMIN"
                                }
                                """.formatted(memberEmail)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.inviteToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();

        String acceptedResponse = mockMvc.perform(post("/api/organization/invites/accept")
                        .header("Authorization", "Bearer " + firstOrgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("beta-product-org"))
                .andExpect(jsonPath("$.user.email").value(memberEmail))
                .andExpect(jsonPath("$.memberships.length()").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode acceptedJson = objectMapper.readTree(acceptedResponse);
        String secondOrgAccessToken = acceptedJson.get("accessToken").asText();
        String alphaOrganizationId = acceptedJson.get("memberships").get(0).get("organizationId").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + secondOrgAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("beta-product-org"))
                .andExpect(jsonPath("$.memberships.length()").value(2));

        mockMvc.perform(post("/api/auth/switch-organization")
                        .header("Authorization", "Bearer " + secondOrgAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationId": "%s"
                                }
                                """.formatted(alphaOrganizationId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("alpha-product-org"))
                .andExpect(jsonPath("$.memberships.length()").value(2));
    }

    @Test
    void linkedOrganizationsCanActivateContractRevealGrantAndConsumePublicShareEndToEnd() throws Exception {
        String ownerToken = registerVerifyAndLogin("Alpha Buyer Product", "owner@alpha-product.test");
        String counterpartyToken = registerVerifyAndLogin("Beta Vendor Product", "owner@beta-product-vendor.test");

        String vendorResponse = mockMvc.perform(post("/api/vendors")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Beta Vendor Product",
                                  "contactName": "Vendor Security Lead",
                                  "contactEmail": "owner@beta-product-vendor.test",
                                  "linkedOrganizationSlug": "beta-vendor-product"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkedOrganizationSlug").value("beta-vendor-product"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String vendorId = objectMapper.readTree(vendorResponse).get("id").asText();
        String secretId = createSecret(ownerToken, "Vendor DB Password", "PASSWORD", "VendorFlowPass@123");

        String contractResponse = mockMvc.perform(post("/api/vendors/" + vendorId + "/contracts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "permission": "VIEW_UNTIL_REVOKED"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PROPOSED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String contractId = objectMapper.readTree(contractResponse).get("id").asText();

        mockMvc.perform(get("/api/vendors/incoming-contracts")
                        .header("Authorization", "Bearer " + counterpartyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].status").value("PROPOSED"));

        mockMvc.perform(post("/api/vendors/contracts/" + contractId + "/accept")
                        .header("Authorization", "Bearer " + counterpartyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        String grantResponse = mockMvc.perform(post("/api/vendors/contracts/" + contractId + "/grants")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "permission": "VIEW_UNTIL_REVOKED"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String grantId = objectMapper.readTree(grantResponse).get("id").asText();

        mockMvc.perform(get("/api/vendors/contracts/" + contractId + "/grants")
                        .header("Authorization", "Bearer " + counterpartyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].canReveal").value(true));

        mockMvc.perform(post("/api/vendors/contracts/" + contractId + "/grants/" + grantId + "/reveal")
                        .header("Authorization", "Bearer " + counterpartyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("VendorFlowPass@123"))
                .andExpect(jsonPath("$.consumedAt").doesNotExist());

        String shareResponse = mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Beta primary operator",
                                  "permission": "VIEW_UNTIL_REVOKED",
                                  "vendorId": "%s",
                                  "contractId": "%s",
                                  "grantId": "%s"
                                }
                                """.formatted(secretId, vendorId, contractId, grantId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vendorId").value(vendorId))
                .andExpect(jsonPath("$.contractId").value(contractId))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(shareResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/public/share-links/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationName").value("Alpha Buyer Product"))
                .andExpect(jsonPath("$.permission").value("VIEW_UNTIL_REVOKED"))
                .andExpect(jsonPath("$.canReveal").value(true));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("VendorFlowPass@123"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void anonymousQuickShareEndToEnd() throws Exception {
        String createResponse = mockMvc.perform(post("/api/public/share-links/quick")
                        .header("X-Forwarded-For", "198.51.100.40")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretName": "Standalone SSH Password",
                                  "secretKey": "external-sftp-password",
                                  "secretType": "SFTP_PASSWORD",
                                  "value": "StandalonePass@123",
                                  "senderLabel": "External sender",
                                  "recipientLabel": "Vendor operator"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(createResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/public/share-links/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceType").value("ANONYMOUS"))
                .andExpect(jsonPath("$.canReveal").value(true));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("StandalonePass@123"))
                .andExpect(jsonPath("$.status").value("CONSUMED"));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Share link has already been consumed"));
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

        String token = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk());

        return login(ownerEmail, "StrongPass@123");
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
        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }
}
