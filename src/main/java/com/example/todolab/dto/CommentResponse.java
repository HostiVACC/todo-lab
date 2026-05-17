package com.example.todolab.dto;

import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    String text,
    Long taskId,
    Long authorId,
    String authorEmail,
    LocalDateTime createdAt
) {
}
