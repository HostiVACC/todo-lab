package com.example.todolab.controller;

import com.example.todolab.dto.CommentCreateRequest;
import com.example.todolab.dto.CommentResponse;
import com.example.todolab.dto.CommentUpdateRequest;
import com.example.todolab.service.CommentService;
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
@RequestMapping("/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<CommentResponse> getComments(@RequestParam(required = false) Long taskId) {
        return commentService.getComments(taskId);
    }

    @GetMapping("/{id}")
    public CommentResponse getComment(@PathVariable Long id) {
        return commentService.getComment(id);
    }

    @PostMapping
    public CommentResponse createComment(@Valid @RequestBody CommentCreateRequest request) {
        return commentService.createComment(request);
    }

    @PutMapping("/{id}")
    public CommentResponse updateComment(@PathVariable Long id, @Valid @RequestBody CommentUpdateRequest request) {
        return commentService.updateComment(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return Map.of("message", "Comment deleted");
    }
}
