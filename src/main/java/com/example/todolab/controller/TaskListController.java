package com.example.todolab.controller;

import com.example.todolab.dto.TaskListCreateRequest;
import com.example.todolab.dto.TaskListResponse;
import com.example.todolab.dto.TaskListUpdateRequest;
import com.example.todolab.service.TaskListService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/task-lists")
public class TaskListController {

    private final TaskListService taskListService;

    public TaskListController(TaskListService taskListService) {
        this.taskListService = taskListService;
    }

    @GetMapping
    public List<TaskListResponse> getTaskLists(@RequestParam(required = false) Long projectId) {
        return taskListService.getTaskLists(projectId);
    }

    @GetMapping("/{id}")
    public TaskListResponse getTaskList(@PathVariable Long id) {
        return taskListService.getTaskList(id);
    }

    @PostMapping
    public TaskListResponse createTaskList(@Valid @RequestBody TaskListCreateRequest request) {
        return taskListService.createTaskList(request);
    }

    @PutMapping("/{id}")
    public TaskListResponse updateTaskList(@PathVariable Long id, @Valid @RequestBody TaskListUpdateRequest request) {
        return taskListService.updateTaskList(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteTaskList(@PathVariable Long id) {
        taskListService.deleteTaskList(id);
        return Map.of("message", "Task list deleted");
    }
}
