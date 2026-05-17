package com.example.todolab.repository;

import com.example.todolab.entity.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
    List<CommentEntity> findAllByTaskId(Long taskId);
    List<CommentEntity> findAllByTaskTaskListProjectOwnerId(Long ownerId);
    Optional<CommentEntity> findByIdAndTaskTaskListProjectOwnerId(Long id, Long ownerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CommentEntity comment where comment.task.id = :taskId")
    int deleteAllByTaskId(@Param("taskId") Long taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        delete from comment
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
    int deleteAllByProjectId(@Param("projectId") Long projectId);
}
