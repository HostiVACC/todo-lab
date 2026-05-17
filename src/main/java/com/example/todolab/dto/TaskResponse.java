package com.example.todolab.dto;

import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;

import java.time.LocalDate;
import java.util.Set;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    Long taskListId,
    String taskListName,
    Long projectId,
    Long assigneeId,
    String assigneeEmail,
    Set<TagResponse> tags
) {
}
