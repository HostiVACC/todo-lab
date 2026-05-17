package com.example.todolab.service;

import com.example.todolab.dto.TaskCreateRequest;
import com.example.todolab.dto.TaskResponse;
import com.example.todolab.dto.TaskUpdateRequest;
import com.example.todolab.entity.TagEntity;
import com.example.todolab.entity.TaskEntity;
import com.example.todolab.entity.TaskListEntity;
import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;
import com.example.todolab.entity.UserEntity;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.CommentRepository;
import com.example.todolab.repository.ReminderRepository;
import com.example.todolab.repository.TaskRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ReminderRepository reminderRepository;
    private final TaskListService taskListService;
    private final TagService tagService;
    private final UserService userService;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public TaskService(TaskRepository taskRepository,
                       CommentRepository commentRepository,
                       ReminderRepository reminderRepository,
                       TaskListService taskListService,
                       TagService tagService,
                       UserService userService,
                       CurrentUserService currentUserService,
                       ApiMapper apiMapper) {
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.reminderRepository = reminderRepository;
        this.taskListService = taskListService;
        this.tagService = tagService;
        this.userService = userService;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasks(Long projectId,
                                       Long taskListId,
                                       TaskStatus status,
                                       TaskPriority priority,
                                       Long assigneeId,
                                       LocalDate dueDateFrom,
                                       LocalDate dueDateTo,
                                       Pageable pageable) {
        Long ownerId = currentUserService.isAdmin() ? null : currentUserService.getCurrentUserId();
        return taskRepository.findAll(
                TaskSpecifications.withFilters(ownerId, projectId, taskListId, status, priority, assigneeId, dueDateFrom, dueDateTo),
                pageable
            )
            .map(apiMapper::toTaskResponse);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) {
        return apiMapper.toTaskResponse(findAccessibleTask(id));
    }

    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        TaskEntity task = new TaskEntity();
        applyTaskValues(task, request.title(), request.description(), request.status(), request.priority(), request.dueDate(),
            request.assigneeId(), request.taskListId(), request.tagIds());
        return apiMapper.toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        TaskEntity task = findAccessibleTask(id);
        applyTaskValues(task, request.title(), request.description(), request.status(), request.priority(), request.dueDate(),
            request.assigneeId(), request.taskListId(), request.tagIds());
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse assignTask(Long id, Long assigneeId) {
        TaskEntity task = findAccessibleTask(id);
        task.setAssignee(assigneeId == null ? null : userService.findUserEntity(assigneeId));
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse changeStatus(Long id, TaskStatus status) {
        TaskEntity task = findAccessibleTask(id);
        task.setStatus(status);
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse changePriority(Long id, TaskPriority priority) {
        TaskEntity task = findAccessibleTask(id);
        task.setPriority(priority);
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse addTag(Long id, Long tagId) {
        TaskEntity task = findAccessibleTask(id);
        task.getTags().add(tagService.findAccessibleTag(tagId));
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse removeTag(Long id, Long tagId) {
        TaskEntity task = findAccessibleTask(id);
        task.getTags().removeIf(tag -> tag.getId().equals(tagId));
        return apiMapper.toTaskResponse(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        TaskEntity task = findAccessibleTask(id);
        reminderRepository.deleteAllByTaskId(task.getId());
        commentRepository.deleteAllByTaskId(task.getId());
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public TaskEntity findAccessibleTask(Long id) {
        if (currentUserService.isAdmin()) {
            return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task with id " + id + " was not found"));
        }
        return taskRepository.findByIdAndTaskListProjectOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Task with id " + id + " was not found"));
    }

    private void applyTaskValues(TaskEntity task,
                                 String title,
                                 String description,
                                 TaskStatus status,
                                 TaskPriority priority,
                                 LocalDate dueDate,
                                 Long assigneeId,
                                 Long taskListId,
                                 Set<Long> tagIds) {
        TaskListEntity taskList = taskListService.findAccessibleTaskList(taskListId);
        UserEntity assignee = assigneeId == null ? null : userService.findUserEntity(assigneeId);
        Set<TagEntity> tags = tagIds == null ? new LinkedHashSet<>() : tagService.findAccessibleTags(tagIds);

        task.setTitle(title.trim());
        task.setDescription(description);
        task.setStatus(status == null ? TaskStatus.TODO : status);
        task.setPriority(priority == null ? TaskPriority.MEDIUM : priority);
        task.setDueDate(dueDate);
        task.setAssignee(assignee);
        task.setTaskList(taskList);
        task.setTags(tags);
    }
}
