package com.tijoir.sharelink;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.OrganizationRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import com.tijoir.secret.VaultSecret;
import com.tijoir.secret.VaultSecretRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShareLinkControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private VaultSecretRepository vaultSecretRepository;

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void viewOnceShareLinkCanBeConsumedOnlyOnce() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Share Once", "owner@acme-share-once.test");
        String secretId = createSecret(ownerToken, "Vendor API Key", "API_KEY", "super-secret-key");

        String createResponse = mockMvc.perform(post("/api/share-links")
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
                .andExpect(jsonPath("$.permission").value("VIEW_ONCE"))
                .andExpect(jsonPath("$.shareToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(createResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/public/share-links/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("VIEW_ONCE"))
                .andExpect(jsonPath("$.canReveal").value(true))
                .andExpect(jsonPath("$.secretName").value("Vendor API Key"));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("super-secret-key"))
                .andExpect(jsonPath("$.status").value("CONSUMED"));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Share link has already been consumed"));
    }

    @Test
    void revokedShareLinkCannotBeConsumed() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Revoke", "owner@acme-revoke.test");
        String secretId = createSecret(ownerToken, "Vendor SSH Key", "SSH_PUBLIC_KEY", "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB7testkeymaterial vendor@test");

        String createResponse = mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Revoked vendor",
                                  "permission": "VIEW_UNTIL_REVOKED"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        String shareLinkId = created.get("id").asText();
        String shareToken = created.get("shareToken").asText();

        mockMvc.perform(post("/api/share-links/" + shareLinkId + "/revoke")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVOKED"));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Share link has been revoked"));
    }

    @Test
    void rotationNotifyOnlyShareLinkExposesMetadataButNoReveal() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Notify", "owner@acme-notify.test");
        String secretId = createSecret(ownerToken, "Webhook Secret", "WEBHOOK_SECRET", "notify-secret");

        String createResponse = mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Notify-only vendor",
                                  "permission": "ROTATION_NOTIFY_ONLY"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String shareToken = objectMapper.readTree(createResponse).get("shareToken").asText();

        mockMvc.perform(get("/api/public/share-links/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("ROTATION_NOTIFY_ONLY"))
                .andExpect(jsonPath("$.canReveal").value(false));

        mockMvc.perform(post("/api/public/share-links/" + shareToken + "/consume"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("This share link does not permit secret reveal"));
    }

    @Test
    void expiredShareLinkReportsExpiredStatusAndCannotBeConsumed() throws Exception {
        String ownerEmail = "owner@acme-expired.test";
        String ownerToken = registerVerifyAndLogin("Acme Expired", ownerEmail);
        String secretId = createSecret(ownerToken, "Expired Password", "PASSWORD", "ExpiredPass@123");

        UserAccount owner = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(ownerEmail).orElseThrow();
        VaultSecret secret = vaultSecretRepository.findById(UUID.fromString(secretId)).orElseThrow();
        String rawToken = "expired-public-token";
        shareLinkRepository.save(new ShareLink(
                owner.getOrganization(),
                secret,
                owner,
                "Expired vendor",
                CryptoUtil.sha256Hex(rawToken),
                ContractPermission.VIEW_ONCE,
                Instant.now().minusSeconds(60)
        ));

        mockMvc.perform(get("/api/public/share-links/" + rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXPIRED"))
                .andExpect(jsonPath("$.canReveal").value(false));

        mockMvc.perform(post("/api/public/share-links/" + rawToken + "/consume"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Share link has expired"));
    }

    @Test
    void viewerCannotManageShareLinks() throws Exception {
        String ownerEmail = "owner@acme-share-viewer.test";
        String ownerToken = registerVerifyAndLogin("Acme Share Viewer", ownerEmail);
        String secretId = createSecret(ownerToken, "Viewer Blocked Secret", "API_KEY", "blocked-value");

        UserAccount owner = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(ownerEmail).orElseThrow();
        UserAccount viewer = new UserAccount(
                organizationRepository.findById(owner.getOrganization().getId()).orElseThrow(),
                "Viewer User",
                "viewer@acme-share-viewer.test",
                passwordEncoder.encode("ViewerPass@123"),
                UserRole.VIEWER
        );
        viewer.markEmailVerified();
        userAccountRepository.save(viewer);

        String viewerToken = login("viewer@acme-share-viewer.test", "ViewerPass@123");

        mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Blocked",
                                  "permission": "VIEW_ONCE"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage share links"));

        mockMvc.perform(get("/api/share-links")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage share links"));
    }

    @Test
    void shareLinkListSupportsPaginationAndFilters() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Share Filters", "owner@acme-share-filters.test");
        String secretId = createSecret(ownerToken, "Vendor Shared Secret", "API_KEY", "shared-secret-value");

        mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Primary vendor",
                                  "permission": "VIEW_ONCE"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/share-links")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "secretId": "%s",
                                  "recipientLabel": "Backup vendor",
                                  "permission": "VIEW_UNTIL_REVOKED"
                                }
                                """.formatted(secretId)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/share-links?page=0&size=1&query=primary&permission=VIEW_ONCE")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].permission").value("VIEW_ONCE"))
                .andExpect(jsonPath("$.items[0].recipientLabel").value("Primary vendor"));
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
