package com.example.todolab.service;

import com.example.todolab.dto.ReminderCreateRequest;
import com.example.todolab.dto.ReminderResponse;
import com.example.todolab.dto.ReminderUpdateRequest;
import com.example.todolab.entity.ReminderEntity;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.exception.ResourceAccessDeniedException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.ReminderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final TaskService taskService;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public ReminderService(ReminderRepository reminderRepository,
                           TaskService taskService,
                           CurrentUserService currentUserService,
                           ApiMapper apiMapper) {
        this.reminderRepository = reminderRepository;
        this.taskService = taskService;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> getReminders(Long taskId) {
        List<ReminderEntity> reminders;
        if (taskId != null) {
            taskService.findAccessibleTask(taskId);
            reminders = reminderRepository.findAllByTaskId(taskId);
        } else {
            reminders = currentUserService.isAdmin()
                ? reminderRepository.findAll()
                : reminderRepository.findAllByTaskTaskListProjectOwnerId(currentUserService.getCurrentUserId());
        }
        return reminders.stream().map(apiMapper::toReminderResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReminderResponse getReminder(Long id) {
        return apiMapper.toReminderResponse(findAccessibleReminder(id));
    }

    @Transactional
    public ReminderResponse createReminder(ReminderCreateRequest request) {
        ReminderEntity reminder = new ReminderEntity();
        reminder.setRemindAt(request.remindAt());
        reminder.setChannel(request.channel());
        reminder.setTask(taskService.findAccessibleTask(request.taskId()));
        reminder.setCreatedBy(currentUserService.getCurrentUserEntity());
        return apiMapper.toReminderResponse(reminderRepository.save(reminder));
    }

    @Transactional
    public ReminderResponse updateReminder(Long id, ReminderUpdateRequest request) {
        ReminderEntity reminder = findAccessibleReminder(id);
        ensureReminderEditable(reminder);
        reminder.setRemindAt(request.remindAt());
        reminder.setChannel(request.channel());
        return apiMapper.toReminderResponse(reminder);
    }

    @Transactional
    public void deleteReminder(Long id) {
        ReminderEntity reminder = findAccessibleReminder(id);
        ensureReminderEditable(reminder);
        reminderRepository.delete(reminder);
    }

    @Transactional(readOnly = true)
    public ReminderEntity findAccessibleReminder(Long id) {
        if (currentUserService.isAdmin()) {
            return reminderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reminder with id " + id + " was not found"));
        }
        return reminderRepository.findByIdAndTaskTaskListProjectOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Reminder with id " + id + " was not found"));
    }

    private void ensureReminderEditable(ReminderEntity reminder) {
        if (currentUserService.isAdmin()) {
            return;
        }
        if (!reminder.getCreatedBy().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ResourceAccessDeniedException("Only the reminder creator can modify this reminder");
        }
    }
}
