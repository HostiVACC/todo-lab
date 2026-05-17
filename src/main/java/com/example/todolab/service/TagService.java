package com.example.todolab.service;

import com.example.todolab.dto.TagCreateRequest;
import com.example.todolab.dto.TagResponse;
import com.example.todolab.dto.TagUpdateRequest;
import com.example.todolab.entity.TagEntity;
import com.example.todolab.exception.BadRequestException;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public TagService(TagRepository tagRepository,
                      CurrentUserService currentUserService,
                      ApiMapper apiMapper) {
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getTags() {
        List<TagEntity> tags = currentUserService.isAdmin()
            ? tagRepository.findAll()
            : tagRepository.findAllByOwnerId(currentUserService.getCurrentUserId());

        return tags.stream().map(apiMapper::toTagResponse).toList();
    }

    @Transactional(readOnly = true)
    public TagResponse getTag(Long id) {
        return apiMapper.toTagResponse(findAccessibleTag(id));
    }

    @Transactional
    public TagResponse createTag(TagCreateRequest request) {
        Long ownerId = currentUserService.getCurrentUserId();
        if (!currentUserService.isAdmin() && tagRepository.existsByOwnerIdAndNameIgnoreCase(ownerId, request.name().trim())) {
            throw new BadRequestException("Tag with this name already exists");
        }

        TagEntity tag = new TagEntity();
        tag.setName(request.name().trim());
        tag.setColor(normalizeColor(request.color()));
        tag.setOwner(currentUserService.getCurrentUserEntity());
        return apiMapper.toTagResponse(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse updateTag(Long id, TagUpdateRequest request) {
        TagEntity tag = findAccessibleTag(id);
        tag.setName(request.name().trim());
        tag.setColor(normalizeColor(request.color()));
        return apiMapper.toTagResponse(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        tagRepository.delete(findAccessibleTag(id));
    }

    @Transactional(readOnly = true)
    public TagEntity findAccessibleTag(Long id) {
        if (currentUserService.isAdmin()) {
            return tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tag with id " + id + " was not found"));
        }
        return tagRepository.findByIdAndOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Tag with id " + id + " was not found"));
    }

    @Transactional(readOnly = true)
    public Set<TagEntity> findAccessibleTags(Set<Long> tagIds) {
        Set<TagEntity> tags = new LinkedHashSet<>();
        if (tagIds == null) {
            return tags;
        }
        for (Long tagId : tagIds) {
            tags.add(findAccessibleTag(tagId));
        }
        return tags;
    }

    private String normalizeColor(String color) {
        return color.startsWith("#") ? color : "#" + color;
    }
}
