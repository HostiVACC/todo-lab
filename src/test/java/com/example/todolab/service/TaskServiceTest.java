package com.example.todolab.service;

import com.example.todolab.dto.TaskCreateRequest;
import com.example.todolab.dto.TaskResponse;
import com.example.todolab.entity.ProjectEntity;
import com.example.todolab.entity.TagEntity;
import com.example.todolab.entity.TaskEntity;
import com.example.todolab.entity.TaskListEntity;
import com.example.todolab.entity.TaskPriority;
import com.example.todolab.entity.TaskStatus;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskListService taskListService;

    @Mock
    private TagService tagService;

    @Mock
    private UserService userService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private ApiMapper apiMapper;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTaskAppliesDefaultsAndRelations() {
        TaskListEntity taskList = new TaskListEntity();
        taskList.setName("Inbox");
        ProjectEntity project = new ProjectEntity();
        project.setName("Study");
        taskList.setProject(project);

        TagEntity tag = new TagEntity();
        tag.setName("Study");
        Set<TagEntity> tags = new LinkedHashSet<>();
        tags.add(tag);

        when(taskListService.findAccessibleTaskList(10L)).thenReturn(taskList);
        when(tagService.findAccessibleTags(Set.of(1L))).thenReturn(tags);
        when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(apiMapper.toTaskResponse(any(TaskEntity.class))).thenReturn(
            new TaskResponse(1L, "Finish lab", "desc", TaskStatus.TODO, TaskPriority.MEDIUM,
                LocalDate.of(2026, 5, 1), 10L, "Inbox", 100L, null, null, Set.of())
        );

        TaskResponse response = taskService.createTask(new TaskCreateRequest(
            "Finish lab",
            "desc",
            null,
            null,
            LocalDate.of(2026, 5, 1),
            null,
            10L,
            Set.of(1L)
        ));

        ArgumentCaptor<TaskEntity> captor = ArgumentCaptor.forClass(TaskEntity.class);
        verify(taskRepository).save(captor.capture());
        TaskEntity saved = captor.getValue();

        assertThat(saved.getTitle()).isEqualTo("Finish lab");
        assertThat(saved.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(saved.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(saved.getTaskList()).isEqualTo(taskList);
        assertThat(saved.getTags()).containsExactly(tag);
        assertThat(response.title()).isEqualTo("Finish lab");
    }
}
