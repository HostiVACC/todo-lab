package com.example.todolab.service;

import com.example.todolab.dto.TaskListCreateRequest;
import com.example.todolab.dto.TaskListResponse;
import com.example.todolab.dto.TaskListUpdateRequest;
import com.example.todolab.entity.TaskListEntity;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.TaskListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskListService {

    private final TaskListRepository taskListRepository;
    private final ProjectService projectService;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public TaskListService(TaskListRepository taskListRepository,
                           ProjectService projectService,
                           CurrentUserService currentUserService,
                           ApiMapper apiMapper) {
        this.taskListRepository = taskListRepository;
        this.projectService = projectService;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public List<TaskListResponse> getTaskLists(Long projectId) {
        List<TaskListEntity> taskLists;
        if (projectId != null) {
            projectService.findAccessibleProject(projectId);
            taskLists = taskListRepository.findAllByProjectId(projectId);
        } else {
            taskLists = currentUserService.isAdmin()
                ? taskListRepository.findAll()
                : taskListRepository.findAllByProjectOwnerId(currentUserService.getCurrentUserId());
        }
        return taskLists.stream().map(apiMapper::toTaskListResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskListResponse getTaskList(Long id) {
        return apiMapper.toTaskListResponse(findAccessibleTaskList(id));
    }

    @Transactional
    public TaskListResponse createTaskList(TaskListCreateRequest request) {
        TaskListEntity taskList = new TaskListEntity();
        taskList.setName(request.name().trim());
        taskList.setProject(projectService.findAccessibleProject(request.projectId()));
        return apiMapper.toTaskListResponse(taskListRepository.save(taskList));
    }

    @Transactional
    public TaskListResponse updateTaskList(Long id, TaskListUpdateRequest request) {
        TaskListEntity taskList = findAccessibleTaskList(id);
        taskList.setName(request.name().trim());
        return apiMapper.toTaskListResponse(taskList);
    }

    @Transactional
    public void deleteTaskList(Long id) {
        taskListRepository.delete(findAccessibleTaskList(id));
    }

    @Transactional(readOnly = true)
    public TaskListEntity findAccessibleTaskList(Long id) {
        if (currentUserService.isAdmin()) {
            return taskListRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task list with id " + id + " was not found"));
        }
        return taskListRepository.findByIdAndProjectOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Task list with id " + id + " was not found"));
    }
}
