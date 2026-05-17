package com.example.todolab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommentCreateRequest(
    @NotBlank @Size(max = 2000) String text,
    @NotNull Long taskId
) {
}
