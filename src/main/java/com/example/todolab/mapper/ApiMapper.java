package com.example.todolab.mapper;

import com.example.todolab.dto.AuthResponse;
import com.example.todolab.dto.CommentResponse;
import com.example.todolab.dto.ProjectResponse;
import com.example.todolab.dto.ReminderResponse;
import com.example.todolab.dto.TagResponse;
import com.example.todolab.dto.TaskListResponse;
import com.example.todolab.dto.TaskResponse;
import com.example.todolab.dto.UserResponse;
import com.example.todolab.entity.CommentEntity;
import com.example.todolab.entity.ProjectEntity;
import com.example.todolab.entity.ReminderEntity;
import com.example.todolab.entity.TagEntity;
import com.example.todolab.entity.TaskEntity;
import com.example.todolab.entity.TaskListEntity;
import com.example.todolab.entity.UserEntity;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ApiMapper {

    public AuthResponse toAuthResponse(UserEntity user) {
        return new AuthResponse(user.getId(), user.getEmail(), user.getDisplayName(), roleNames(user));
    }

    public UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.isEnabled(), roleNames(user));
    }

    public ProjectResponse toProjectResponse(ProjectEntity project) {
        return new ProjectResponse(
            project.getId(),
            project.getName(),
            project.getDescription(),
            project.getOwner().getId(),
            project.getOwner().getEmail()
        );
    }

    public TaskListResponse toTaskListResponse(TaskListEntity taskList) {
        return new TaskListResponse(
            taskList.getId(),
            taskList.getName(),
            taskList.getProject().getId(),
            taskList.getProject().getName()
        );
    }

    public TagResponse toTagResponse(TagEntity tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColor(), tag.getOwner().getId());
    }

    public TaskResponse toTaskResponse(TaskEntity task) {
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getPriority(),
            task.getDueDate(),
            task.getTaskList().getId(),
            task.getTaskList().getName(),
            task.getTaskList().getProject().getId(),
            task.getAssignee() != null ? task.getAssignee().getId() : null,
            task.getAssignee() != null ? task.getAssignee().getEmail() : null,
            task.getTags().stream().map(this::toTagResponse).collect(Collectors.toCollection(java.util.LinkedHashSet::new))
        );
    }

    public CommentResponse toCommentResponse(CommentEntity comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getText(),
            comment.getTask().getId(),
            comment.getAuthor().getId(),
            comment.getAuthor().getEmail(),
            comment.getCreatedAt()
        );
    }

    public ReminderResponse toReminderResponse(ReminderEntity reminder) {
        return new ReminderResponse(
            reminder.getId(),
            reminder.getRemindAt(),
            reminder.getChannel(),
            reminder.getTask().getId(),
            reminder.getCreatedBy().getId()
        );
    }

    private Set<String> roleNames(UserEntity user) {
        return user.getRoles().stream()
            .map(role -> role.getName().name())
            .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }
}
