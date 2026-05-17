package com.example.todolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskListCreateRequest(
    @NotBlank @Size(max = 150) String name,
    @NotNull Long projectId
) {
}
