package com.example.todolab.dto;

import com.example.todolab.entity.ReminderChannel;

import java.time.LocalDateTime;

public record ReminderResponse(
    Long id,
    LocalDateTime remindAt,
    ReminderChannel channel,
    Long taskId,
    Long createdById
) {
}
