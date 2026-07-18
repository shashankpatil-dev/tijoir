package com.tijoir.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdentityMembershipSyncIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IdentityUserRepository identityUserRepository;

    @Autowired
    private OrganizationMembershipRepository organizationMembershipRepository;

    @Test
    void registerCreatesShadowIdentityAndMembership() throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "Acme Shadow",
                                  "organizationEmail": "security@acme-shadow.test",
                                  "userName": "Shadow Owner",
                                  "userEmail": "owner@acme-shadow.test",
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

        IdentityUser identityUser = identityUserRepository.findByEmailIgnoreCase("owner@acme-shadow.test").orElseThrow();
        assertThat(identityUser.getLegacyUserId()).isNotNull();
        assertThat(identityUser.getEmailVerifiedAt()).isNotNull();

        OrganizationMembership membership = organizationMembershipRepository.findByLegacyUserId(identityUser.getLegacyUserId()).orElseThrow();
        assertThat(membership.getIdentityUser().getId()).isEqualTo(identityUser.getId());
        assertThat(membership.getStatus()).isEqualTo(OrganizationMembershipStatus.ACTIVE);
        assertThat(membership.getRole().name()).isEqualTo("ORG_OWNER");
    }

    @Test
    void inviteAcceptanceRoleChangeAndRemovalStayMirrored() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Mirror Ops", "owner@acme-mirror-ops.test");

        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "member@acme-mirror-ops.test",
                                  "role": "VIEWER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();
        String acceptedResponse = mockMvc.perform(post("/api/organization/invites/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "name": "Mirror Member",
                                  "password": "MemberPass@123"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode acceptedJson = objectMapper.readTree(acceptedResponse);
        String memberId = acceptedJson.get("user").get("id").asText();

        IdentityUser identityUser = identityUserRepository.findByEmailIgnoreCase("member@acme-mirror-ops.test").orElseThrow();
        OrganizationMembership membership = organizationMembershipRepository.findByLegacyUserId(identityUser.getLegacyUserId()).orElseThrow();
        assertThat(membership.getStatus()).isEqualTo(OrganizationMembershipStatus.ACTIVE);
        assertThat(membership.getRole().name()).isEqualTo("VIEWER");

        mockMvc.perform(patch("/api/organization/members/" + memberId + "/role")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isOk());

        membership = organizationMembershipRepository.findByLegacyUserId(identityUser.getLegacyUserId()).orElseThrow();
        assertThat(membership.getRole().name()).isEqualTo("MEMBER");

        mockMvc.perform(delete("/api/organization/members/" + memberId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        membership = organizationMembershipRepository.findByLegacyUserId(identityUser.getLegacyUserId()).orElseThrow();
        assertThat(membership.getStatus()).isEqualTo(OrganizationMembershipStatus.REMOVED);
        assertThat(membership.getDeactivatedAt()).isNotNull();
    }

    private String registerVerifyAndLogin(String organizationName, String email) throws Exception {
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationName": "%s",
                                  "organizationEmail": "security+%s@test.example",
                                  "userName": "Owner User",
                                  "userEmail": "%s",
                                  "password": "StrongPass@123"
                                }
                                """.formatted(organizationName, email.replace("@", "-"), email)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String verificationToken = objectMapper.readTree(registerResponse).get("emailVerificationToken").asText();
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
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }
}
