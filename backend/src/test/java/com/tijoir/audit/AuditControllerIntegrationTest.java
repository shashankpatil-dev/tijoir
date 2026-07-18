package com.tijoir.audit;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditControllerIntegrationTest {
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
    void ownerAndAuditorCanReviewAuditLogsButViewerCannot() throws Exception {
        String ownerEmail = "owner@acme-audit.test";
        String ownerToken = registerVerifyAndLogin("Acme Audit", ownerEmail);

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Audit API Key",
                                  "type": "API_KEY",
                                  "value": "audit-secret-value"
                                }
                                """))
                .andExpect(status().isCreated());

        UserAccount owner = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(ownerEmail).orElseThrow();

        UserAccount auditor = new UserAccount(
                organizationRepository.findById(owner.getOrganization().getId()).orElseThrow(),
                "Audit User",
                "auditor@acme-audit.test",
                passwordEncoder.encode("AuditPass@123"),
                UserRole.AUDITOR
        );
        auditor.markEmailVerified();
        userAccountRepository.save(auditor);
        identityMembershipSyncService.mirrorLegacyUser(auditor);

        UserAccount viewer = new UserAccount(
                organizationRepository.findById(owner.getOrganization().getId()).orElseThrow(),
                "Viewer User",
                "viewer@acme-audit.test",
                passwordEncoder.encode("ViewerPass@123"),
                UserRole.VIEWER
        );
        viewer.markEmailVerified();
        userAccountRepository.save(viewer);
        identityMembershipSyncService.mirrorLegacyUser(viewer);

        String auditorToken = login("auditor@acme-audit.test", "AuditPass@123");
        String viewerToken = login("viewer@acme-audit.test", "ViewerPass@123");

        mockMvc.perform(get("/api/audit-events?page=0&size=20&query=audit&action=SECRET_CREATED")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].action").value("SECRET_CREATED"))
                .andExpect(jsonPath("$.items[0].resourceType").value("SECRET"))
                .andExpect(jsonPath("$.items[0].actorEmail").value(ownerEmail));

        mockMvc.perform(get("/api/audit-events?page=0&size=20")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        mockMvc.perform(get("/api/audit-events/report")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").value(1))
                .andExpect(jsonPath("$.byAction.SECRET_CREATED").value(1))
                .andExpect(jsonPath("$.byResourceType.SECRET").value(1));

        mockMvc.perform(get("/api/audit-events/export")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("SECRET_CREATED")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(ownerEmail)));

        mockMvc.perform(get("/api/audit-events")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to review audit logs"));
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
