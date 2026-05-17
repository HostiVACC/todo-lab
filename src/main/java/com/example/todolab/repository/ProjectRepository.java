package com.example.todolab.repository;

import com.example.todolab.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    List<ProjectEntity> findAllByOwnerId(Long ownerId);
    Optional<ProjectEntity> findByIdAndOwnerId(Long id, Long ownerId);
}
