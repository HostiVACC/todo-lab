package com.example.todolab.dto;

import java.util.Set;

public record AuthResponse(
    Long id,
    String email,
    String displayName,
    Set<String> roles
) {
}
