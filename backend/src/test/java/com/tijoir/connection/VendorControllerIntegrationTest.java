package com.tijoir.connection;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.identity.IdentityMembershipSyncService;
import com.tijoir.organization.OrganizationRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VendorControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private IdentityMembershipSyncService identityMembershipSyncService;

    @Test
    void ownerCanCreateContractShareLinkAndOffboardVendor() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Vendor Ops", "owner@acme-vendor-ops.test");

        String vendorResponse = mockMvc.perform(post("/api/vendors")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "PayU",
                                  "contactName": "Vendor Operator",
                                  "contactEmail": "ops@payu.test",
                                  "notes": "Primary SFTP vendor"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String vendorId = objectMapper.readTree(vendorResponse).get("id").asText();
        String secretId = createSecret(ownerToken, "PayU SFTP", "SFTP_PASSWORD", "VendorPass@123");

        String contractResponse = mockMvc.perform(post("/api/vendors/" + vendorId + "/contracts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "permission": "VIEW_UNTIL_REVOKED"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vendorName").value("PayU"))
                .andExpect(jsonPath("$.permission").value("VIEW_UNTIL_REVOKED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String contractId = objectMapper.readTree(contractResponse).get("id").asText();

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
                .andExpect(jsonPath("$.secretKey").value("payu-sftp"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String grantId = objectMapper.readTree(grantResponse).get("id").asText();

        String shareResponse = mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "permission": "VIEW_UNTIL_REVOKED",
                                  "vendorId": "%s",
                                  "contractId": "%s",
                                  "grantId": "%s",
                                  "recipientLabel": "PayU primary operator"
                                }
                                """.formatted(secretId, vendorId, contractId, grantId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vendorId").value(vendorId))
                .andExpect(jsonPath("$.contractId").value(contractId))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(shareResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/vendors?page=0&size=10&query=payu")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("PayU"));

        mockMvc.perform(get("/api/vendors/" + vendorId + "/contracts")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].grantCount").value(1));

        mockMvc.perform(post("/api/vendors/" + vendorId + "/offboard")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offboarded").value(true))
                .andExpect(jsonPath("$.revokedContracts").value(1))
                .andExpect(jsonPath("$.revokedShareLinks").value(1));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Share link has been revoked"));

        mockMvc.perform(get("/api/vendors/" + vendorId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/vendors/" + vendorId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OFFBOARDED"));
    }

    @Test
    void viewerCannotManageVendors() throws Exception {
        String ownerEmail = "owner@acme-vendor-viewer.test";
        String ownerToken = registerVerifyAndLogin("Acme Vendor Viewer", ownerEmail);

        UserAccount owner = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(ownerEmail).orElseThrow();
        UserAccount viewer = new UserAccount(
                organizationRepository.findById(owner.getOrganization().getId()).orElseThrow(),
                "Viewer User",
                "viewer@acme-vendor-viewer.test",
                passwordEncoder.encode("ViewerPass@123"),
                UserRole.VIEWER
        );
        viewer.markEmailVerified();
        userAccountRepository.save(viewer);
        identityMembershipSyncService.mirrorLegacyUser(viewer);
        String viewerToken = login("viewer@acme-vendor-viewer.test", "ViewerPass@123");

        mockMvc.perform(post("/api/vendors")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Blocked Vendor"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage vendors"));
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
