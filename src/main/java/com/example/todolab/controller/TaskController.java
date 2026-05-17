package com.example.todolab.controller;

import com.example.todolab.dto.TaskCreateRequest;
import com.example.todolab.dto.TaskResponse;
import com.example.todolab.dto.TaskUpdateRequest;
import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;
import com.example.todolab.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public Page<TaskResponse> getTasks(@RequestParam(required = false) Long projectId,
                                       @RequestParam(required = false) Long taskListId,
                                       @RequestParam(required = false) TaskStatus status,
                                       @RequestParam(required = false) TaskPriority priority,
                                       @RequestParam(required = false) Long assigneeId,
                                       @RequestParam(required = false) LocalDate dueDateFrom,
                                       @RequestParam(required = false) LocalDate dueDateTo,
                                       @PageableDefault(sort = "id") Pageable pageable) {
        return taskService.getTasks(projectId, taskListId, status, priority, assigneeId, dueDateFrom, dueDateTo, pageable);
    }

    @GetMapping("/{id}")
    public TaskResponse getTask(@PathVariable Long id) {
        return taskService.getTask(id);
    }

    @PostMapping
    public TaskResponse createTask(@Valid @RequestBody TaskCreateRequest request) {
        return taskService.createTask(request);
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskUpdateRequest request) {
        return taskService.updateTask(id, request);
    }

    @PatchMapping("/{id}/assignee")
    public TaskResponse assignTask(@PathVariable Long id, @RequestParam(required = false) Long assigneeId) {
        return taskService.assignTask(id, assigneeId);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse changeStatus(@PathVariable Long id, @RequestParam TaskStatus status) {
        return taskService.changeStatus(id, status);
    }

    @PatchMapping("/{id}/priority")
    public TaskResponse changePriority(@PathVariable Long id, @RequestParam TaskPriority priority) {
        return taskService.changePriority(id, priority);
    }

    @PostMapping("/{id}/tags/{tagId}")
    public TaskResponse addTag(@PathVariable Long id, @PathVariable Long tagId) {
        return taskService.addTag(id, tagId);
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public TaskResponse removeTag(@PathVariable Long id, @PathVariable Long tagId) {
        return taskService.removeTag(id, tagId);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return Map.of("message", "Task deleted");
    }
}
