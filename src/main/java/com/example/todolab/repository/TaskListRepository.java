package com.example.todolab.repository;

import com.example.todolab.entity.TaskListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskListRepository extends JpaRepository<TaskListEntity, Long> {
    List<TaskListEntity> findAllByProjectId(Long projectId);
    List<TaskListEntity> findAllByProjectOwnerId(Long ownerId);
    Optional<TaskListEntity> findByIdAndProjectOwnerId(Long id, Long ownerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from task_list where project_id = :projectId", nativeQuery = true)
    int deleteAllByProjectId(@Param("projectId") Long projectId);
}
