package com.example.todolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskListUpdateRequest(
    @NotBlank @Size(max = 150) String name
) {
}
