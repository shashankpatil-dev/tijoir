package com.tijoir.auth;

import com.tijoir.auth.security.GoogleTokenVerifier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoogleAuthIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GoogleTokenVerifier googleTokenVerifier;

    @Test
    void newGoogleUserNeedsOrganizationThenRegistersAndLogsIn() throws Exception {
        when(googleTokenVerifier.verify(anyString())).thenReturn(
                new GoogleTokenVerifier.GoogleIdentity("google-sub-1", "gowner@acme-g.test", "Google Owner", true));

        // First exchange for a brand-new identity → needs an organization.
        mockMvc.perform(post("/api/auth/google/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"stub-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needsOrganization").value(true))
                .andExpect(jsonPath("$.session").doesNotExist());

        // Register creates the org + owner (email pre-verified, no password) and issues a session.
        mockMvc.perform(post("/api/auth/google/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"stub-token\",\"organizationName\":\"Google Org\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.emailVerified").value(true))
                .andExpect(cookie().exists("tijoir_refresh"));

        // A subsequent exchange now logs the existing Google user straight in.
        mockMvc.perform(post("/api/auth/google/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"stub-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needsOrganization").value(false))
                .andExpect(jsonPath("$.session.accessToken").isString());
    }

    @Test
    void googleRegisterRejectsAnEmailThatAlreadyExists() throws Exception {
        when(googleTokenVerifier.verify(anyString())).thenReturn(
                new GoogleTokenVerifier.GoogleIdentity("google-sub-2", "dupe@acme-g.test", "Dup Owner", true));

        mockMvc.perform(post("/api/auth/google/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"stub-token\",\"organizationName\":\"Dup Org\"}"))
                .andExpect(status().isOk());

        // One org per user: a second registration for the same email is rejected.
        mockMvc.perform(post("/api/auth/google/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"stub-token\",\"organizationName\":\"Dup Org 2\"}"))
                .andExpect(status().isConflict());
    }
}
