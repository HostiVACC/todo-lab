package com.example.todolab.repository;

import com.example.todolab.entity.ReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends JpaRepository<ReminderEntity, Long> {
    List<ReminderEntity> findAllByTaskId(Long taskId);
    List<ReminderEntity> findAllByTaskTaskListProjectOwnerId(Long ownerId);
    Optional<ReminderEntity> findByIdAndTaskTaskListProjectOwnerId(Long id, Long ownerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReminderEntity reminder where reminder.task.id = :taskId")
    int deleteAllByTaskId(@Param("taskId") Long taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        delete from reminder
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
