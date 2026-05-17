package com.example.todolab.dto;

import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record TaskCreateRequest(
    @NotBlank @Size(max = 160) String title,
    @Size(max = 2000) String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    Long assigneeId,
    @NotNull Long taskListId,
    Set<Long> tagIds
) {
}
