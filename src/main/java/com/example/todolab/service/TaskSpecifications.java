package com.example.todolab.service;

import com.example.todolab.entity.TaskEntity;
import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public final class TaskSpecifications {

    private TaskSpecifications() {
    }

    public static Specification<TaskEntity> withFilters(Long ownerId,
                                                        Long projectId,
                                                        Long taskListId,
                                                        TaskStatus status,
                                                        TaskPriority priority,
                                                        Long assigneeId,
                                                        LocalDate dueDateFrom,
                                                        LocalDate dueDateTo) {
        Specification<TaskEntity> specification = (root, query, cb) -> cb.conjunction();
        specification = append(specification, ownerId == null ? null : byOwner(ownerId));
        specification = append(specification, projectId == null ? null : (root, query, cb) -> cb.equal(root.get("taskList").get("project").get("id"), projectId));
        specification = append(specification, taskListId == null ? null : (root, query, cb) -> cb.equal(root.get("taskList").get("id"), taskListId));
        specification = append(specification, status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status));
        specification = append(specification, priority == null ? null : (root, query, cb) -> cb.equal(root.get("priority"), priority));
        specification = append(specification, assigneeId == null ? null : (root, query, cb) -> cb.equal(root.get("assignee").get("id"), assigneeId));
        specification = append(specification, dueDateFrom == null ? null : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueDateFrom));
        specification = append(specification, dueDateTo == null ? null : (root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueDateTo));
        return specification;
    }

    private static Specification<TaskEntity> byOwner(Long ownerId) {
        return (root, query, cb) -> cb.equal(root.get("taskList").get("project").get("owner").get("id"), ownerId);
    }

    private static Specification<TaskEntity> append(Specification<TaskEntity> base, Specification<TaskEntity> next) {
        return next == null ? base : base.and(next);
    }
}
