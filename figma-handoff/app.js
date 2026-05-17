const state = {
    me: null,
    projects: [],
    taskLists: [],
    tags: [],
    tasksPage: { content: [], totalElements: 0 },
    comments: [],
    reminders: [],
    users: [],
    selectedProjectId: null,
    selectedTaskListId: null,
    selectedTaskId: null,
    activeMode: "project",
    filters: {
        projectId: "",
        taskListId: "",
        status: "",
        priority: "",
        dueDateFrom: "",
        dueDateTo: ""
    }
};

const elements = {};

document.addEventListener("DOMContentLoaded", async () => {
    bindElements();
    bindEvents();
    await initializeSession();
});

function bindElements() {
    const ids = [
        "notice", "authView", "appView", "loginForm", "registerForm", "loginEmail", "loginPassword",
        "registerDisplayName", "registerEmail", "registerPassword", "welcomeText", "roleText",
        "contextHint", "contextCards",
        "refreshButton", "logoutButton", "statsRow", "projectForm", "projectId", "projectName",
        "projectDescription", "resetProjectButton", "projectList", "taskListForm", "taskListId",
        "taskListName", "taskListProjectId", "resetTaskListButton", "taskListItems", "tagForm", "tagId",
        "tagName", "tagColor", "tagColorText", "resetTagButton", "tagList", "taskFilterForm",
        "filterProjectId", "filterTaskListId", "filterStatus", "filterPriority", "filterDueDateFrom",
        "filterDueDateTo", "clearFiltersButton", "taskForm", "taskId", "taskTitle", "taskDescription",
        "taskStatus", "taskPriority", "taskDueDate", "taskTaskListId", "taskAssigneeId", "taskTagOptions",
        "resetTaskButton", "taskMeta", "taskBoard", "detailTitle", "taskDetail", "commentForm", "commentId",
        "commentText", "resetCommentButton", "commentList", "reminderForm", "reminderId", "reminderAt",
        "reminderChannel", "resetReminderButton", "reminderList", "adminPanel", "userList"
    ];

    ids.forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function bindEvents() {
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.logoutButton.addEventListener("click", handleLogout);
    elements.refreshButton.addEventListener("click", async () => {
        await refreshAllData();
        showNotice("Данные обновлены.", "info");
    });

    document.querySelectorAll(".quick-login").forEach((button) => {
        button.addEventListener("click", () => {
            elements.loginEmail.value = button.dataset.email;
            elements.loginPassword.value = button.dataset.password;
            showNotice("Данные для входа подставлены.", "info");
        });
    });

    elements.projectForm.addEventListener("submit", handleProjectSubmit);
    elements.resetProjectButton.addEventListener("click", resetProjectForm);
    elements.projectList.addEventListener("click", handleProjectListClick);

    elements.taskListForm.addEventListener("submit", handleTaskListSubmit);
    elements.resetTaskListButton.addEventListener("click", resetTaskListForm);
    elements.taskListItems.addEventListener("click", handleTaskListClick);

    elements.tagForm.addEventListener("submit", handleTagSubmit);
    elements.resetTagButton.addEventListener("click", resetTagForm);
    elements.tagColor.addEventListener("input", () => {
        elements.tagColorText.value = elements.tagColor.value.toUpperCase();
    });
    elements.tagColorText.addEventListener("input", () => {
        const normalized = normalizeColor(elements.tagColorText.value);
        if (normalized) {
            elements.tagColor.value = normalized;
        }
    });
    elements.tagList.addEventListener("click", handleTagClick);

    elements.taskFilterForm.addEventListener("submit", handleFilterSubmit);
    elements.clearFiltersButton.addEventListener("click", clearFilters);
    elements.filterProjectId.addEventListener("change", syncTaskListFilterOptions);

    elements.taskForm.addEventListener("submit", handleTaskSubmit);
    elements.resetTaskButton.addEventListener("click", resetTaskForm);
    elements.taskBoard.addEventListener("click", handleTaskBoardClick);

    elements.commentForm.addEventListener("submit", handleCommentSubmit);
    elements.resetCommentButton.addEventListener("click", resetCommentForm);
    elements.commentList.addEventListener("click", handleCommentClick);

    elements.reminderForm.addEventListener("submit", handleReminderSubmit);
    elements.resetReminderButton.addEventListener("click", resetReminderForm);
    elements.reminderList.addEventListener("click", handleReminderClick);

    elements.userList.addEventListener("submit", handleUserSubmit);
    elements.userList.addEventListener("click", handleUserClick);

    document.querySelectorAll(".mode-chip").forEach((button) => {
        button.addEventListener("click", () => setActiveMode(button.dataset.mode));
    });
}

async function initializeSession() {
    try {
        const me = await api("/auth/me", { ignoreUnauthorized: true });
        if (!me) {
            renderSignedOut();
            return;
        }

        state.me = me;
        renderSignedInShell();
        await refreshAllData();
    } catch (error) {
        renderSignedOut();
        showNotice(error.message, "error");
    }
}

async function refreshAllData() {
    state.me = await api("/auth/me");
    state.projects = await api("/projects");
    state.tags = await api("/tags");
    state.taskLists = await api("/task-lists");

    if (state.projects.length > 0 && !state.selectedProjectId) {
        state.selectedProjectId = state.projects[0].id;
        state.filters.projectId = String(state.projects[0].id);
    }

    await loadTasks();
    state.users = isAdmin() ? await api("/users") : [state.me];
    await loadTaskSideData();
    renderApp();
}

async function loadTasks() {
    const params = new URLSearchParams({ page: "0", size: "100", sort: "id,desc" });
    Object.entries(state.filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    state.tasksPage = await api(`/tasks?${params.toString()}`);

    const tasks = state.tasksPage.content;
    if (tasks.length === 0) {
        state.selectedTaskId = null;
        return;
    }

    if (!tasks.some((task) => task.id === state.selectedTaskId)) {
        state.selectedTaskId = tasks[0].id;
    }
}

async function loadTaskSideData() {
    if (!state.selectedTaskId) {
        state.comments = [];
        state.reminders = [];
        return;
    }

    state.comments = await api(`/comments?taskId=${state.selectedTaskId}`);
    state.reminders = await api(`/reminders?taskId=${state.selectedTaskId}`);
}

function renderSignedOut() {
    elements.authView.classList.remove("hidden");
    elements.appView.classList.add("hidden");
}

function renderSignedInShell() {
    elements.authView.classList.add("hidden");
    elements.appView.classList.remove("hidden");
}

function renderApp() {
    renderSignedInShell();
    renderHeader();
    renderStats();
    renderContext();
    setActiveMode(state.activeMode);
    renderProjectOptions();
    renderProjects();
    renderTaskListOptions();
    renderTaskLists();
    renderTags();
    renderTaskFormOptions();
    renderTagOptions();
    populateTaskForm(getSelectedTask());
    renderTasks();
    renderTaskDetail();
    renderComments();
    renderReminders();
    renderAdminPanel();
}

function renderContext() {
    const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
    const selectedTaskList = state.taskLists.find((taskList) => taskList.id === state.selectedTaskListId)
        || state.taskLists.find((taskList) => String(taskList.id) === String(state.filters.taskListId));
    const selectedTask = getSelectedTask();

    const cards = [
        {
            key: "project",
            title: "Шаг 1. Проект",
            text: selectedProject
                ? `Выбран проект: ${selectedProject.name}`
                : "Создайте проект или выберите уже существующий."
        },
        {
            key: "task-list",
            title: "Шаг 2. Список задач",
            text: selectedTaskList
                ? `Текущий список: ${selectedTaskList.name}`
                : "Добавьте список задач для выбранного проекта."
        },
        {
            key: "task",
            title: "Шаг 3. Задача",
            text: selectedTask
                ? `Активная задача: ${selectedTask.title}`
                : "Создайте задачу или выберите её из списка справа."
        },
        {
            key: "detail",
            title: "Шаг 4. Детали",
            text: selectedTask
                ? "Добавьте комментарии, напоминания или поменяйте статус."
                : "После выбора задачи откроются комментарии и напоминания."
        }
    ];

    elements.contextCards.innerHTML = cards.map((card) => `
        <article class="context-card ${isContextCardActive(card.key) ? "active" : ""}">
            <strong>${card.title}</strong>
            <p>${escapeHtml(card.text)}</p>
        </article>
    `).join("");

    elements.contextHint.textContent = buildContextHint(selectedProject, selectedTaskList, selectedTask);
}

function renderHeader() {
    elements.welcomeText.textContent = `Привет, ${state.me.displayName}`;
    elements.roleText.textContent = `Роли: ${state.me.roles.map(roleLabel).join(", ")}`;
}

function renderStats() {
    const counters = [
        { label: "Проекты", value: state.projects.length },
        { label: "Списки задач", value: state.taskLists.length },
        { label: "Задачи в выборке", value: state.tasksPage.content.length },
        { label: "Теги", value: state.tags.length }
    ];

    elements.statsRow.innerHTML = counters.map((item) => `
        <article class="stats-card surface-card">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
        </article>
    `).join("");
}

function renderProjectOptions() {
    elements.filterProjectId.innerHTML = optionMarkup(state.projects, "Все проекты", state.filters.projectId, true);
    elements.taskListProjectId.innerHTML = optionMarkup(state.projects, "Выберите проект", state.selectedProjectId, false);
}

function renderProjects() {
    if (state.projects.length === 0) {
        elements.projectList.innerHTML = emptyState("Пока нет проектов. Создай первый проект для работы с задачами.");
        return;
    }

    elements.projectList.innerHTML = state.projects.map((project) => `
        <article class="list-card ${project.id === state.selectedProjectId ? "active" : ""}" data-id="${project.id}">
            <div class="card-topline">
                <div>
                    <h3 class="card-title">${escapeHtml(project.name)}</h3>
                    <p class="card-copy">${escapeHtml(project.description || "Описание не указано.")}</p>
                </div>
            </div>
            <div class="card-meta">
                <span class="mini-chip">Владелец: ${escapeHtml(project.ownerEmail)}</span>
                <span class="mini-chip">ID ${project.id}</span>
            </div>
            <div class="button-row">
                <button type="button" class="ghost-button" data-action="edit-project" data-id="${project.id}">Изменить</button>
                <button type="button" class="danger-button" data-action="delete-project" data-id="${project.id}">Удалить</button>
            </div>
        </article>
    `).join("");
}

function renderTaskListOptions() {
    syncTaskListFilterOptions();
}

function renderTaskLists() {
    const visibleLists = state.selectedProjectId
        ? state.taskLists.filter((item) => item.projectId === state.selectedProjectId)
        : state.taskLists;

    if (visibleLists.length === 0) {
        elements.taskListItems.innerHTML = emptyState("Пока нет списков задач. Добавь список для выбранного проекта.");
        return;
    }

    elements.taskListItems.innerHTML = visibleLists.map((taskList) => `
        <article class="list-card ${taskList.id === state.selectedTaskListId ? "active" : ""}" data-id="${taskList.id}">
            <div class="card-topline">
                <div>
                    <h3 class="card-title">${escapeHtml(taskList.name)}</h3>
                    <p class="card-copy">Проект: ${escapeHtml(taskList.projectName)}</p>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-task-list" data-id="${taskList.id}">Изменить</button>
                    <button type="button" class="danger-button" data-action="delete-task-list" data-id="${taskList.id}">Удалить</button>
                </div>
            </div>
        </article>
    `).join("");
}

function setActiveMode(mode) {
    state.activeMode = mode;
    document.querySelectorAll(".mode-chip").forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });
    document.querySelectorAll("[data-mode-panel]").forEach((panel) => {
        panel.classList.toggle("mode-panel-active", panel.dataset.modePanel === mode);
    });
}

