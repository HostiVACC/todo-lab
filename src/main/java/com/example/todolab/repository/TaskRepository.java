package com.example.todolab.repository;

import com.example.todolab.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TaskRepository extends JpaRepository<TaskEntity, Long>, JpaSpecificationExecutor<TaskEntity> {
    Optional<TaskEntity> findByIdAndTaskListProjectOwnerId(Long id, Long ownerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        delete from task_tag
        where task_id in (
            select t.id
            from task t
            where t.task_list_id in (
                select tl.id
                from task_list tl
                where tl.project_id = :projectId
            )
        )
        """, nativeQuery = true)
    int deleteTaskTagsByProjectId(@Param("projectId") Long projectId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        delete from task
        where task_list_id in (
            select tl.id
            from task_list tl
            where tl.project_id = :projectId
        )
        """, nativeQuery = true)
    int deleteAllByProjectId(@Param("projectId") Long projectId);
}
