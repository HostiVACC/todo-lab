package com.example.todolab.dto;

import com.example.todolab.entity.ReminderChannel;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ReminderCreateRequest(
    @NotNull LocalDateTime remindAt,
    @NotNull ReminderChannel channel,
    @NotNull Long taskId
) {
}
