package com.tijoir.secret;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.organization.Organization;
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
class SecretControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void ownerCanCreateListAndReadSecretMetadata() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Vault", "owner@acme-vault.test");

        String createResponse = mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Primary SFTP Password",
                                  "type": "SFTP_PASSWORD",
                                  "description": "Inbound file transfer credential",
                                  "value": "Sup3rSecretValue!"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Primary SFTP Password"))
                .andExpect(jsonPath("$.secretKey").value("primary-sftp-password"))
                .andExpect(jsonPath("$.type").value("SFTP_PASSWORD"))
                .andExpect(jsonPath("$.currentVersionNumber").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse);
        String secretId = created.get("id").asText();

        mockMvc.perform(get("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].secretKey").value("primary-sftp-password"));

        mockMvc.perform(get("/api/secrets/" + secretId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdByEmail").value("owner@acme-vault.test"))
                .andExpect(jsonPath("$.description").value("Inbound file transfer credential"));

        mockMvc.perform(post("/api/secrets/" + secretId + "/reveal")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("Sup3rSecretValue!"))
                .andExpect(jsonPath("$.versionNumber").value(1));

        mockMvc.perform(post("/api/secrets/" + secretId + "/rotate")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "value": "NewSup3rSecretValue!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentVersionNumber").value(2))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(post("/api/secrets/" + secretId + "/reveal")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("NewSup3rSecretValue!"))
                .andExpect(jsonPath("$.versionNumber").value(2));

        mockMvc.perform(post("/api/secrets/" + secretId + "/revoke")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVOKED"));
    }

    @Test
    void ownerCanGenerateCandidateSecretValue() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Generator", "owner@acme-generator.test");

        mockMvc.perform(post("/api/secrets/generate")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "PASSWORD",
                                  "length": 20
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PASSWORD"))
                .andExpect(jsonPath("$.length").value(20))
                .andExpect(jsonPath("$.value").isString());

        mockMvc.perform(post("/api/secrets/generate")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "SSH_PRIVATE_KEY",
                                  "length": 64
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Secret generation is not supported for SSH_PRIVATE_KEY"));
    }

    @Test
    void viewerCannotCreateSecrets() throws Exception {
        String ownerEmail = "owner@acme-viewer.test";
        String ownerToken = registerVerifyAndLogin("Acme Viewer", ownerEmail);
        UserAccount owner = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(ownerEmail).orElseThrow();
        Organization organization = organizationRepository.findById(owner.getOrganization().getId()).orElseThrow();

        UserAccount viewer = new UserAccount(
                organization,
                "Viewer User",
                "viewer@acme-viewer.test",
                passwordEncoder.encode("ViewerPass@123"),
                UserRole.VIEWER
        );
        viewer.markEmailVerified();
        userAccountRepository.save(viewer);

        String viewerToken = login("viewer@acme-viewer.test", "ViewerPass@123");

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Blocked Secret",
                                  "type": "API_KEY",
                                  "value": "blocked-value"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage secrets"));

        mockMvc.perform(post("/api/secrets/generate")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "API_KEY",
                                  "length": 32
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage secrets"));

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Invalid SSH Public Key",
                                  "type": "SSH_PUBLIC_KEY",
                                  "value": "not-a-real-ssh-key"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("SSH public key must be in OpenSSH public key format"));

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Vendor SSH Public Key",
                                  "type": "SSH_PUBLIC_KEY",
                                  "value": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB7testkeymaterial vendor@test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SSH_PUBLIC_KEY"));

        mockMvc.perform(get("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        mockMvc.perform(get("/api/secrets")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        mockMvc.perform(get("/api/secrets/00000000-0000-0000-0000-000000000001")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void secretListSupportsPaginationAndFilters() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Filter Vault", "owner@acme-filter-vault.test");

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Vendor Webhook Secret",
                                  "type": "WEBHOOK_SECRET",
                                  "value": "vendor-secret"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Internal API Key",
                                  "type": "API_KEY",
                                  "value": "internal-api-key"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/secrets?page=0&size=1&query=vendor&type=WEBHOOK_SECRET")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.items[0].name").value("Vendor Webhook Secret"));
    }

    @Test
    void createSecretWithSameIdempotencyKeyReturnsOriginalResponse() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Idempotent Vault", "owner@acme-idempotent-vault.test");
        String idempotencyKey = "secret-create-key";

        String firstResponse = mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Vendor API Secret",
                                  "type": "API_KEY",
                                  "value": "super-secret-key"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String secondResponse = mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Vendor API Secret",
                                  "type": "API_KEY",
                                  "value": "super-secret-key"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode first = objectMapper.readTree(firstResponse);
        JsonNode second = objectMapper.readTree(secondResponse);

        org.junit.jupiter.api.Assertions.assertEquals(first.get("id").asText(), second.get("id").asText());

        mockMvc.perform(get("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void reusedIdempotencyKeyWithDifferentSecretPayloadConflicts() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Conflict Vault", "owner@acme-conflict-vault.test");
        String idempotencyKey = "secret-conflict-key";

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Primary API Secret",
                                  "type": "API_KEY",
                                  "value": "first-secret-value"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/secrets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Secondary API Secret",
                                  "type": "API_KEY",
                                  "value": "second-secret-value"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Idempotency key was already used for a different request"));
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