function renderTags() {
    if (state.tags.length === 0) {
        elements.tagList.innerHTML = emptyState("Пока нет тегов.");
        return;
    }

    elements.tagList.innerHTML = state.tags.map((tag) => `
        <span class="tag-pill" style="border-color:${escapeHtml(normalizeColor(tag.color) || "#4b5563")}; color:${escapeHtml(normalizeColor(tag.color) || "#dbeafe")}">
            ${escapeHtml(tag.name)}
            <button type="button" data-action="edit-tag" data-id="${tag.id}" title="Изменить тег">Изм.</button>
            <button type="button" data-action="delete-tag" data-id="${tag.id}" title="Удалить тег">X</button>
        </span>
    `).join("");
}

function renderTagOptions() {
    if (state.tags.length === 0) {
        elements.taskTagOptions.innerHTML = `<div class="stack-empty">Создай теги, чтобы прикреплять их к задачам.</div>`;
        return;
    }

    const selectedTagIds = new Set((getSelectedTask()?.tags || []).map((tag) => String(tag.id)));
    elements.taskTagOptions.innerHTML = state.tags.map((tag) => `
        <label class="checkbox-item">
            <input type="checkbox" value="${tag.id}" ${selectedTagIds.has(String(tag.id)) ? "checked" : ""}>
            <span>${escapeHtml(tag.name)} (${escapeHtml(normalizeColor(tag.color) || tag.color)})</span>
        </label>
    `).join("");
}

