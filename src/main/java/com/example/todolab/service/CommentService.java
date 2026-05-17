package com.example.todolab.service;

import com.example.todolab.dto.CommentCreateRequest;
import com.example.todolab.dto.CommentResponse;
import com.example.todolab.dto.CommentUpdateRequest;
import com.example.todolab.entity.CommentEntity;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.exception.ResourceAccessDeniedException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskService taskService;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public CommentService(CommentRepository commentRepository,
                          TaskService taskService,
                          CurrentUserService currentUserService,
                          ApiMapper apiMapper) {
        this.commentRepository = commentRepository;
        this.taskService = taskService;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long taskId) {
        List<CommentEntity> comments;
        if (taskId != null) {
            taskService.findAccessibleTask(taskId);
            comments = commentRepository.findAllByTaskId(taskId);
        } else {
            comments = currentUserService.isAdmin()
                ? commentRepository.findAll()
                : commentRepository.findAllByTaskTaskListProjectOwnerId(currentUserService.getCurrentUserId());
        }
        return comments.stream().map(apiMapper::toCommentResponse).toList();
    }

    @Transactional(readOnly = true)
    public CommentResponse getComment(Long id) {
        return apiMapper.toCommentResponse(findAccessibleComment(id));
    }

    @Transactional
    public CommentResponse createComment(CommentCreateRequest request) {
        CommentEntity comment = new CommentEntity();
        comment.setText(request.text().trim());
        comment.setTask(taskService.findAccessibleTask(request.taskId()));
        comment.setAuthor(currentUserService.getCurrentUserEntity());
        return apiMapper.toCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse updateComment(Long id, CommentUpdateRequest request) {
        CommentEntity comment = findAccessibleComment(id);
        ensureCommentEditable(comment);
        comment.setText(request.text().trim());
        return apiMapper.toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long id) {
        CommentEntity comment = findAccessibleComment(id);
        ensureCommentEditable(comment);
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public CommentEntity findAccessibleComment(Long id) {
        if (currentUserService.isAdmin()) {
            return commentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Comment with id " + id + " was not found"));
        }
        return commentRepository.findByIdAndTaskTaskListProjectOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Comment with id " + id + " was not found"));
    }

    private void ensureCommentEditable(CommentEntity comment) {
        if (currentUserService.isAdmin()) {
            return;
        }
        if (!comment.getAuthor().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ResourceAccessDeniedException("Only the comment author can modify this comment");
        }
    }
}
