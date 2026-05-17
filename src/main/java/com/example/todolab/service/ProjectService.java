package com.example.todolab.service;

import com.example.todolab.dto.ProjectCreateRequest;
import com.example.todolab.dto.ProjectResponse;
import com.example.todolab.dto.ProjectUpdateRequest;
import com.example.todolab.entity.ProjectEntity;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.CommentRepository;
import com.example.todolab.repository.ProjectRepository;
import com.example.todolab.repository.ReminderRepository;
import com.example.todolab.repository.TaskListRepository;
import com.example.todolab.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ReminderRepository reminderRepository;
    private final CurrentUserService currentUserService;
    private final ApiMapper apiMapper;

    public ProjectService(ProjectRepository projectRepository,
                          TaskListRepository taskListRepository,
                          TaskRepository taskRepository,
                          CommentRepository commentRepository,
                          ReminderRepository reminderRepository,
                          CurrentUserService currentUserService,
                          ApiMapper apiMapper) {
        this.projectRepository = projectRepository;
        this.taskListRepository = taskListRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.reminderRepository = reminderRepository;
        this.currentUserService = currentUserService;
        this.apiMapper = apiMapper;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects() {
        List<ProjectEntity> projects = currentUserService.isAdmin()
            ? projectRepository.findAll()
            : projectRepository.findAllByOwnerId(currentUserService.getCurrentUserId());

        return projects.stream().map(apiMapper::toProjectResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long id) {
        return apiMapper.toProjectResponse(findAccessibleProject(id));
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        ProjectEntity project = new ProjectEntity();
        project.setName(request.name().trim());
        project.setDescription(request.description());
        project.setOwner(currentUserService.getCurrentUserEntity());
        return apiMapper.toProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        ProjectEntity project = findAccessibleProject(id);
        project.setName(request.name().trim());
        project.setDescription(request.description());
        return apiMapper.toProjectResponse(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        ProjectEntity project = findAccessibleProject(id);
        reminderRepository.deleteAllByProjectId(project.getId());
        commentRepository.deleteAllByProjectId(project.getId());
        taskRepository.deleteTaskTagsByProjectId(project.getId());
        taskRepository.deleteAllByProjectId(project.getId());
        taskListRepository.deleteAllByProjectId(project.getId());
        projectRepository.flush();
        projectRepository.delete(project);
        projectRepository.flush();
    }

    @Transactional(readOnly = true)
    public ProjectEntity findAccessibleProject(Long id) {
        if (currentUserService.isAdmin()) {
            return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project with id " + id + " was not found"));
        }
        return projectRepository.findByIdAndOwnerId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new NotFoundException("Project with id " + id + " was not found"));
    }
}