function renderTaskFormOptions() {
    elements.taskTaskListId.innerHTML = optionMarkup(state.taskLists, "Выберите список задач", getTaskListSelection(), false);

    const assigneeOptions = isAdmin() ? state.users : [state.me];
    const selectedTask = getSelectedTask();
    const selectedAssignee = selectedTask?.assigneeId ?? (!isAdmin() ? state.me.id : "");

    elements.taskAssigneeId.innerHTML = ['<option value="">Не назначен</option>']
        .concat(assigneeOptions.map((user) => `
            <option value="${user.id}" ${String(selectedAssignee) === String(user.id) ? "selected" : ""}>
                ${escapeHtml(user.displayName)} (${escapeHtml(user.email)})
            </option>
        `))
        .join("");
}

function renderTasks() {
    const tasks = state.tasksPage.content;
    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Показано задач: ${tasks.length}</span>
        <span class="mini-chip">Найдено всего: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Проект в фильтре: ${labelForProject(state.filters.projectId)}</span>
    `;

    if (tasks.length === 0) {
        elements.taskBoard.innerHTML = emptyState("По текущим фильтрам задачи не найдены.");
        return;
    }

    elements.taskBoard.innerHTML = tasks.map((task) => `
        <article class="task-card ${task.id === state.selectedTaskId ? "active" : ""}">
            <div class="card-topline">
                <div>
                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                    <p class="card-copy">${escapeHtml(task.description || "Описание отсутствует")}</p>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-task" data-id="${task.id}">Изменить</button>
                    <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="mini-chip"><span class="status-dot" style="background:${statusColor(task.status)}"></span>${statusLabel(task.status)}</span>
                <span class="mini-chip">Приоритет: ${priorityLabel(task.priority)}</span>
                <span class="mini-chip">Список: ${escapeHtml(task.taskListName)}</span>
                <span class="mini-chip">Срок: ${escapeHtml(task.dueDate || "Не задан")}</span>
                <span class="mini-chip">Исполнитель: ${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
            </div>
            <div class="card-meta">
                ${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("")}
            </div>
            <div class="button-row">
                <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="TODO">К выполнению</button>
                <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="IN_PROGRESS">В работе</button>
                <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="DONE">Завершено</button>
            </div>
        </article>
    `).join("");
}

function renderTaskDetail() {
    const task = getSelectedTask();
    if (!task) {
        elements.detailTitle.textContent = "Выберите задачу";
        elements.taskDetail.className = "detail-card empty-state";
        elements.taskDetail.textContent = "Выберите задачу слева, чтобы посмотреть описание, статус, исполнителя и связанные объекты.";
        return;
    }

    elements.detailTitle.textContent = task.title;
    elements.taskDetail.className = "detail-card";
    elements.taskDetail.innerHTML = `
        <div class="detail-section">
            <h3 class="detail-title">${escapeHtml(task.title)}</h3>
            <p class="detail-value">${escapeHtml(task.description || "Описание отсутствует")}</p>
        </div>
        <div class="detail-section">
            <p class="detail-value"><strong>Статус:</strong> ${statusLabel(task.status)}</p>
            <p class="detail-value"><strong>Приоритет:</strong> ${priorityLabel(task.priority)}</p>
            <p class="detail-value"><strong>Список задач:</strong> ${escapeHtml(task.taskListName)}</p>
            <p class="detail-value"><strong>Срок:</strong> ${escapeHtml(task.dueDate || "Не задан")}</p>
            <p class="detail-value"><strong>Исполнитель:</strong> ${escapeHtml(task.assigneeEmail || "Не назначен")}</p>
        </div>
        <div class="detail-section">
            <p class="detail-value"><strong>Теги:</strong> ${(task.tags || []).length > 0 ? task.tags.map((tag) => escapeHtml(tag.name)).join(", ") : "Нет тегов"}</p>
            <p class="detail-value"><strong>Комментарии:</strong> ${state.comments.length}</p>
            <p class="detail-value"><strong>Напоминания:</strong> ${state.reminders.length}</p>
        </div>
    `;
}

function renderComments() {
    if (!state.selectedTaskId) {
        elements.commentList.innerHTML = emptyState("Выберите задачу, чтобы работать с комментариями.");
        return;
    }

    if (state.comments.length === 0) {
        elements.commentList.innerHTML = emptyState("Комментариев пока нет.");
        return;
    }

    elements.commentList.innerHTML = state.comments.map((comment) => `
        <article class="list-card">
            <div class="card-topline">
                <div>
                    <h3 class="card-title">${escapeHtml(comment.authorEmail)}</h3>
                    <p class="card-copy">${escapeHtml(comment.text)}</p>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-comment" data-id="${comment.id}">Изменить</button>
                    <button type="button" class="danger-button" data-action="delete-comment" data-id="${comment.id}">Удалить</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="mini-chip">${formatDateTime(comment.createdAt)}</span>
            </div>
        </article>
    `).join("");
}

function renderReminders() {
    if (!state.selectedTaskId) {
        elements.reminderList.innerHTML = emptyState("Выберите задачу, чтобы работать с напоминаниями.");
        return;
    }

    if (state.reminders.length === 0) {
        elements.reminderList.innerHTML = emptyState("Напоминаний пока нет.");
        return;
    }

    elements.reminderList.innerHTML = state.reminders.map((reminder) => `
        <article class="list-card">
            <div class="card-topline">
                <div>
                    <h3 class="card-title">${channelLabel(reminder.channel)}</h3>
                    <p class="card-copy">${formatDateTime(reminder.remindAt)}</p>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-reminder" data-id="${reminder.id}">Изменить</button>
                    <button type="button" class="danger-button" data-action="delete-reminder" data-id="${reminder.id}">Удалить</button>
                </div>
            </div>
            <div class="card-meta">
                <span class="mini-chip">Создано пользователем ${reminder.createdById}</span>
            </div>
        </article>
    `).join("");
}

function renderAdminPanel() {
    const navUsersItem = document.getElementById("navUsersItem");
    const usersSection = document.getElementById("usersSection");

    if (!isAdmin()) {
        elements.adminPanel.classList.add("hidden");
        navUsersItem?.classList.add("hidden");
        usersSection?.classList.add("hidden");
        return;
    }

    elements.adminPanel.classList.remove("hidden");
    navUsersItem?.classList.remove("hidden");
    usersSection?.classList.remove("hidden");

    elements.userList.innerHTML = state.users.map((user) => `
        <article class="user-card ${user.id === state.me.id ? "active" : ""}">
            <form data-user-id="${user.id}">
                <div class="card-topline">
                    <div>
                        <h3 class="card-title">${escapeHtml(user.email)}</h3>
                        <p class="card-copy">ID ${user.id}</p>
                    </div>
                    <button type="button" class="danger-button" data-action="delete-user" data-id="${user.id}" ${user.id === state.me.id ? "disabled" : ""}>
                        Удалить
                    </button>
                </div>
                <label>
                    <span>Отображаемое имя</span>
                    <input name="displayName" type="text" value="${escapeHtml(user.displayName)}" maxlength="120" required>
                </label>
                <label class="checkbox-item">
                    <input name="enabled" type="checkbox" ${user.enabled ? "checked" : ""}>
                    <span>Пользователь активен</span>
                </label>
                <div class="roles-grid">
                    ${["ADMIN", "USER"].map((role) => `
                        <label>
                            <input type="checkbox" name="roles" value="${role}" ${user.roles.includes(role) ? "checked" : ""}>
                            <span>${roleLabel(role)}</span>
                        </label>
                    `).join("")}
                </div>
                <button type="submit" class="secondary-button">Сохранить пользователя</button>
            </form>
        </article>
    `).join("");
}

async function handleLogin(event) {
    event.preventDefault();
    try {
        await api("/auth/login", {
            method: "POST",
            body: {
                email: elements.loginEmail.value.trim(),
                password: elements.loginPassword.value
            }
        });
        resetAuthForms();
        await refreshAllData();
        showNotice("Вход выполнен.", "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    try {
        await api("/auth/register", {
            method: "POST",
            body: {
                displayName: elements.registerDisplayName.value.trim(),
                email: elements.registerEmail.value.trim(),
                password: elements.registerPassword.value
            }
        });

        await api("/auth/login", {
            method: "POST",
            body: {
                email: elements.registerEmail.value.trim(),
                password: elements.registerPassword.value
            }
        });

        resetAuthForms();
        await refreshAllData();
        showNotice("Пользователь зарегистрирован и вошёл в систему.", "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleLogout() {
    try {
        await api("/auth/logout", { method: "POST" });
    } finally {
        resetState();
        renderSignedOut();
        showNotice("Сессия завершена.", "info");
    }
}

async function handleProjectSubmit(event) {
    event.preventDefault();
    const id = elements.projectId.value;
    const payload = {
        name: elements.projectName.value.trim(),
        description: elements.projectDescription.value.trim() || null
    };

    try {
        if (id) {
            await api(`/projects/${id}`, { method: "PUT", body: payload });
            showNotice("Проект обновлён.", "success");
        } else {
            const created = await api("/projects", { method: "POST", body: payload });
            state.selectedProjectId = created.id;
            state.filters.projectId = String(created.id);
            showNotice("Проект создан.", "success");
        }
        resetProjectForm();
        await refreshAllData();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleTaskListSubmit(event) {
    event.preventDefault();
    const id = elements.taskListId.value;
    const payload = id
        ? { name: elements.taskListName.value.trim() }
        : {
            name: elements.taskListName.value.trim(),
            projectId: Number(elements.taskListProjectId.value)
        };

    try {
        if (id) {
            await api(`/task-lists/${id}`, { method: "PUT", body: payload });
            showNotice("Список задач обновлён.", "success");
        } else {
            const created = await api("/task-lists", { method: "POST", body: payload });
            state.selectedTaskListId = created.id;
            state.filters.taskListId = String(created.id);
            showNotice("Список задач создан.", "success");
        }
        resetTaskListForm();
        await refreshAllData();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleTagSubmit(event) {
    event.preventDefault();
    const id = elements.tagId.value;
    const payload = {
        name: elements.tagName.value.trim(),
        color: normalizeColor(elements.tagColorText.value) || elements.tagColor.value
    };

    try {
        if (id) {
            await api(`/tags/${id}`, { method: "PUT", body: payload });
            showNotice("Тег обновлён.", "success");
        } else {
            await api("/tags", { method: "POST", body: payload });
            showNotice("Тег создан.", "success");
        }
        resetTagForm();
        await refreshAllData();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleFilterSubmit(event) {
    event.preventDefault();
    state.filters = {
        projectId: elements.filterProjectId.value,
        taskListId: elements.filterTaskListId.value,
        status: elements.filterStatus.value,
        priority: elements.filterPriority.value,
        dueDateFrom: elements.filterDueDateFrom.value,
        dueDateTo: elements.filterDueDateTo.value
    };
    await loadTasks();
    await loadTaskSideData();
    renderApp();
}

async function handleTaskSubmit(event) {
    event.preventDefault();
    const id = elements.taskId.value;
    const payload = {
        title: elements.taskTitle.value.trim(),
        description: elements.taskDescription.value.trim() || null,
        status: elements.taskStatus.value,
        priority: elements.taskPriority.value,
        dueDate: elements.taskDueDate.value || null,
        assigneeId: elements.taskAssigneeId.value ? Number(elements.taskAssigneeId.value) : null,
        taskListId: Number(elements.taskTaskListId.value),
        tagIds: [...elements.taskTagOptions.querySelectorAll("input:checked")].map((input) => Number(input.value))
    };

    try {
        if (id) {
            const updated = await api(`/tasks/${id}`, { method: "PUT", body: payload });
            state.selectedTaskId = updated.id;
            showNotice("Задача обновлена.", "success");
        } else {
            const created = await api("/tasks", { method: "POST", body: payload });
            state.selectedTaskId = created.id;
            showNotice("Задача создана.", "success");
        }
        resetTaskForm();
        await refreshAllData();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!state.selectedTaskId) {
        showNotice("Сначала выберите задачу.", "error");
        return;
    }

    const id = elements.commentId.value;
    const payload = id
        ? { text: elements.commentText.value.trim() }
        : { text: elements.commentText.value.trim(), taskId: state.selectedTaskId };

    try {
        if (id) {
            await api(`/comments/${id}`, { method: "PUT", body: payload });
            showNotice("Комментарий обновлён.", "success");
        } else {
            await api("/comments", { method: "POST", body: payload });
            showNotice("Комментарий добавлен.", "success");
        }
        resetCommentForm();
        await loadTaskSideData();
        renderApp();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleReminderSubmit(event) {
    event.preventDefault();
    if (!state.selectedTaskId) {
        showNotice("Сначала выберите задачу.", "error");
        return;
    }

    const id = elements.reminderId.value;
    const payload = id
        ? {
            remindAt: toApiDateTime(elements.reminderAt.value),
            channel: elements.reminderChannel.value
        }
        : {
            remindAt: toApiDateTime(elements.reminderAt.value),
            channel: elements.reminderChannel.value,
            taskId: state.selectedTaskId
        };

    try {
        if (id) {
            await api(`/reminders/${id}`, { method: "PUT", body: payload });
            showNotice("Напоминание обновлено.", "success");
        } else {
            await api("/reminders", { method: "POST", body: payload });
            showNotice("Напоминание создано.", "success");
        }
        resetReminderForm();
        await loadTaskSideData();
        renderApp();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleUserSubmit(event) {
    if (!event.target.matches("form[data-user-id]")) {
        return;
    }

    event.preventDefault();
    const form = event.target;
    const id = form.dataset.userId;
    const roles = [...form.querySelectorAll('input[name="roles"]:checked')].map((input) => input.value);

    try {
        await api(`/users/${id}`, {
            method: "PUT",
            body: {
                displayName: form.querySelector('input[name="displayName"]').value.trim(),
                enabled: form.querySelector('input[name="enabled"]').checked,
                roleNames: roles
            }
        });
        await refreshAllData();
        showNotice("Пользователь обновлён.", "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function handleProjectListClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id || event.target.closest("[data-id]")?.dataset.id);
    if (!id) {
        return;
    }

    if (!action) {
        state.selectedProjectId = id;
        state.selectedTaskListId = null;
        state.filters.projectId = String(id);
        state.filters.taskListId = "";
        setActiveMode("task-list");
        elements.filterProjectId.value = String(id);
        syncTaskListFilterOptions();
        await loadTasks();
        await loadTaskSideData();
        renderApp();
        return;
    }

    const project = state.projects.find((item) => item.id === id);
    if (!project) {
        return;
    }

    if (action === "edit-project") {
        elements.projectId.value = String(project.id);
        elements.projectName.value = project.name;
        elements.projectDescription.value = project.description || "";
        state.selectedProjectId = project.id;
        setActiveMode("project");
        renderProjects();
        return;
    }

    if (action === "delete-project" && window.confirm(`Удалить проект "${project.name}"?`)) {
        try {
            await api(`/projects/${id}`, { method: "DELETE" });
            if (state.selectedProjectId === id) {
                state.selectedProjectId = null;
                state.filters.projectId = "";
            }
            resetProjectForm();
            await refreshAllData();
            showNotice("Проект удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleTaskListClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id || event.target.closest("[data-id]")?.dataset.id);
    if (!id) {
        return;
    }

    const taskList = state.taskLists.find((item) => item.id === id);
    if (!taskList) {
        return;
    }

    if (!action) {
        state.selectedTaskListId = id;
        state.filters.taskListId = String(id);
        setActiveMode("task");
        elements.filterTaskListId.value = String(id);
        await loadTasks();
        await loadTaskSideData();
        renderApp();
        return;
    }

    if (action === "edit-task-list") {
        elements.taskListId.value = String(taskList.id);
        elements.taskListName.value = taskList.name;
        elements.taskListProjectId.value = String(taskList.projectId);
        state.selectedTaskListId = taskList.id;
        setActiveMode("task-list");
        renderTaskLists();
        return;
    }

    if (action === "delete-task-list" && window.confirm(`Удалить список задач "${taskList.name}"?`)) {
        try {
            await api(`/task-lists/${id}`, { method: "DELETE" });
            if (state.selectedTaskListId === id) {
                state.selectedTaskListId = null;
                state.filters.taskListId = "";
            }
            resetTaskListForm();
            await refreshAllData();
            showNotice("Список задач удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleTagClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id);
    if (!action || !id) {
        return;
    }

    const tag = state.tags.find((item) => item.id === id);
    if (!tag) {
        return;
    }

    if (action === "edit-tag") {
        const normalized = normalizeColor(tag.color) || "#2DD4BF";
        elements.tagId.value = String(tag.id);
        elements.tagName.value = tag.name;
        elements.tagColor.value = normalized;
        elements.tagColorText.value = normalized;
        setActiveMode("tag");
        return;
    }

    if (action === "delete-tag" && window.confirm(`Удалить тег "${tag.name}"?`)) {
        try {
            await api(`/tags/${id}`, { method: "DELETE" });
            resetTagForm();
            await refreshAllData();
            showNotice("Тег удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleTaskBoardClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id);
    if (!action || !id) {
        return;
    }

    if (action === "select-task" || action === "edit-task") {
        state.selectedTaskId = id;
        setActiveMode("task");
        await loadTaskSideData();
        renderApp();
        return;
    }

    if (action === "delete-task" && window.confirm("Удалить эту задачу?")) {
        try {
            await api(`/tasks/${id}`, { method: "DELETE" });
            if (state.selectedTaskId === id) {
                state.selectedTaskId = null;
            }
            resetTaskForm();
            await refreshAllData();
            showNotice("Задача удалена.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
        return;
    }

    if (action === "set-status") {
        try {
            await api(`/tasks/${id}/status?status=${button.dataset.status}`, { method: "PATCH" });
            await refreshAllData();
            showNotice("Статус задачи изменён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleCommentClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id);
    if (!action || !id) {
        return;
    }

    const comment = state.comments.find((item) => item.id === id);
    if (!comment) {
        return;
    }

    if (action === "edit-comment") {
        elements.commentId.value = String(comment.id);
        elements.commentText.value = comment.text;
        return;
    }

    if (action === "delete-comment" && window.confirm("Удалить этот комментарий?")) {
        try {
            await api(`/comments/${id}`, { method: "DELETE" });
            resetCommentForm();
            await loadTaskSideData();
            renderApp();
            showNotice("Комментарий удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleReminderClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id);
    if (!action || !id) {
        return;
    }

    const reminder = state.reminders.find((item) => item.id === id);
    if (!reminder) {
        return;
    }

    if (action === "edit-reminder") {
        elements.reminderId.value = String(reminder.id);
        elements.reminderAt.value = fromApiDateTime(reminder.remindAt);
        elements.reminderChannel.value = reminder.channel;
        return;
    }

    if (action === "delete-reminder" && window.confirm("Удалить это напоминание?")) {
        try {
            await api(`/reminders/${id}`, { method: "DELETE" });
            resetReminderForm();
            await loadTaskSideData();
            renderApp();
            showNotice("Напоминание удалено.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleUserClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const id = Number(button?.dataset.id);
    if (action !== "delete-user" || !id) {
        return;
    }

    if (!window.confirm("Удалить этого пользователя?")) {
        return;
    }

    try {
        await api(`/users/${id}`, { method: "DELETE" });
        await refreshAllData();
        showNotice("Пользователь удалён.", "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

function resetAuthForms() {
    elements.loginForm.reset();
    elements.registerForm.reset();
}

function resetProjectForm() {
    elements.projectId.value = "";
    elements.projectName.value = "";
    elements.projectDescription.value = "";
}

function resetTaskListForm() {
    elements.taskListId.value = "";
    elements.taskListName.value = "";
    if (state.selectedProjectId) {
        elements.taskListProjectId.value = String(state.selectedProjectId);
    }
}

function resetTagForm() {
    elements.tagId.value = "";
    elements.tagName.value = "";
    elements.tagColor.value = "#2DD4BF";
    elements.tagColorText.value = "#2DD4BF";
}

function resetTaskForm() {
    elements.taskId.value = "";
    elements.taskTitle.value = "";
    elements.taskDescription.value = "";
    elements.taskStatus.value = "TODO";
    elements.taskPriority.value = "MEDIUM";
    elements.taskDueDate.value = "";
    elements.taskAssigneeId.value = isAdmin() ? "" : String(state.me?.id || "");
    elements.taskTaskListId.value = getTaskListSelection();
    elements.taskTagOptions.querySelectorAll("input").forEach((input) => {
        input.checked = false;
    });
}

function resetCommentForm() {
    elements.commentId.value = "";
    elements.commentText.value = "";
}

function resetReminderForm() {
    elements.reminderId.value = "";
    elements.reminderAt.value = "";
    elements.reminderChannel.value = "IN_APP";
}

function clearFilters() {
    state.filters = {
        projectId: "",
        taskListId: "",
        status: "",
        priority: "",
        dueDateFrom: "",
        dueDateTo: ""
    };

    elements.filterProjectId.value = "";
    elements.filterStatus.value = "";
    elements.filterPriority.value = "";
    elements.filterDueDateFrom.value = "";
    elements.filterDueDateTo.value = "";
    syncTaskListFilterOptions();

    loadTasks()
        .then(loadTaskSideData)
        .then(renderApp)
        .catch((error) => showNotice(error.message, "error"));
}

function populateTaskForm(task) {
    if (!task) {
        resetTaskForm();
        return;
    }

    elements.taskId.value = String(task.id);
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || "";
    elements.taskStatus.value = task.status;
    elements.taskPriority.value = task.priority;
    elements.taskDueDate.value = task.dueDate || "";
    elements.taskTaskListId.value = String(task.taskListId);
    elements.taskAssigneeId.value = task.assigneeId ? String(task.assigneeId) : "";

    const selectedTagIds = new Set((task.tags || []).map((tag) => String(tag.id)));
    elements.taskTagOptions.querySelectorAll("input").forEach((input) => {
        input.checked = selectedTagIds.has(input.value);
    });
}

function syncTaskListFilterOptions() {
    const projectId = elements.filterProjectId.value || state.filters.projectId;
    const visibleLists = projectId
        ? state.taskLists.filter((item) => String(item.projectId) === String(projectId))
        : state.taskLists;

    elements.filterTaskListId.innerHTML = optionMarkup(visibleLists, "Любой список задач", state.filters.taskListId, true);

    if (state.filters.taskListId && !visibleLists.some((item) => String(item.id) === String(state.filters.taskListId))) {
        state.filters.taskListId = "";
        elements.filterTaskListId.value = "";
    } else {
        elements.filterTaskListId.value = state.filters.taskListId;
    }
}

function getSelectedTask() {
    return state.tasksPage.content.find((task) => task.id === state.selectedTaskId) || null;
}

function getTaskListSelection() {
    const selectedTask = getSelectedTask();
    if (selectedTask) {
        return String(selectedTask.taskListId);
    }
    if (state.selectedTaskListId) {
        return String(state.selectedTaskListId);
    }
    if (state.taskLists[0]) {
        return String(state.taskLists[0].id);
    }
    return "";
}

function optionMarkup(items, placeholder, selectedValue, allowEmpty) {
    const normalizedSelected = selectedValue == null ? "" : String(selectedValue);
    const options = [];

    if (allowEmpty) {
        options.push(`<option value="">${placeholder}</option>`);
    }

    options.push(...items.map((item) => `
        <option value="${item.id}" ${String(item.id) === normalizedSelected ? "selected" : ""}>
            ${escapeHtml(item.name || item.displayName || item.email)}
        </option>
    `));

    if (!allowEmpty && items.length === 0) {
        options.unshift(`<option value="">${placeholder}</option>`);
    }

    return options.join("");
}

async function api(path, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Accept": "application/json"
        },
        credentials: "same-origin"
    };

    if (options.body !== undefined) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(path, config);
    if (options.ignoreUnauthorized && response.status === 401) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        if (response.status === 401 && !options.ignoreUnauthorized) {
            resetState();
            renderSignedOut();
        }
        throw new Error(extractError(payload, response.status));
    }

    return payload;
}

function extractError(payload, status) {
    if (!payload) {
        return `Запрос завершился ошибкой со статусом ${status}.`;
    }

    if (typeof payload === "string") {
        return payload || `Запрос завершился ошибкой со статусом ${status}.`;
    }

    if (payload.validationErrors && Object.keys(payload.validationErrors).length > 0) {
        return Object.entries(payload.validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(" | ");
    }

    return payload.message || payload.error || `Запрос завершился ошибкой со статусом ${status}.`;
}

function showNotice(message, type = "info") {
    elements.notice.textContent = message;
    elements.notice.className = `notice notice-${type}`;
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => {
        elements.notice.className = "notice hidden";
        elements.notice.textContent = "";
    }, 5000);
}

function resetState() {
    state.me = null;
    state.projects = [];
    state.taskLists = [];
    state.tags = [];
    state.tasksPage = { content: [], totalElements: 0 };
    state.comments = [];
    state.reminders = [];
    state.users = [];
    state.selectedProjectId = null;
    state.selectedTaskListId = null;
    state.selectedTaskId = null;
    state.activeMode = "project";
    state.filters = {
        projectId: "",
        taskListId: "",
        status: "",
        priority: "",
        dueDateFrom: "",
        dueDateTo: ""
    };

    resetProjectForm();
    resetTaskListForm();
    resetTagForm();
    resetTaskForm();
    resetCommentForm();
    resetReminderForm();
}

function isAdmin() {
    return state.me?.roles?.includes("ADMIN");
}

function emptyState(message) {
    return `<div class="detail-card empty-state">${escapeHtml(message)}</div>`;
}

function normalizeColor(value) {
    if (!value) {
        return null;
    }
    const trimmed = value.trim().replace(/^#?/, "#");
    return /^#[A-Fa-f0-9]{6}$/.test(trimmed) ? trimmed.toUpperCase() : null;
}

function toApiDateTime(value) {
    return value ? `${value}:00` : null;
}

function fromApiDateTime(value) {
    return value ? value.slice(0, 16) : "";
}

function formatDateTime(value) {
    if (!value) {
        return "Не задано";
    }
    return value.replace("T", " ").slice(0, 16);
}

function labelForProject(projectId) {
    if (!projectId) {
        return "Любой";
    }

    const project = state.projects.find((item) => String(item.id) === String(projectId));
    return project ? project.name : `Проект ${projectId}`;
}

function isContextCardActive(key) {
    if (key === "project") {
        return state.activeMode === "project";
    }
    if (key === "task-list") {
        return state.activeMode === "task-list";
    }
    if (key === "task") {
        return state.activeMode === "task" || state.activeMode === "project";
    }
    return state.selectedTaskId != null;
}

function buildContextHint(project, taskList, task) {
    if (!project) {
        return "Начните с проекта: это главный контейнер для всей дальнейшей работы.";
    }
    if (!taskList) {
        return "Теперь добавьте список задач, чтобы структурировать работу внутри проекта.";
    }
    if (!task) {
        return "Следующий шаг: создайте задачу и назначьте ей статус, приоритет и срок.";
    }
    return "Сейчас всё готово для работы: можно редактировать задачу, писать комментарии и ставить напоминания.";
}

function statusLabel(status) {
    if (status === "IN_PROGRESS") {
        return "В работе";
    }
    if (status === "DONE") {
        return "Завершено";
    }
    return "К выполнению";
}

function priorityLabel(priority) {
    if (priority === "HIGH") {
        return "Высокий";
    }
    if (priority === "LOW") {
        return "Низкий";
    }
    return "Средний";
}

function roleLabel(role) {
    return role === "ADMIN" ? "Администратор" : "Пользователь";
}

function channelLabel(channel) {
    return channel === "EMAIL" ? "Email" : "В приложении";
}

function statusColor(status) {
    if (status === "DONE") {
        return "#22c55e";
    }
    if (status === "IN_PROGRESS") {
        return "#38bdf8";
    }
    return "#f59e0b";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
