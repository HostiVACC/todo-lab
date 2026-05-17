package com.example.todolab.dto;

public record ProjectResponse(
    Long id,
    String name,
    String description,
    Long ownerId,
    String ownerEmail
) {
}
