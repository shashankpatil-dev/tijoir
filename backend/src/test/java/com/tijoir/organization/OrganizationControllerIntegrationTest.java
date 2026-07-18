package com.tijoir.organization;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class OrganizationControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void ownerCanInviteAcceptAndListMembers() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Members", "owner@acme-members.test");

        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "member@acme-members.test",
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.inviteToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();

        mockMvc.perform(post("/api/organization/invites/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "name": "Member User",
                                  "password": "MemberPass@123"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("MEMBER"))
                .andExpect(jsonPath("$.organization.slug").value("acme-members"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("tijoir_refresh"));

        mockMvc.perform(get("/api/organization/members")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].role").value("ORG_OWNER"))
                .andExpect(jsonPath("$.items[1].role").value("MEMBER"));

        mockMvc.perform(get("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("ACCEPTED"));

        mockMvc.perform(get("/api/organization/members?page=0&size=1&query=member&role=MEMBER")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].email").value("member@acme-members.test"));

        String invitedUserToken = login("member@acme-members.test", "MemberPass@123");
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + invitedUserToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("MEMBER"));
    }

    @Test
    void adminCanInviteMembersButCannotInviteAdminsAndMembersCannotManageOrganizationUsers() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Admin", "owner@acme-admin.test");
        String adminToken = inviteAndAccept(ownerToken, "admin@acme-admin.test", "ADMIN", "Admin User", "AdminPass@123");

        mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "member@acme-admin.test",
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("MEMBER"));

        mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin-two@acme-admin.test",
                                  "role": "ADMIN"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Admins cannot invite other admins"));

        String memberToken = inviteAndAccept(ownerToken, "member-two@acme-admin.test", "MEMBER", "Member User", "MemberPass@123");

        mockMvc.perform(get("/api/organization/members")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage organization members"));

        mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "blocked@acme-admin.test",
                                  "role": "VIEWER"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to manage organization members"));
    }

    @Test
    void ownerCanUpdateAndRemoveMembersWhileAdminsCannotRemoveOwners() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Role Ops", "owner@acme-role-ops.test");
        String adminToken = inviteAndAccept(ownerToken, "admin@acme-role-ops.test", "ADMIN", "Admin User", "AdminPass@123");

        String memberInviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "viewer@acme-role-ops.test",
                                  "role": "VIEWER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String memberInviteToken = objectMapper.readTree(memberInviteResponse).get("inviteToken").asText();
        String acceptedResponse = mockMvc.perform(post("/api/organization/invites/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "name": "Viewer User",
                                  "password": "ViewerPass@123"
                                }
                                """.formatted(memberInviteToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode acceptedJson = objectMapper.readTree(acceptedResponse);
        String viewerId = acceptedJson.get("user").get("id").asText();

        mockMvc.perform(patch("/api/organization/members/" + viewerId + "/role")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MEMBER"));

        JsonNode ownerJson = objectMapper.readTree(
                mockMvc.perform(get("/api/auth/me")
                                .header("Authorization", "Bearer " + ownerToken))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );
        String ownerId = ownerJson.get("user").get("id").asText();

        mockMvc.perform(delete("/api/organization/members/" + ownerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("ORG_OWNER removal is not supported"));

        mockMvc.perform(delete("/api/organization/members/" + viewerId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "viewer@acme-role-ops.test",
                                  "password": "ViewerPass@123"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/organization/members")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));
    }

    @Test
    void ownerCanReadAndUpdateOrganizationPolicy() throws Exception {
        String ownerToken = registerVerifyAndLogin("Acme Policy", "owner@acme-policy.test");

        mockMvc.perform(get("/api/organization/policy")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requireVendorContractForShareLinks").value(false))
                .andExpect(jsonPath("$.allowViewOnce").value(true))
                .andExpect(jsonPath("$.allowViewUntilRevoked").value(true))
                .andExpect(jsonPath("$.allowRotationNotifyOnly").value(true));

        mockMvc.perform(put("/api/organization/policy")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "defaultShareLinkExpiryHours": 72,
                                  "requireVendorContractForShareLinks": true,
                                  "allowViewOnce": true,
                                  "allowViewUntilRevoked": true,
                                  "allowRotationNotifyOnly": false,
                                  "rotationReminderDays": 14
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultShareLinkExpiryHours").value(72))
                .andExpect(jsonPath("$.requireVendorContractForShareLinks").value(true))
                .andExpect(jsonPath("$.allowRotationNotifyOnly").value(false))
                .andExpect(jsonPath("$.rotationReminderDays").value(14));

        mockMvc.perform(get("/api/organization/policy")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultShareLinkExpiryHours").value(72))
                .andExpect(jsonPath("$.requireVendorContractForShareLinks").value(true));
    }

    @Test
    void existingIdentityCanAcceptInviteIntoSecondOrganizationAndSwitchWorkspaces() throws Exception {
        String memberEmail = "member@multi-org.test";
        String firstOrgSessionToken = registerVerifyAndLogin("Alpha Org", memberEmail);

        String secondOrgOwnerToken = registerVerifyAndLogin("Beta Org", "owner@beta-org.test");
        String secondOrgInviteResponse = mockMvc.perform(post("/api/organization/invites")
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

        String inviteToken = objectMapper.readTree(secondOrgInviteResponse).get("inviteToken").asText();

        String acceptedResponse = mockMvc.perform(post("/api/organization/invites/accept")
                        .header("Authorization", "Bearer " + firstOrgSessionToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("beta-org"))
                .andExpect(jsonPath("$.user.email").value(memberEmail))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.memberships.length()").value(2))
                .andExpect(jsonPath("$.memberships[0].organizationSlug").value("alpha-org"))
                .andExpect(jsonPath("$.memberships[1].organizationSlug").value("beta-org"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode acceptedJson = objectMapper.readTree(acceptedResponse);
        String betaOrgAccessToken = acceptedJson.get("accessToken").asText();
        String alphaOrganizationId = acceptedJson.get("memberships").get(0).get("organizationId").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + betaOrgAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("beta-org"))
                .andExpect(jsonPath("$.memberships.length()").value(2));

        mockMvc.perform(post("/api/auth/switch-organization")
                        .header("Authorization", "Bearer " + betaOrgAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationId": "%s"
                                }
                                """.formatted(alphaOrganizationId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.slug").value("alpha-org"))
                .andExpect(jsonPath("$.memberships.length()").value(2))
                .andExpect(jsonPath("$.memberships[0].active").value(true));
    }

    @Test
    void signedInUserCannotAcceptInviteForDifferentEmail() throws Exception {
        String signedInToken = registerVerifyAndLogin("Gamma Org", "wrong-user@test-org.test");
        String invitingOwnerToken = registerVerifyAndLogin("Delta Org", "owner@delta-org.test");

        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + invitingOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "target-user@test-org.test",
                                  "role": "MEMBER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();

        mockMvc.perform(post("/api/organization/invites/accept")
                        .header("Authorization", "Bearer " + signedInToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(inviteToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Sign in with the invited email to accept this invite"));
    }


    private String inviteAndAccept(
            String managerToken,
            String email,
            String role,
            String name,
            String password
    ) throws Exception {
        String inviteResponse = mockMvc.perform(post("/api/organization/invites")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "role": "%s"
                                }
                                """.formatted(email, role)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String inviteToken = objectMapper.readTree(inviteResponse).get("inviteToken").asText();

        mockMvc.perform(post("/api/organization/invites/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "name": "%s",
                                  "password": "%s"
                                }
                                """.formatted(inviteToken, name, password)))
                .andExpect(status().isOk());

        return login(email, password);
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
