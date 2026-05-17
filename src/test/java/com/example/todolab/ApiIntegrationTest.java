package com.example.todolab;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void unauthenticatedEndpointsAreProtectedButHealthIsPublic() throws Exception {
        mockMvc.perform(get("/"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/projects"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk());
    }

    @Test
    void registerLoginAndMeFlowWorks() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "email": "student@example.com",
                      "password": "secret123",
                      "displayName": "Student User"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("student@example.com"));

        MockHttpSession session = login("student@example.com", "secret123");

        mockMvc.perform(get("/auth/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("student@example.com"))
            .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    void userCannotAccessAdminEndpoints() throws Exception {
        MockHttpSession session = login("demo@example.com", "user123");

        mockMvc.perform(get("/users").session(session))
            .andExpect(status().isForbidden());
    }

    @Test
    void demoUserCanManageOwnEntities() throws Exception {
        MockHttpSession session = login("demo@example.com", "user123");

        Long projectId = extractId(mockMvc.perform(post("/projects")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "name": "Exam Project",
                      "description": "Project for API flow test"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Exam Project"))
            .andReturn());

        Long taskListId = extractId(mockMvc.perform(post("/task-lists")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "name": "In Progress",
                      "projectId": %d
                    }
                    """.formatted(projectId)))
            .andExpect(status().isOk())
            .andReturn());

        Long tagId = extractId(mockMvc.perform(post("/tags")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "name": "API",
                      "color": "#123ABC"
                    }
                    """))
            .andExpect(status().isOk())
            .andReturn());

        Long taskId = extractId(mockMvc.perform(post("/tasks")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "title": "Prepare defence",
                      "description": "Show CRUD and auth",
                      "status": "TODO",
                      "priority": "MEDIUM",
                      "taskListId": %d,
                      "tagIds": [%d]
                    }
                    """.formatted(taskListId, tagId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.taskListId").value(taskListId))
            .andReturn());

        mockMvc.perform(patch("/tasks/{id}/status", taskId)
                .session(session)
                .param("status", "DONE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DONE"));

        mockMvc.perform(patch("/tasks/{id}/priority", taskId)
                .session(session)
                .param("priority", "HIGH"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.priority").value("HIGH"));

        mockMvc.perform(put("/tasks/{id}", taskId)
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "title": "Prepare defence",
                      "description": "Updated defence checklist",
                      "status": "DONE",
                      "priority": "HIGH",
                      "taskListId": %d,
                      "tagIds": [%d]
                    }
                    """.formatted(taskListId, tagId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("Updated defence checklist"));

        mockMvc.perform(get("/tasks")
                .session(session)
                .param("status", "DONE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());

        Long commentId = extractId(mockMvc.perform(post("/comments")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "text": "Need to mention Liquibase",
                      "taskId": %d
                    }
                    """.formatted(taskId)))
            .andExpect(status().isOk())
            .andReturn());

        Long reminderId = extractId(mockMvc.perform(post("/reminders")
                .session(session)
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "remindAt": "2026-05-07T10:00:00",
                      "channel": "IN_APP",
                      "taskId": %d
                    }
                    """.formatted(taskId)))
            .andExpect(status().isOk())
            .andReturn());

        mockMvc.perform(delete("/comments/{id}", commentId).session(session))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/reminders/{id}", reminderId).session(session))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/tasks/{id}", taskId).session(session))
            .andExpect(status().isOk());
    }

    private MockHttpSession login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(APPLICATION_JSON)
                .content("""
                    {
                      "email": "%s",
                      "password": "%s"
                    }
                    """.formatted(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        assertThat(result.getRequest().getSession(false)).isInstanceOf(MockHttpSession.class);
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private Long extractId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }
}
