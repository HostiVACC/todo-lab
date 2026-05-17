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
    taskEditorExpanded: false,
    projectInlineEditing: false,
    projectInlineCreating: false,
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
const THEME_STORAGE_KEY = "todo-lab-theme";
let activeView = "tasks";

document.addEventListener("DOMContentLoaded", async () => {
    document.body.classList.add("minimal-ui");
    ensureThemeToggle();
    initializeTheme();
    bindElements();
    moveFiltersIntoWorkspace();
    localizeStaticText();
    normalizeAuthScreen();
    bindAuthModeSwitch();
    bindEvents();
    await initializeSession();
});

function ensureThemeToggle() {
    if (document.getElementById("themeToggle")) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "themeToggle";
    button.className = "theme-toggle";
    button.addEventListener("click", toggleTheme);
    document.body.appendChild(button);
}

function initializeTheme() {
    applyTheme("light");
}

function toggleTheme() {
    applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, document.documentElement.dataset.theme);
    } catch (error) {
        // Ignore localStorage access issues; theme still applies for the current session.
    }

    updateThemeToggleLabel();
}

function getCurrentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function updateThemeToggleLabel() {
    const button = document.getElementById("themeToggle");
    if (!button) {
        return;
    }

    const isDarkTheme = getCurrentTheme() === "dark";
    button.textContent = isDarkTheme ? "Светлая тема" : "Темная тема";
    button.title = isDarkTheme
        ? "Переключить на светлую тему"
        : "Переключить на темную тему";
    button.setAttribute("aria-label", button.title);
}

