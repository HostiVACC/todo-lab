package com.example.todolab.controller;

import com.example.todolab.dto.ReminderCreateRequest;
import com.example.todolab.dto.ReminderResponse;
import com.example.todolab.dto.ReminderUpdateRequest;
import com.example.todolab.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    public List<ReminderResponse> getReminders(@RequestParam(required = false) Long taskId) {
        return reminderService.getReminders(taskId);
    }

    @GetMapping("/{id}")
    public ReminderResponse getReminder(@PathVariable Long id) {
        return reminderService.getReminder(id);
    }

    @PostMapping
    public ReminderResponse createReminder(@Valid @RequestBody ReminderCreateRequest request) {
        return reminderService.createReminder(request);
    }

    @PutMapping("/{id}")
    public ReminderResponse updateReminder(@PathVariable Long id, @Valid @RequestBody ReminderUpdateRequest request) {
        return reminderService.updateReminder(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteReminder(@PathVariable Long id) {
        reminderService.deleteReminder(id);
        return Map.of("message", "Reminder deleted");
    }
}
