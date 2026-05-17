package com.example.todolab.dto;

import com.example.todolab.entity.RoleName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserUpdateRequest(
    @NotBlank @Size(max = 120) String displayName,
    @NotNull Boolean enabled,
    @NotNull Set<RoleName> roleNames
) {
}
