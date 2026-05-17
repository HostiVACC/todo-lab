package com.example.todolab.dto;

public record TagResponse(
    Long id,
    String name,
    String color,
    Long ownerId
) {
}
