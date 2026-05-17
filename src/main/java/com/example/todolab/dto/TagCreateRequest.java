package com.example.todolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TagCreateRequest(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Pattern(regexp = "^#?[A-Fa-f0-9]{6}$") String color
) {
}
