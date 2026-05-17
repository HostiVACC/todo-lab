package com.example.todolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 1000) String description
) {
}
