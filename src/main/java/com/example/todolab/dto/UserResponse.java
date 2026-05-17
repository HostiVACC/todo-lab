package com.example.todolab.dto;

import java.util.Set;

public record UserResponse(
    Long id,
    String email,
    String displayName,
    boolean enabled,
    Set<String> roles
) {
}
