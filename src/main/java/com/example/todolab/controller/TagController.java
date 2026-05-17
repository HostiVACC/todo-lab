package com.example.todolab.controller;

import com.example.todolab.dto.TagCreateRequest;
import com.example.todolab.dto.TagResponse;
import com.example.todolab.dto.TagUpdateRequest;
import com.example.todolab.service.TagService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<TagResponse> getTags() {
        return tagService.getTags();
    }

    @GetMapping("/{id}")
    public TagResponse getTag(@PathVariable Long id) {
        return tagService.getTag(id);
    }

    @PostMapping
    public TagResponse createTag(@Valid @RequestBody TagCreateRequest request) {
        return tagService.createTag(request);
    }

    @PutMapping("/{id}")
    public TagResponse updateTag(@PathVariable Long id, @Valid @RequestBody TagUpdateRequest request) {
        return tagService.updateTag(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return Map.of("message", "Tag deleted");
    }
}