function bindElements() {
    const ids = [
        "notice", "authView", "appView", "loginForm", "registerForm", "loginEmail", "loginPassword",
        "registerDisplayName", "registerEmail", "registerPassword", "welcomeText", "roleText",
        "contextHint", "contextCards",
        "refreshButton", "logoutButton", "statsRow", "projectForm", "projectId", "projectName",
        "projectDescription", "resetProjectButton", "returnToProjectButton", "projectActionPanel", "projectList", "taskListForm", "taskListId",
        "taskListName", "taskListProjectId", "resetTaskListButton", "taskListItems", "tagForm", "tagId",
        "tagName", "tagColor", "tagColorText", "resetTagButton", "tagList", "taskFilterForm",
        "filterProjectId", "filterTaskListId", "filterStatus", "filterPriority", "filterDueDateFrom",
        "filterDueDateTo", "clearFiltersButton", "taskForm", "taskId", "taskTitle", "taskDescription",
        "taskStatus", "taskPriority", "taskDueDate", "taskTaskListId", "taskAssigneeId", "taskTagOptions",
        "taskProjectPanel",
        "taskEditOverlay", "taskEditForm", "editTaskId", "editTaskTitle", "editTaskDescription",
        "editTaskStatus", "editTaskPriority", "editTaskDueDate", "editTaskTaskListId", "editTaskAssigneeId",
        "editTaskTagOptions", "closeTaskEditButton", "closeTaskEditButtonBottom",
        "resetTaskButton", "taskMeta", "taskBoard", "detailTitle", "taskDetail", "commentForm", "commentId",
        "commentText", "resetCommentButton", "commentList", "reminderForm", "reminderId", "reminderAt",
        "reminderChannel", "resetReminderButton", "reminderList", "adminPanel", "userList"
    ];

    ids.forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function moveFiltersIntoWorkspace() {
    const filtersSection = document.getElementById("filtersSection");
    const tasksSection = document.getElementById("tasksSection");
    const taskLayout = tasksSection?.querySelector(".task-layout");
    if (!filtersSection || !tasksSection || !taskLayout) {
        return;
    }

    filtersSection.classList.add("workspace-filter-panel");
    tasksSection.insertBefore(filtersSection, taskLayout);
}

function localizeStaticText() {
    elements.authView?.classList.add("auth-shell-compact");
    document.querySelector(".auth-showcase")?.classList.add("auth-demo-panel");

    const authDemoTitle = document.querySelector(".auth-demo-panel .section-tag");
    const authHeading = document.querySelector(".auth-demo-panel h1");
    if (authDemoTitle) authDemoTitle.textContent = "Task Manager";
    if (authHeading) authHeading.textContent = "Todo Lab";

    const demoTag = document.querySelector(".demo-card .section-tag");
    if (demoTag) demoTag.textContent = "Быстрый вход";

    document.querySelectorAll(".quick-login").forEach((button) => {
        button.textContent = "Заполнить";
    });

    const demoAccounts = document.querySelectorAll(".demo-account strong");
    if (demoAccounts[0]) demoAccounts[0].textContent = "Администратор";
    if (demoAccounts[1]) demoAccounts[1].textContent = "Пользователь";

    const authHeaders = document.querySelectorAll(".auth-card .card-header");
    if (authHeaders[0]) {
        authHeaders[0].querySelector(".section-tag").textContent = "Авторизация";
        authHeaders[0].querySelector("h2").textContent = "Вход";
    }
    if (authHeaders[1]) {
        authHeaders[1].querySelector(".section-tag").textContent = "Регистрация";
        authHeaders[1].querySelector("h2").textContent = "Создать пользователя";
    }

    const loginLabels = elements.loginForm?.querySelectorAll("label span");
    if (loginLabels?.[1]) loginLabels[1].textContent = "Пароль";
    const registerLabels = elements.registerForm?.querySelectorAll("label span");
    if (registerLabels?.[0]) registerLabels[0].textContent = "Имя пользователя";
    if (registerLabels?.[2]) registerLabels[2].textContent = "Пароль";

    const loginButton = elements.loginForm?.querySelector("button[type='submit']");
    const registerButton = elements.registerForm?.querySelector("button[type='submit']");
    if (loginButton) loginButton.textContent = "Войти";
    if (registerButton) registerButton.textContent = "Зарегистрироваться";

    const navLabels = document.querySelectorAll(".sidebar-nav .nav-link span:last-child");
    if (navLabels[0]) navLabels[0].textContent = "Проекты";
    if (navLabels[1]) navLabels[1].textContent = "Мои задачи";
    if (navLabels[2]) navLabels[2].textContent = "Фильтры";
    if (navLabels[3]) navLabels[3].textContent = "Пользователи";

    const tabs = document.querySelectorAll(".product-tab");
    if (tabs[0]) tabs[0].textContent = "Проекты";
    if (tabs[1]) tabs[1].textContent = "Мои задачи";
    if (tabs[2]) tabs[2].textContent = "Документы";
    if (tabs[3]) tabs[3].textContent = "Настройки";

    const filterLabels = elements.taskFilterForm?.querySelectorAll("label span");
    ["Проект", "Список задач", "Статус", "Приоритет", "Срок от", "Срок до"].forEach((text, index) => {
        if (filterLabels?.[index]) filterLabels[index].textContent = text;
    });
    const filterButtons = elements.taskFilterForm?.querySelectorAll("button");
    if (filterButtons?.[0]) filterButtons[0].textContent = "Применить";
    if (filterButtons?.[1]) filterButtons[1].textContent = "Сбросить";
}

function normalizeAuthScreen() {
    const loginCard = document.querySelector(".login-auth-card");
    const registerCard = document.querySelector(".register-auth-card");

    const loginTag = loginCard?.querySelector(".section-tag");
    const loginTitle = loginCard?.querySelector("h2");
    const loginCopy = loginCard?.querySelector(".auth-card-title p:last-child");
    if (loginTag) loginTag.textContent = "Todo Lab";
    if (loginTitle) loginTitle.textContent = "Вход в Todo Lab";
    if (loginCopy) loginCopy.textContent = "Войдите, чтобы продолжить работу с проектами и задачами.";

    const registerTag = registerCard?.querySelector(".section-tag");
    const registerTitle = registerCard?.querySelector("h2");
    const registerCopy = registerCard?.querySelector(".auth-card-title p:last-child");
    if (registerTag) registerTag.textContent = "Todo Lab";
    if (registerTitle) registerTitle.textContent = "Регистрация";
    if (registerCopy) registerCopy.textContent = "Создайте аккаунт для демонстрации лабораторной работы.";

    const loginButton = elements.loginForm?.querySelector("button[type='submit']");
    const registerButton = elements.registerForm?.querySelector("button[type='submit']");
    if (loginButton) loginButton.textContent = "Войти";
    if (registerButton) registerButton.textContent = "Зарегистрироваться";
}

function bindAuthModeSwitch() {
    document.getElementById("showRegisterLink")?.addEventListener("click", (event) => {
        event.preventDefault();
        elements.authView?.classList.add("show-register");
        elements.registerDisplayName?.focus();
    });

    document.getElementById("showLoginLink")?.addEventListener("click", (event) => {
        event.preventDefault();
        elements.authView?.classList.remove("show-register");
        elements.loginEmail?.focus();
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
    elements.returnToProjectButton.addEventListener("click", goToSelectedProjectTasks);
    elements.projectActionPanel.addEventListener("click", handleProjectActionPanelClick);
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
    elements.taskProjectPanel.addEventListener("click", handleTaskProjectPanelClick);
    elements.taskProjectPanel.addEventListener("submit", handleTaskProjectPanelSubmit);
    elements.taskEditForm.addEventListener("submit", handleTaskEditSubmit);
    elements.closeTaskEditButton.addEventListener("click", closeTaskEditModal);
    elements.closeTaskEditButtonBottom.addEventListener("click", closeTaskEditModal);
    elements.taskEditOverlay.addEventListener("click", (event) => {
        if (event.target === elements.taskEditOverlay) {
            closeTaskEditModal();
        }
    });
    elements.taskBoard.addEventListener("click", handleTaskBoardClick);
    elements.taskBoard.addEventListener("dragstart", handleTaskDragStart);
    elements.taskBoard.addEventListener("dragover", handleTaskDragOver);
    elements.taskBoard.addEventListener("dragleave", handleTaskDragLeave);
    elements.taskBoard.addEventListener("drop", handleTaskDrop);
    elements.taskBoard.addEventListener("dragend", clearTaskDragState);

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

    document.querySelectorAll(".product-tab").forEach((button) => {
        button.addEventListener("click", () => setActiveView(button.dataset.view));
    });

    document.querySelectorAll(".sidebar-nav .nav-link").forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = link.getAttribute("href");
            if (target === "#projectsSection") {
                event.preventDefault();
                setActiveView("projects");
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            if (target === "#tasksSection") {
                event.preventDefault();
                setActiveView("tasks");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });

    document.getElementById("homeButton")?.addEventListener("click", () => {
        setActiveView("overview");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function setActiveView(view) {
    activeView = view || "tasks";
    document.body.dataset.view = activeView;

    document.querySelectorAll(".product-tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === activeView);
    });

    document.querySelectorAll(".sidebar-nav .nav-link").forEach((link) => {
        const target = link.getAttribute("href");
        const isActive = (activeView === "projects" && target === "#projectsSection")
            || (activeView === "tasks" && target === "#tasksSection")
            || (activeView === "settings" && target === "#usersSection");
        link.classList.toggle("active", isActive);
    });

    if (state.me && elements.taskBoard) {
        renderTaskProjectPanel();
        renderTasks();
    }
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

function makeCreatedTaskVisible(task) {
    if (!task) {
        return;
    }

    const projectId = task.projectId ? String(task.projectId) : "";
    if (projectId) {
        state.selectedProjectId = Number(projectId);
        state.filters.projectId = projectId;
        if (elements.filterProjectId) {
            elements.filterProjectId.value = projectId;
        }
    }

    if (task.taskListId) {
        state.selectedTaskListId = Number(task.taskListId);
    }

    state.selectedTaskId = task.id;
    state.filters.taskListId = "";
    state.filters.status = "";
    state.filters.priority = "";
    state.filters.dueDateFrom = "";
    state.filters.dueDateTo = "";
    state.quickSearch = "";
    state.minimalFilter = "all";
    state.smartQuickFilter = "all";

    if (elements.filterTaskListId) elements.filterTaskListId.value = "";
    if (elements.filterStatus) elements.filterStatus.value = "";
    if (elements.filterPriority) elements.filterPriority.value = "";
    if (elements.filterDueDateFrom) elements.filterDueDateFrom.value = "";
    if (elements.filterDueDateTo) elements.filterDueDateTo.value = "";

    document.querySelectorAll("[data-search-input], .minimal-search-input, .quick-search-input")
        .forEach((input) => {
            input.value = "";
        });
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
    document.body.classList.add("minimal-ui");
    elements.authView.classList.add("hidden");
    elements.appView.classList.remove("hidden");
    setActiveView(activeView);
}

function renderApp() {
    renderSignedInShell();
    renderHeader();
    renderStats();
    renderContext();
    setActiveMode(state.activeMode);
    renderProjectActionPanel();
    renderTaskProjectPanel();
    renderProjectOptions();
    renderProjects();
    renderTaskListOptions();
    renderTaskLists();
    renderTags();
    renderTaskFormOptions();
    renderTagOptions();
    resetTaskForm();
    syncTaskEditorState();
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

function renderProjectActionPanel() {
    const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
    if (!selectedProject) {
        elements.projectActionPanel.classList.add("hidden");
        elements.projectActionPanel.innerHTML = "";
        elements.returnToProjectButton.classList.add("hidden");
        return;
    }

    elements.projectActionPanel.classList.remove("hidden");
    elements.projectActionPanel.innerHTML = `
        <div>
            <span class="mini-chip">Выбранный проект</span>
            <h3>${escapeHtml(selectedProject.name)}</h3>
            <p>${escapeHtml(selectedProject.description || "Описание не указано.")}</p>
        </div>
        <div class="button-row">
            <button type="button" class="ghost-button" data-action="edit-selected-project">Редактировать</button>
            <button type="button" class="danger-button" data-action="delete-selected-project">Удалить</button>
            <button type="button" class="primary-button" data-action="open-selected-project">К задачам проекта</button>
        </div>
    `;
    elements.returnToProjectButton.classList.toggle("hidden", !elements.projectId.value);
}

function renderTaskProjectPanel() {
    const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
    if (!selectedProject) {
        elements.taskProjectPanel.classList.add("hidden");
        elements.taskProjectPanel.innerHTML = "";
        return;
    }

    elements.taskProjectPanel.classList.remove("hidden");

    if (state.projectInlineEditing) {
        elements.taskProjectPanel.innerHTML = `
            <form class="task-project-card is-editing" data-project-edit-form>
                <div>
                    <span class="mini-chip">Редактирование проекта</span>
                    <label>
                        <span>Название проекта</span>
                        <input name="name" type="text" maxlength="150" value="${escapeHtml(selectedProject.name)}" required>
                    </label>
                    <label>
                        <span>Описание</span>
                        <textarea name="description" rows="2" maxlength="1000">${escapeHtml(selectedProject.description || "")}</textarea>
                    </label>
                </div>
                <div class="button-row">
                    <button type="submit" class="primary-button">Сохранить проект</button>
                    <button type="button" class="ghost-button" data-action="cancel-project-edit">Отмена</button>
                </div>
            </form>
        `;
        return;
    }

    const projectLists = state.taskLists.filter((item) => item.projectId === selectedProject.id);
    elements.taskProjectPanel.innerHTML = `
        <div class="task-project-card">
            <div>
                <span class="mini-chip">Текущий проект</span>
                <h3>${escapeHtml(selectedProject.name)}</h3>
                <p>${escapeHtml(selectedProject.description || "Описание не указано.")}</p>
                <small>Списков задач: ${projectLists.length}</small>
            </div>
            <div class="button-row">
                <button type="button" class="ghost-button" data-action="edit-project-here">Редактировать проект</button>
                <button type="button" class="danger-button" data-action="delete-project-here">Удалить</button>
                <button type="button" class="primary-button" data-action="show-project-settings">Настройки проекта</button>
            </div>
        </div>
    `;
}

function renderProjectOptions() {
    elements.filterProjectId.innerHTML = optionMarkup(state.projects, "Все проекты", state.filters.projectId, true);
    elements.taskListProjectId.innerHTML = optionMarkup(state.projects, "Выберите проект", state.selectedProjectId, false);
}

function renderProjects() {
    if (state.projects.length === 0) {
        elements.projectList.innerHTML = emptyState("Пока нет проектов. Создай первый проект для демонстрации лабораторной работы.");
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

    elements.taskTagOptions.innerHTML = state.tags.map((tag) => `
        <label class="checkbox-item">
            <input type="checkbox" value="${tag.id}">
            <span>${escapeHtml(tag.name)} (${escapeHtml(normalizeColor(tag.color) || tag.color)})</span>
        </label>
    `).join("");
}

function renderTaskFormOptions() {
    const taskListsForSelectedProject = state.selectedProjectId
        ? state.taskLists.filter((item) => item.projectId === state.selectedProjectId)
        : state.taskLists;

    elements.taskTaskListId.innerHTML = optionMarkup(
        taskListsForSelectedProject,
        "Список будет создан автоматически",
        getTaskListSelection(),
        taskListsForSelectedProject.length === 0
    );

    const assigneeOptions = isAdmin() ? state.users : [state.me];
    const selectedAssignee = !isAdmin() ? state.me.id : "";

    elements.taskAssigneeId.innerHTML = ['<option value="">Не назначен</option>']
        .concat(assigneeOptions.map((user) => `
            <option value="${user.id}" ${String(selectedAssignee) === String(user.id) ? "selected" : ""}>
                ${escapeHtml(user.displayName)} (${escapeHtml(user.email)})
            </option>
        `))
        .join("");

    elements.editTaskTaskListId.innerHTML = optionMarkup(state.taskLists, "Выберите список задач", getTaskListSelection(), false);
    elements.editTaskAssigneeId.innerHTML = ['<option value="">Не назначен</option>']
        .concat(assigneeOptions.map((user) => `
            <option value="${user.id}">${escapeHtml(user.displayName)} (${escapeHtml(user.email)})</option>
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
    const taskListId = await ensureTaskListForCurrentProject();
    if (!taskListId) {
        showNotice("Сначала выберите или создайте проект.", "error");
        return;
    }

    const payload = {
        title: elements.taskTitle.value.trim(),
        description: elements.taskDescription.value.trim() || null,
        status: elements.taskStatus.value,
        priority: elements.taskPriority.value,
        dueDate: elements.taskDueDate.value || null,
        assigneeId: elements.taskAssigneeId.value ? Number(elements.taskAssigneeId.value) : null,
        taskListId,
        tagIds: [...elements.taskTagOptions.querySelectorAll("input:checked")].map((input) => Number(input.value))
    };

    try {
        const created = await api("/tasks", { method: "POST", body: payload });
        makeCreatedTaskVisible(created);
        showNotice("Задача создана.", "success");
        resetTaskForm();
        await refreshAllData();
    } catch (error) {
        showNotice(error.message, "error");
    }
}

async function ensureTaskListForCurrentProject() {
    const explicitTaskListId = Number(elements.taskTaskListId.value);
    if (explicitTaskListId && state.taskLists.some((item) => item.id === explicitTaskListId)) {
        return explicitTaskListId;
    }

    let selectedProjectId = Number(state.selectedProjectId || state.filters.projectId);
    if (!selectedProjectId && state.projects[0]) {
        selectedProjectId = state.projects[0].id;
        state.selectedProjectId = selectedProjectId;
    }

    if (!selectedProjectId) {
        return null;
    }

    if (!selectedProjectId) {
        const createdProject = await api("/projects", {
            method: "POST",
            body: {
                name: "Личный проект",
                description: "Автоматически создан для первых задач."
            }
        });
        state.projects.push(createdProject);
        selectedProjectId = createdProject.id;
        state.selectedProjectId = selectedProjectId;
        state.filters.projectId = String(selectedProjectId);
        showNotice("Создан первый проект для задач.", "info");
    }

    const existingList = state.taskLists.find((item) => item.projectId === selectedProjectId);
    if (existingList) {
        state.selectedTaskListId = existingList.id;
        return existingList.id;
    }

    const created = await api("/task-lists", {
        method: "POST",
        body: {
            name: "Основной список",
            projectId: selectedProjectId
        }
    });
    state.taskLists.push(created);
    state.selectedTaskListId = created.id;
    if (!state.filters.projectId) {
        state.filters.projectId = String(selectedProjectId);
    }
    showNotice("Для проекта создан основной список задач.", "info");
    return created.id;
}

async function handleTaskEditSubmit(event) {
    event.preventDefault();
    const id = elements.editTaskId.value;
    if (!id) {
        return;
    }

    const payload = {
        title: elements.editTaskTitle.value.trim(),
        description: elements.editTaskDescription.value.trim() || null,
        status: elements.editTaskStatus.value,
        priority: elements.editTaskPriority.value,
        dueDate: elements.editTaskDueDate.value || null,
        assigneeId: elements.editTaskAssigneeId.value ? Number(elements.editTaskAssigneeId.value) : null,
        taskListId: Number(elements.editTaskTaskListId.value),
        tagIds: [...elements.editTaskTagOptions.querySelectorAll("input:checked")].map((input) => Number(input.value))
    };

    try {
        const updated = await api(`/tasks/${id}`, { method: "PUT", body: payload });
        state.selectedTaskId = updated.id;
        state.tasksPage.content = (state.tasksPage.content || []).map((task) =>
            String(task.id) === String(updated.id) ? { ...task, ...updated } : task
        );
        closeTaskEditModal();
        await refreshAllData();
        showNotice("Задача обновлена.", "success");
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
        state.projectInlineEditing = false;
        setActiveMode("task-list");
        setActiveView("overview");
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
        openProjectEditor(project);
        return;
    }

    if (action === "delete-project" && window.confirm(`Удалить проект "${project.name}"?`)) {
        try {
            await api(`/projects/${id}`, { method: "DELETE" });
            removeProjectFromState(id);
            resetProjectForm();
            renderApp();
            showNotice("Проект удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleProjectActionPanelClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const project = state.projects.find((item) => item.id === state.selectedProjectId);
    if (action === "show-project-settings" && !project) {
        setActiveMode("project");
        elements.projectName.focus();
        return;
    }
    if (!action || !project) {
        return;
    }

    if (action === "edit-selected-project") {
        openProjectEditor(project);
        return;
    }

    if (action === "open-selected-project") {
        await goToSelectedProjectTasks();
        return;
    }

    if (action === "delete-selected-project" && window.confirm(`Удалить проект "${project.name}"?`)) {
        try {
            await api(`/projects/${project.id}`, { method: "DELETE" });
            removeProjectFromState(project.id);
            resetProjectForm();
            renderApp();
            showNotice("Проект удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleTaskProjectPanelClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    const project = state.projects.find((item) => item.id === state.selectedProjectId);

    if (action === "show-project-settings" && !project) {
        setActiveView("settings");
        requestAnimationFrame(() => {
            document.querySelector("[data-quick-project-form] input[name='name']")?.focus();
        });
        return;
    }

    if (!action || !project) {
        return;
    }

    if (action === "edit-project-here") {
        state.projectInlineCreating = false;
        state.projectInlineEditing = true;
        renderTaskProjectPanel();
        return;
    }

    if (action === "new-project-here") {
        state.projectInlineEditing = false;
        state.projectInlineCreating = true;
        renderTaskProjectPanel();
        requestAnimationFrame(() => {
            elements.taskProjectPanel.querySelector("[data-quick-project-form] input[name='name']")?.focus();
        });
        return;
    }

    if (action === "cancel-project-edit" || action === "cancel-project-create") {
        state.projectInlineEditing = false;
        state.projectInlineCreating = false;
        renderTaskProjectPanel();
        return;
    }

    if (action === "show-project-settings") {
        openProjectEditor(project);
        return;
    }

    if (action === "focus-new-task") {
        resetTaskForm();
        state.taskEditorExpanded = true;
        syncTaskEditorState();
        elements.taskTitle.focus();
        return;
    }

    if (action === "delete-project-here" && window.confirm(`Удалить проект "${project.name}"?`)) {
        try {
            await api(`/projects/${project.id}`, { method: "DELETE" });
            removeProjectFromState(project.id);
            state.projectInlineEditing = false;
            resetProjectForm();
            renderApp();
            showNotice("Проект удалён.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }
}

async function handleTaskProjectPanelSubmit(event) {
    if (!event.target.matches("[data-project-edit-form]")) {
        return;
    }

    event.preventDefault();
    const project = state.projects.find((item) => item.id === state.selectedProjectId);
    if (!project) {
        return;
    }

    const form = event.target;
    try {
        await api(`/projects/${project.id}`, {
            method: "PUT",
            body: {
                name: form.elements.name.value.trim(),
                description: form.elements.description.value.trim() || null
            }
        });
        state.projectInlineEditing = false;
        await refreshAllData();
        showNotice("Проект обновлён.", "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

function openProjectEditor(project) {
    elements.projectId.value = String(project.id);
    elements.projectName.value = project.name;
    elements.projectDescription.value = project.description || "";
    state.selectedProjectId = project.id;
    setActiveMode("project");
    setActiveView("overview");
    renderProjects();
    renderProjectActionPanel();
    requestAnimationFrame(() => {
        elements.projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
        elements.projectName.focus();
        elements.projectName.select();
    });
    showNotice("Проект открыт для редактирования.");
}

async function goToSelectedProjectTasks() {
    if (!state.selectedProjectId) {
        return;
    }

    state.filters.projectId = String(state.selectedProjectId);
    state.filters.taskListId = "";
    elements.filterProjectId.value = String(state.selectedProjectId);
    syncTaskListFilterOptions();
    setActiveView("overview");
    await loadTasks();
    await loadTaskSideData();
    renderApp();
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
    const card = event.target.closest(".task-card");
    const action = button?.dataset.action || (card ? "edit-task" : "");
    const id = Number(button?.dataset.id || card?.dataset.id);

    if (action === "focus-new-task") {
        setActiveMode("task");
        resetTaskForm();
        if (button?.dataset.due) {
            elements.taskDueDate.value = button.dataset.due;
        }
        if (button?.dataset.status) {
            elements.taskStatus.value = button.dataset.status;
        }
        state.taskEditorExpanded = true;
        syncTaskEditorState();
        elements.taskTitle.focus();
        return;
    }

    if (!action || !id) {
        return;
    }

    if (action === "toggle-task") {
        const task = state.tasksPage.content.find((item) => item.id === id);
        const nextStatus = task?.status === "DONE" ? "TODO" : "DONE";
        try {
            await api(`/tasks/${id}/status?status=${nextStatus}`, { method: "PATCH" });
            await refreshAllData();
            showNotice(nextStatus === "DONE" ? "Задача выполнена." : "Задача снова в работе.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
        return;
    }

    if (action === "select-task" || action === "edit-task") {
        state.selectedTaskId = id;
        setActiveMode("task");
        await loadTaskSideData();
        openTaskEditModal(getSelectedTask());
        showNotice(action === "edit-task" ? "Задача открыта для редактирования." : "Задача открыта.");
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

function handleTaskDragStart(event) {
    const card = event.target.closest(".task-card[data-id]");
    if (!card || !isProjectBoardView()) {
        return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.id);
    card.classList.add("is-dragging");
}

function handleTaskDragOver(event) {
    const column = event.target.closest(".board-column[data-status]");
    if (!column || !isProjectBoardView()) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    column.classList.add("is-drop-target");
}

function handleTaskDragLeave(event) {
    const column = event.target.closest(".board-column[data-status]");
    if (!column || column.contains(event.relatedTarget)) {
        return;
    }

    column.classList.remove("is-drop-target");
}

function clearTaskDragState() {
    document.querySelectorAll(".is-drop-target, .is-dragging").forEach((item) => {
        item.classList.remove("is-drop-target", "is-dragging");
    });
}

async function handleTaskDrop(event) {
    const column = event.target.closest(".board-column[data-status]");
    if (!column || !isProjectBoardView()) {
        return;
    }

    event.preventDefault();
    clearTaskDragState();

    const id = Number(event.dataTransfer.getData("text/plain"));
    const nextStatus = column.dataset.status;
    const task = state.tasksPage.content.find((item) => item.id === id);
    if (!id || !nextStatus || !task || task.status === nextStatus) {
        return;
    }

    try {
        await api(`/tasks/${id}/status?status=${nextStatus}`, { method: "PATCH" });
        state.selectedTaskId = id;
        await refreshAllData();
        showNotice(`Задача перенесена: ${statusLabel(nextStatus)}.`, "success");
    } catch (error) {
        showNotice(error.message, "error");
    }
}

function isProjectBoardView() {
    return activeView === "overview" || activeView === "projects";
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
    elements.returnToProjectButton.classList.add("hidden");
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
    state.taskEditorExpanded = false;
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
    syncTaskEditorState();
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

function syncTaskEditorState() {
    if (!elements.taskForm) {
        return;
    }

    const isEditing = false;
    const isExpanded = false;
    elements.taskForm.classList.toggle("is-expanded", isExpanded);

    const submitButton = elements.taskForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Создать задачу";
    }
    if (elements.resetTaskButton) {
        elements.resetTaskButton.textContent = "Новая задача";
    }
    return;
    if (submitButton) {
        submitButton.textContent = isEditing ? "Сохранить изменения" : "Создать задачу";
    }

    if (elements.resetTaskButton) {
        elements.resetTaskButton.textContent = isExpanded ? "Закрыть" : "Новая задача";
    }
}

function openTaskEditModal(task) {
    if (!task) {
        showNotice("Задача не найдена.", "error");
        return;
    }

    elements.editTaskId.value = String(task.id);
    elements.editTaskTitle.value = task.title;
    elements.editTaskDescription.value = task.description || "";
    elements.editTaskStatus.value = task.status;
    elements.editTaskPriority.value = task.priority;
    elements.editTaskDueDate.value = task.dueDate || "";
    elements.editTaskTaskListId.value = String(task.taskListId);
    elements.editTaskAssigneeId.value = task.assigneeId ? String(task.assigneeId) : "";

    const selectedTagIds = new Set((task.tags || []).map((tag) => String(tag.id)));
    elements.editTaskTagOptions.innerHTML = state.tags.length === 0
        ? `<div class="stack-empty">Тегов пока нет.</div>`
        : state.tags.map((tag) => `
            <label class="checkbox-item">
                <input type="checkbox" value="${tag.id}" ${selectedTagIds.has(String(tag.id)) ? "checked" : ""}>
                <span>${escapeHtml(tag.name)} (${escapeHtml(normalizeColor(tag.color) || tag.color)})</span>
            </label>
        `).join("");

    elements.taskEditOverlay.classList.remove("hidden");
    elements.taskEditOverlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
        elements.editTaskTitle.focus();
        elements.editTaskTitle.select();
    });
}

function closeTaskEditModal() {
    elements.taskEditOverlay.classList.add("hidden");
    elements.taskEditOverlay.setAttribute("aria-hidden", "true");
    elements.editTaskForm.reset();
    elements.editTaskId.value = "";
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

function syncTaskEditorState() {
    if (!elements.taskForm) {
        return;
    }

    elements.taskForm.classList.toggle("is-expanded", state.taskEditorExpanded);

    const submitButton = elements.taskForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.textContent = "Создать задачу";
    }
    if (elements.resetTaskButton) {
        elements.resetTaskButton.textContent = state.taskEditorExpanded ? "Свернуть форму" : "Новая задача";
    }
}

function getSelectedTask() {
    return state.tasksPage.content.find((task) => task.id === state.selectedTaskId) || null;
}

function getTaskListSelection() {
    if (state.selectedTaskListId) {
        return String(state.selectedTaskListId);
    }
    if (state.selectedProjectId) {
        const projectList = state.taskLists.find((item) => item.projectId === state.selectedProjectId);
        if (projectList) {
            return String(projectList.id);
        }
        return "";
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

function removeProjectFromState(projectId) {
    const projectTaskListIds = new Set(
        state.taskLists
            .filter((taskList) => taskList.projectId === projectId)
            .map((taskList) => taskList.id)
    );

    state.projects = state.projects.filter((project) => project.id !== projectId);
    state.taskLists = state.taskLists.filter((taskList) => taskList.projectId !== projectId);
    state.tasksPage = {
        ...state.tasksPage,
        content: state.tasksPage.content.filter((task) => !projectTaskListIds.has(task.taskListId))
    };

    if (state.selectedProjectId === projectId) {
        state.selectedProjectId = state.projects[0]?.id || null;
        state.filters.projectId = state.selectedProjectId ? String(state.selectedProjectId) : "";
    }
    if (state.selectedTaskListId && projectTaskListIds.has(state.selectedTaskListId)) {
        state.selectedTaskListId = null;
        state.filters.taskListId = "";
    }
    if (!state.tasksPage.content.some((task) => task.id === state.selectedTaskId)) {
        state.selectedTaskId = state.tasksPage.content[0]?.id || null;
        state.comments = [];
        state.reminders = [];
    }
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

function renderTasks() {
    const tasks = state.tasksPage.content;
    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Задач: ${tasks.length}</span>
        <span class="mini-chip">Найдено: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Проект: ${escapeHtml(labelForProject(state.filters.projectId))}</span>
    `;

    if (tasks.length === 0) {
        elements.taskBoard.innerHTML = emptyState("По текущим фильтрам задачи не найдены.");
        return;
    }

    const columns = [
        { status: "TODO", title: "К выполнению" },
        { status: "IN_PROGRESS", title: "В работе" },
        { status: "DONE", title: "Готово" }
    ];

    elements.taskBoard.innerHTML = columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);

        return `
            <section class="board-column" data-status="${column.status}">
                <header class="board-column-header">
                    <div>
                        <h3>${column.title}</h3>
                        <span>${columnTasks.length} задач</span>
                    </div>
                </header>
                <div class="board-column-stack">
                    ${columnTasks.length > 0 ? columnTasks.map((task) => `
                        <article class="task-card ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" title="Нажмите, чтобы открыть редактирование">
                            <div class="card-topline">
                                <div>
                                    <span class="task-id">#${task.id}</span>
                                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                                    <p class="card-copy">${escapeHtml(task.description || "Описание отсутствует")}</p>
                                </div>
                            </div>
                            <div class="card-meta">
                                <span class="mini-chip"><span class="status-dot" style="background:${statusColor(task.status)}"></span>${statusLabel(task.status)}</span>
                                <span class="mini-chip">${priorityLabel(task.priority)}</span>
                                <span class="mini-chip">${escapeHtml(task.dueDate || "Без срока")}</span>
                            </div>
                            <div class="card-meta">
                                ${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("")}
                            </div>
                            <div class="task-card-footer">
                                <span>${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
                                <div class="button-row">
                                    <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                                    <button type="button" class="ghost-button" data-action="edit-task" data-id="${task.id}">Изм.</button>
                                    <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                                </div>
                            </div>
                        </article>
                    `).join("") : `
                        <div class="board-empty">Здесь пока нет задач</div>
                    `}
                </div>
            </section>
        `;
    }).join("");
}

function renderProjectOptions() {
    elements.filterProjectId.innerHTML = optionMarkup(state.projects, "Все проекты", state.filters.projectId, true);
    elements.taskListProjectId.innerHTML = optionMarkup(state.projects, "Выберите проект", state.selectedProjectId, false);
}

function renderTaskFormOptions() {
    const taskListsForSelectedProject = state.selectedProjectId
        ? state.taskLists.filter((item) => item.projectId === state.selectedProjectId)
        : state.taskLists;

    elements.taskTaskListId.innerHTML = optionMarkup(
        taskListsForSelectedProject,
        "Будет создан базовый список",
        getTaskListSelection(),
        taskListsForSelectedProject.length === 0
    );

    const assigneeOptions = isAdmin() ? state.users : [state.me];
    const selectedAssignee = !isAdmin() ? state.me.id : "";

    elements.taskAssigneeId.innerHTML = ['<option value="">Не назначен</option>']
        .concat(assigneeOptions.map((user) => `
            <option value="${user.id}" ${String(selectedAssignee) === String(user.id) ? "selected" : ""}>
                ${escapeHtml(user.displayName)} (${escapeHtml(user.email)})
            </option>
        `))
        .join("");

    elements.editTaskTaskListId.innerHTML = optionMarkup(state.taskLists, "Выберите список задач", getTaskListSelection(), false);
    elements.editTaskAssigneeId.innerHTML = ['<option value="">Не назначен</option>']
        .concat(assigneeOptions.map((user) => `
            <option value="${user.id}">${escapeHtml(user.displayName)} (${escapeHtml(user.email)})</option>
        `))
        .join("");
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

function statusLabel(status) {
    if (status === "IN_PROGRESS") {
        return "В работе";
    }
    if (status === "DONE") {
        return "Готово";
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

function statusColor(status) {
    if (status === "DONE") {
        return "#40b66b";
    }
    if (status === "IN_PROGRESS") {
        return "#e4b536";
    }
    return "#9aa3b2";
}

/*
function renderTasks() {
    const tasks = state.tasksPage.content;
    const today = getLocalIsoDate();
    const tomorrow = getLocalIsoDate(1);
    const selectedTask = getSelectedTask() || tasks[0] || null;
    const reminderCount = selectedTask && selectedTask.id === state.selectedTaskId ? state.reminders.length : 0;
    const groups = [
        {
            key: "today",
            title: "Сегодня",
            hint: "То, что лучше закрыть прямо сейчас",
            tasks: tasks.filter((task) => task.dueDate === today)
        },
        {
            key: "tomorrow",
            title: "Завтра",
            hint: "План на следующий день",
            tasks: tasks.filter((task) => task.dueDate === tomorrow)
        },
        {
            key: "overdue",
            title: "Просрочено",
            hint: "Нужно быстро разобрать",
            tasks: tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "DONE")
        },
        {
            key: "no-date",
            title: "Без срока",
            hint: "Задачи без дедлайна",
            tasks: tasks.filter((task) => !task.dueDate)
        },
        {
            key: "other",
            title: "Другие задачи",
            hint: "Остальной план",
            tasks: tasks.filter((task) => task.dueDate && task.dueDate !== today && task.dueDate !== tomorrow && !(task.dueDate < today && task.status !== "DONE"))
        }
    ];

    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Сегодня: ${groups[0].tasks.length}</span>
        <span class="mini-chip">Завтра: ${groups[1].tasks.length}</span>
        <span class="mini-chip">Просрочено: ${groups[2].tasks.length}</span>
        <span class="mini-chip">Всего: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Проект: ${escapeHtml(labelForProject(state.filters.projectId || state.selectedProjectId))}</span>
    `;

    if (tasks.length === 0) {
        elements.taskBoard.innerHTML = `
            <div class="task-agenda">
                <section class="task-agenda-list">
                    <div class="agenda-section-title">
                        <div>
                            <h2>Мои задачи</h2>
                            <p>По текущим фильтрам задач пока нет.</p>
                        </div>
                        <button type="button" class="primary-button" data-action="focus-new-task">Новая задача</button>
                    </div>
                    <div class="agenda-empty-large">Создайте первую задачу или выберите другой проект в фильтрах.</div>
                </section>
                <aside class="task-agenda-detail">
                    <span class="section-tag">Детали</span>
                    <h2>Задача не выбрана</h2>
                    <p class="card-copy">Здесь появятся срок, исполнитель, теги, комментарии и напоминания.</p>
                </aside>
            </div>
        `;
        return;
    }

    elements.taskBoard.innerHTML = `
        <div class="task-agenda">
            <section class="task-agenda-list">
                <div class="agenda-section-title">
                    <div>
                        <h2>Мои задачи</h2>
                        <p>Задачи сгруппированы по срокам: сегодня, завтра, просроченные и без даты.</p>
                    </div>
                    <button type="button" class="primary-button" data-action="focus-new-task">Новая задача</button>
                </div>
                <div class="agenda-table-head">
                    <span>Наименование</span>
                    <span>Номер</span>
                    <span>Исполнитель</span>
                    <span>Проект</span>
                    <span>Срок</span>
                </div>
                ${groups.map((group) => renderTaskAgendaGroup(group)).join("")}
            </section>
            ${renderTaskAgendaDetail(selectedTask, reminderCount)}
        </div>
    `;
}

function renderTaskAgendaGroup(group) {
    return `
        <section class="agenda-group agenda-group-${group.key}">
            <button type="button" class="agenda-group-title" data-action="focus-new-task">
                <span>${group.title}</span>
                <small>${group.tasks.length} задач · ${group.hint}</small>
            </button>
            <button type="button" class="agenda-add-row" data-action="focus-new-task">+ Новая задача</button>
            ${group.tasks.length > 0 ? group.tasks.map((task) => renderTaskAgendaRow(task)).join("") : `
                <div class="agenda-empty-row">Здесь пока нет задач</div>
            `}
        </section>
    `;
}

function renderTaskAgendaRow(task) {
    return `
        <article class="agenda-task-row task-card ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}">
            <div class="agenda-task-main">
                <span class="task-check-dot" style="border-color:${statusColor(task.status)}"></span>
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                    <p>${escapeHtml(task.description || "Описание отсутствует")}</p>
                </div>
            </div>
            <span class="task-id">#${task.id}</span>
            <span>${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
            <span>${escapeHtml(projectNameForTask(task))}</span>
            <span class="agenda-due ${dateToneClass(task.dueDate)}">${escapeHtml(formatTaskDate(task.dueDate))}</span>
            <div class="agenda-row-meta">
                <span class="mini-chip"><span class="status-dot" style="background:${statusColor(task.status)}"></span>${statusLabel(task.status)}</span>
                <span class="mini-chip">${priorityLabel(task.priority)}</span>
                ${(task.tags || []).slice(0, 3).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("")}
            </div>
        </article>
    `;
}

function renderTaskAgendaDetail(task, reminderCount) {
    if (!task) {
        return `
            <aside class="task-agenda-detail">
                <span class="section-tag">Детали</span>
                <h2>Задача не выбрана</h2>
                <p class="card-copy">Нажмите на задачу в списке, чтобы открыть редактирование и увидеть детали.</p>
            </aside>
        `;
    }

    return `
        <aside class="task-agenda-detail">
            <div class="agenda-detail-top">
                <span class="section-tag">Карточка задачи</span>
                <span class="task-id">#${task.id}</span>
            </div>
            <h2>${escapeHtml(task.title)}</h2>
            <p class="card-copy">${escapeHtml(task.description || "Описание отсутствует")}</p>
            <div class="agenda-detail-actions">
                <button type="button" class="primary-button" data-action="edit-task" data-id="${task.id}">Редактировать</button>
                <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="DONE">Выполнено</button>
            </div>
            <dl class="agenda-detail-list">
                <div><dt>Статус</dt><dd>${statusLabel(task.status)}</dd></div>
                <div><dt>Приоритет</dt><dd>${priorityLabel(task.priority)}</dd></div>
                <div><dt>Дата</dt><dd>${escapeHtml(formatTaskDate(task.dueDate))}</dd></div>
                <div><dt>Исполнитель</dt><dd>${escapeHtml(task.assigneeEmail || "Не назначен")}</dd></div>
                <div><dt>Проект</dt><dd>${escapeHtml(projectNameForTask(task))}</dd></div>
                <div><dt>Список</dt><dd>${escapeHtml(task.taskListName || "Основной список")}</dd></div>
            </dl>
            <div class="agenda-detail-block">
                <h3>Напоминания</h3>
                <p>${reminderCount > 0 ? `Добавлено напоминаний: ${reminderCount}` : "Напоминаний пока нет. Откройте задачу и добавьте время напоминания."}</p>
            </div>
            <div class="agenda-detail-block">
                <h3>Теги</h3>
                <div class="card-meta">
                    ${(task.tags || []).length > 0 ? task.tags.map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("") : `<span class="mini-chip">Тегов пока нет</span>`}
                </div>
            </div>
        </aside>
    `;
}

function getLocalIsoDate(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatTaskDate(value) {
    if (!value) {
        return "Без срока";
    }
    if (value === getLocalIsoDate()) {
        return "Сегодня";
    }
    if (value === getLocalIsoDate(1)) {
        return "Завтра";
    }
    return value;
}

function dateToneClass(value) {
    if (!value) {
        return "is-muted";
    }
    if (value < getLocalIsoDate()) {
        return "is-danger";
    }
    if (value === getLocalIsoDate() || value === getLocalIsoDate(1)) {
        return "is-warning";
    }
    return "";
}

function projectNameForTask(task) {
    const taskList = state.taskLists.find((item) => String(item.id) === String(task.taskListId));
    return taskList ? labelForProject(taskList.projectId) : labelForProject(state.selectedProjectId || state.filters.projectId);
}
*/

function renderMyTasks() {
    const tasks = state.tasksPage.content;
    const today = agendaIsoDate();
    const tomorrow = agendaIsoDate(1);
    const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "DONE");
    const todayTasks = tasks.filter((task) => task.dueDate === today);
    const tomorrowTasks = tasks.filter((task) => task.dueDate === tomorrow);
    const noDateTasks = tasks.filter((task) => !task.dueDate);
    const otherTasks = tasks.filter((task) =>
        task.dueDate
        && task.dueDate !== today
        && task.dueDate !== tomorrow
        && !(task.dueDate < today && task.status !== "DONE")
    );
    const completedCount = tasks.filter((task) => task.status === "DONE").length;
    const selectedRemindersCount = state.selectedTaskId ? state.reminders.length : 0;

    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Всего: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Сегодня: ${todayTasks.length}</span>
        <span class="mini-chip">Завтра: ${tomorrowTasks.length}</span>
        <span class="mini-chip">Просрочено: ${overdueTasks.length}</span>
        <span class="mini-chip">Выполнено: ${completedCount}</span>
        <span class="mini-chip">Напоминаний у выбранной: ${selectedRemindersCount}</span>
    `;

    const groups = [
        { title: "Просрочено", date: today, tasks: overdueTasks, tone: "danger" },
        { title: "Сегодня", date: today, tasks: todayTasks, tone: "today" },
        { title: "Завтра", date: tomorrow, tasks: tomorrowTasks, tone: "tomorrow" },
        { title: "Без срока", date: "", tasks: noDateTasks, tone: "muted" },
        { title: "Другие задачи", date: "", tasks: otherTasks, tone: "default" }
    ];

    elements.taskBoard.innerHTML = `
        <section class="my-tasks-view">
            <div class="my-tasks-header">
                <div>
                    <p class="section-tag">Мои задачи</p>
                    <h2>План по дням</h2>
                    <p>Здесь задачи отделены от проектов: проекты задают структуру, а этот экран показывает личный план работы.</p>
                </div>
                <div class="my-tasks-tabs" aria-label="Фильтры задач">
                    <button type="button" class="active">Назначенные мне</button>
                    <button type="button">Все задачи</button>
                    <button type="button">Напоминания</button>
                </div>
            </div>
            <div class="agenda-table">
                <div class="agenda-head">
                    <span>Наименование</span>
                    <span>Номер</span>
                    <span>Исполнитель</span>
                    <span>Проект</span>
                    <span>Срок</span>
                    <span>Приоритет</span>
                    <span>Теги</span>
                </div>
                ${groups.map((group) => renderAgendaGroup(group)).join("")}
            </div>
        </section>
    `;
}

function renderAgendaGroup(group) {
    return `
        <section class="agenda-day agenda-day-${group.tone}">
            <button type="button" class="agenda-day-title" data-action="focus-new-task" data-due="${group.date}">
                <span>${group.title}</span>
                <small>${group.tasks.length} задач</small>
            </button>
            <button type="button" class="agenda-new-row" data-action="focus-new-task" data-due="${group.date}">+ Новая задача</button>
            ${group.tasks.length > 0
                ? group.tasks.map((task) => renderAgendaTaskRow(task)).join("")
                : `<div class="agenda-empty-line">В этой группе пока нет задач</div>`}
        </section>
    `;
}

function renderAgendaTaskRow(task) {
    const done = task.status === "DONE";
    return `
        <article class="agenda-row task-card ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}">
            <div class="agenda-name">
                <button type="button" class="task-done-toggle" data-action="toggle-task" data-id="${task.id}" title="${done ? "Вернуть в работу" : "Отметить выполненной"}">
                    ${done ? "✓" : ""}
                </button>
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                    <p>${escapeHtml(task.description || "Описание отсутствует")}</p>
                </div>
            </div>
            <span class="task-id">#${task.id}</span>
            <span>${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
            <span>${escapeHtml(agendaProjectName(task))}</span>
            <span class="agenda-date ${agendaDateClass(task.dueDate)}">${escapeHtml(agendaDateLabel(task.dueDate))}</span>
            <span class="mini-chip">${priorityLabel(task.priority)}</span>
            <span class="agenda-tags">${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("") || "—"}</span>
        </article>
    `;
}

function agendaIsoDate(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function agendaDateLabel(value) {
    if (!value) {
        return "Без срока";
    }
    if (value === agendaIsoDate()) {
        return "Сегодня";
    }
    if (value === agendaIsoDate(1)) {
        return "Завтра";
    }
    return value;
}

function renderTaskProjectPanel() {
    const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
    if (!selectedProject) {
        elements.taskProjectPanel.classList.remove("hidden");
        elements.taskProjectPanel.innerHTML = `
            <div class="project-hero-card">
                <div>
                    <p class="section-tag">Проекты</p>
                    <h2>Создайте первый проект</h2>
                    <p>Проект нужен, чтобы хранить списки задач и карточки на доске.</p>
                </div>
                <button type="button" class="primary-button" data-action="show-project-settings">Создать проект</button>
            </div>
        `;
        return;
    }

    elements.taskProjectPanel.classList.remove("hidden");

    if (state.projectInlineEditing) {
        elements.taskProjectPanel.innerHTML = `
            <form class="project-hero-card is-editing" data-project-edit-form>
                <div>
                    <p class="section-tag">Редактирование проекта</p>
                    <label>
                        <span>Название проекта</span>
                        <input name="name" type="text" maxlength="150" value="${escapeHtml(selectedProject.name)}" required>
                    </label>
                    <label>
                        <span>Описание</span>
                        <textarea name="description" rows="2" maxlength="1000">${escapeHtml(selectedProject.description || "")}</textarea>
                    </label>
                </div>
                <div class="button-row">
                    <button type="submit" class="primary-button">Сохранить</button>
                    <button type="button" class="ghost-button" data-action="cancel-project-edit">Вернуться к проекту</button>
                </div>
            </form>
        `;
        return;
    }

    const projectLists = state.taskLists.filter((item) => item.projectId === selectedProject.id);
    const projectTasks = state.tasksPage.content;
    const doneCount = projectTasks.filter((task) => task.status === "DONE").length;

    elements.taskProjectPanel.innerHTML = `
        <div class="project-hero-card">
            <div>
                <p class="section-tag">Текущий проект</p>
                <h2>${escapeHtml(selectedProject.name)}</h2>
                <p>${escapeHtml(selectedProject.description || "Описание не указано.")}</p>
                <div class="project-hero-stats">
                    <span>${projectLists.length} списков</span>
                    <span>${projectTasks.length} задач</span>
                    <span>${doneCount} готово</span>
                </div>
            </div>
            <div class="button-row">
                <button type="button" class="ghost-button" data-action="edit-project-here">Редактировать</button>
                <button type="button" class="danger-button" data-action="delete-project-here">Удалить</button>
                <button type="button" class="primary-button" data-action="focus-new-task">+ Задача</button>
            </div>
        </div>
    `;
}

function renderProjects() {
    if (state.projects.length === 0) {
        elements.projectList.innerHTML = emptyState("Пока нет проектов. Создайте первый проект.");
        return;
    }

    elements.projectList.innerHTML = state.projects.map((project) => {
        const listsCount = state.taskLists.filter((item) => item.projectId === project.id).length;
        return `
            <article class="list-card project-list-card ${project.id === state.selectedProjectId ? "active" : ""}" data-id="${project.id}">
                <div class="card-topline">
                    <div>
                        <h3 class="card-title">${escapeHtml(project.name)}</h3>
                        <p class="card-copy">${escapeHtml(project.description || "Описание не указано.")}</p>
                    </div>
                </div>
                <div class="card-meta">
                    <span class="mini-chip">${listsCount} списков</span>
                    <span class="mini-chip">ID ${project.id}</span>
                </div>
            </article>
        `;
    }).join("");
}

function agendaDateClass(value) {
    if (!value) {
        return "is-muted";
    }
    if (value < agendaIsoDate()) {
        return "is-danger";
    }
    if (value === agendaIsoDate() || value === agendaIsoDate(1)) {
        return "is-today";
    }
    return "";
}

function agendaProjectName(task) {
    const taskList = state.taskLists.find((item) => String(item.id) === String(task.taskListId));
    return taskList ? labelForProject(taskList.projectId) : labelForProject(state.selectedProjectId || state.filters.projectId);
}

function renderProjectTaskBoard() {
    const tasks = state.tasksPage.content;
    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Задач: ${tasks.length}</span>
        <span class="mini-chip">Найдено: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Проект: ${escapeHtml(labelForProject(state.filters.projectId || state.selectedProjectId))}</span>
    `;

    if (tasks.length === 0) {
        elements.taskBoard.innerHTML = `
            <div class="project-board-empty">
                <h3>В выбранном проекте задач пока нет</h3>
                <p>Создайте задачу в форме выше. Она попадёт в текущий проект и появится на доске.</p>
            </div>
        `;
        return;
    }

    const columns = [
        { status: "TODO", title: "К выполнению" },
        { status: "IN_PROGRESS", title: "В работе" },
        { status: "DONE", title: "Готово" }
    ];

    elements.taskBoard.innerHTML = columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);

        return `
            <section class="board-column" data-status="${column.status}">
                <header class="board-column-header">
                    <div>
                        <h3>${column.title}</h3>
                        <span>${columnTasks.length} задач</span>
                    </div>
                </header>
                <div class="board-column-stack">
                    ${columnTasks.length > 0 ? columnTasks.map((task) => `
                        <article class="task-card ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" title="Нажмите, чтобы открыть редактирование">
                            <div class="card-topline">
                                <div>
                                    <span class="task-id">#${task.id}</span>
                                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                                    <p class="card-copy">${escapeHtml(task.description || "Описание отсутствует")}</p>
                                </div>
                            </div>
                            <div class="card-meta">
                                <span class="mini-chip"><span class="status-dot" style="background:${statusColor(task.status)}"></span>${statusLabel(task.status)}</span>
                                <span class="mini-chip">${priorityLabel(task.priority)}</span>
                                <span class="mini-chip">${escapeHtml(task.dueDate || "Без срока")}</span>
                            </div>
                            <div class="card-meta">
                                ${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("")}
                            </div>
                            <div class="task-card-footer">
                                <span>${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
                                <div class="button-row">
                                    <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                                    <button type="button" class="ghost-button" data-action="edit-task" data-id="${task.id}">Изм.</button>
                                    <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                                </div>
                            </div>
                        </article>
                    `).join("") : `
                        <div class="board-empty">Здесь пока нет задач</div>
                    `}
                </div>
            </section>
        `;
    }).join("");
}

function renderTasks() {
    if (activeView === "tasks") {
        renderMyTasks();
        return;
    }

    renderProjectTaskBoard();
}

function renderProjectTaskBoard() {
    const tasks = state.tasksPage.content;
    const projectName = labelForProject(state.filters.projectId || state.selectedProjectId);
    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Задач: ${tasks.length}</span>
        <span class="mini-chip">Найдено: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Проект: ${escapeHtml(projectName)}</span>
        <span class="mini-chip">Можно перетаскивать карточки</span>
    `;

    const columns = [
        { status: "TODO", title: "К выполнению", tone: "todo", hint: "Новые и запланированные задачи" },
        { status: "IN_PROGRESS", title: "В работе", tone: "progress", hint: "То, что делается сейчас" },
        { status: "DONE", title: "Готово", tone: "done", hint: "Завершённые задачи" }
    ];

    elements.taskBoard.innerHTML = columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);

        return `
            <section class="board-column board-column-${column.tone}" data-status="${column.status}">
                <header class="board-column-header">
                    <div>
                        <h3>${column.title}</h3>
                        <span>${columnTasks.length} задач · ${column.hint}</span>
                    </div>
                    <button type="button" class="column-add-button" data-action="focus-new-task" data-status="${column.status}">+</button>
                </header>
                <div class="board-column-stack">
                    ${columnTasks.length > 0 ? columnTasks.map((task) => renderBoardTaskCard(task)).join("") : `
                        <div class="board-empty">Здесь пока нет задач</div>
                    `}
                </div>
            </section>
        `;
    }).join("");
}

function renderBoardTaskCard(task) {
    return `
        <article class="task-card clean-task-card ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" draggable="true" title="Нажмите, чтобы открыть. Перетащите, чтобы сменить статус.">
            <div class="clean-card-head">
                <span class="task-id">#${task.id}</span>
                <span class="task-menu-dots" aria-hidden="true">⋯</span>
            </div>
            <h3 class="card-title">${escapeHtml(task.title)}</h3>
            <div class="clean-card-meta">
                <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                <span class="priority-label priority-${task.priority}">${priorityLabel(task.priority)}</span>
            </div>
            <div class="task-card-actions">
                <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                <button type="button" class="ghost-button" data-action="edit-task" data-id="${task.id}">Изм.</button>
                <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
            </div>
        </article>
    `;
}

function renderMyTasks() {
    const tasks = state.tasksPage.content;
    const today = agendaIsoDate();
    const tomorrow = agendaIsoDate(1);
    const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "DONE");
    const todayTasks = tasks.filter((task) => task.dueDate === today);
    const tomorrowTasks = tasks.filter((task) => task.dueDate === tomorrow);
    const noDateTasks = tasks.filter((task) => !task.dueDate);
    const otherTasks = tasks.filter((task) =>
        task.dueDate
        && task.dueDate !== today
        && task.dueDate !== tomorrow
        && !(task.dueDate < today && task.status !== "DONE")
    );
    const completedCount = tasks.filter((task) => task.status === "DONE").length;
    const selectedRemindersCount = state.selectedTaskId ? state.reminders.length : 0;

    elements.taskMeta.innerHTML = `
        <span class="mini-chip">Всего: ${state.tasksPage.totalElements || tasks.length}</span>
        <span class="mini-chip">Сегодня: ${todayTasks.length}</span>
        <span class="mini-chip">Завтра: ${tomorrowTasks.length}</span>
        <span class="mini-chip">Просрочено: ${overdueTasks.length}</span>
        <span class="mini-chip">Выполнено: ${completedCount}</span>
        <span class="mini-chip">Напоминаний у выбранной: ${selectedRemindersCount}</span>
    `;

    const groups = [
        { title: "Просрочено", date: today, tasks: overdueTasks, tone: "danger" },
        { title: "Сегодня", date: today, tasks: todayTasks, tone: "today" },
        { title: "Завтра", date: tomorrow, tasks: tomorrowTasks, tone: "tomorrow" },
        { title: "Без срока", date: "", tasks: noDateTasks, tone: "muted" },
        { title: "Другие задачи", date: "", tasks: otherTasks, tone: "default" }
    ];

    elements.taskBoard.innerHTML = `
        <section class="my-tasks-view">
            <div class="my-tasks-header">
                <div>
                    <p class="section-tag">Мои задачи</p>
                    <h2>План по дням</h2>
                    <p>Личный список задач: просроченные, на сегодня, на завтра, без срока и остальные.</p>
                </div>
                <div class="my-tasks-tabs" aria-label="Фильтры задач">
                    <button type="button" class="active">Назначенные мне</button>
                    <button type="button">Все задачи</button>
                    <button type="button">Напоминания</button>
                </div>
            </div>
            <div class="agenda-table">
                <div class="agenda-head">
                    <span>Наименование</span>
                    <span>Номер</span>
                    <span>Исполнитель</span>
                    <span>Проект</span>
                    <span>Срок</span>
                    <span>Приоритет</span>
                    <span>Теги</span>
                </div>
                ${groups.map((group) => renderAgendaGroup(group)).join("")}
            </div>
        </section>
    `;
}

function renderAgendaGroup(group) {
    return `
        <section class="agenda-day agenda-day-${group.tone}">
            <button type="button" class="agenda-day-title" data-action="focus-new-task" data-due="${group.date}">
                <span>${group.title}</span>
                <small>${group.tasks.length} задач</small>
            </button>
            <button type="button" class="agenda-new-row" data-action="focus-new-task" data-due="${group.date}">+ Новая задача</button>
            ${group.tasks.length > 0
                ? group.tasks.map((task) => renderAgendaTaskRow(task)).join("")
                : `<div class="agenda-empty-line">В этой группе пока нет задач</div>`}
        </section>
    `;
}

function renderAgendaTaskRow(task) {
    const done = task.status === "DONE";
    return `
        <article class="agenda-row task-card ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}">
            <div class="agenda-name">
                <button type="button" class="task-done-toggle" data-action="toggle-task" data-id="${task.id}" title="${done ? "Вернуть в работу" : "Отметить выполненной"}">
                    ${done ? "✓" : ""}
                </button>
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                    <p>${escapeHtml(task.description || "Описание отсутствует")}</p>
                </div>
            </div>
            <span class="task-id">#${task.id}</span>
            <span>${escapeHtml(task.assigneeEmail || "Не назначен")}</span>
            <span>${escapeHtml(agendaProjectName(task))}</span>
            <span class="agenda-date ${agendaDateClass(task.dueDate)}">${escapeHtml(agendaDateLabel(task.dueDate))}</span>
            <span class="mini-chip">${priorityLabel(task.priority)}</span>
            <span class="agenda-tags">${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("") || "—"}</span>
        </article>
    `;
}

function agendaDateLabel(value) {
    if (!value) {
        return "Без срока";
    }
    if (value === agendaIsoDate()) {
        return "Сегодня";
    }
    if (value === agendaIsoDate(1)) {
        return "Завтра";
    }
    return value;
}
