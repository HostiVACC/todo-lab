package com.example.todolab.dto;

public record TaskListResponse(
    Long id,
    String name,
    Long projectId,
    String projectName
) {
}
