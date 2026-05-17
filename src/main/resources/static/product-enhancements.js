(function () {
    const FAVORITES_KEY = "todo-lab-favorite-tasks";

    state.quickSearch = "";
    state.activeTagId = "";
    state.showFavoritesOnly = false;
    state.inlineTitleTaskId = null;
    state.favoriteTaskIds = loadFavoriteTaskIds();

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(enhanceProductInteractions, 0);
    });

    function enhanceProductInteractions() {
        ensureQuickSearch();
        elements.taskTitle?.addEventListener("keydown", handleQuickTaskTitleKeydown);
        elements.taskBoard?.addEventListener("change", handleTaskBoardChange);
        elements.taskBoard?.addEventListener("keydown", handleTaskBoardKeydown);
        elements.taskBoard?.addEventListener("focusout", handleTaskBoardFocusOut);
    }

    function ensureQuickSearch() {
        if (document.getElementById("quickTaskSearch") || !elements.taskMeta) {
            return;
        }

        const search = document.createElement("input");
        search.id = "quickTaskSearch";
        search.className = "quick-task-search";
        search.type = "search";
        search.placeholder = "Поиск по задачам";
        search.autocomplete = "off";
        search.addEventListener("input", () => {
            state.quickSearch = search.value.trim().toLowerCase();
            renderTasks();
        });

        elements.taskMeta.parentElement.insertBefore(search, elements.taskMeta);
    }

    async function handleQuickTaskTitleKeydown(event) {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        const openAfterCreate = event.ctrlKey || event.metaKey;
        const created = await createTaskFromQuickInput();
        if (created && openAfterCreate) {
            openTaskEditModal(created);
        }
    }

    async function createTaskFromQuickInput() {
        if (!elements.taskTitle.value.trim()) {
            return null;
        }

        const taskListId = await ensureTaskListForCurrentProject();
        if (!taskListId) {
            showNotice("Сначала выберите или создайте проект.", "error");
            return null;
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
            state.selectedTaskId = created.id;
            resetTaskForm();
            await refreshAllData();
            elements.taskTitle.focus();
            showNotice("Задача создана. Enter создаёт следующую, Ctrl+Enter открывает карточку.", "success");
            return created;
        } catch (error) {
            showNotice(error.message, "error");
            return null;
        }
    }

    function getVisibleBoardTasks() {
        return state.tasksPage.content.filter((task) => {
            const matchesSearch = !state.quickSearch
                || task.title.toLowerCase().includes(state.quickSearch)
                || (task.description || "").toLowerCase().includes(state.quickSearch);
            const matchesTag = !state.activeTagId || (task.tags || []).some((tag) => String(tag.id) === String(state.activeTagId));
            const matchesFavorite = !state.showFavoritesOnly || state.favoriteTaskIds.has(String(task.id));
            return matchesSearch && matchesTag && matchesFavorite;
        });
    }

    renderProjectTaskBoard = function () {
        const tasks = getVisibleBoardTasks();
        const allTasks = state.tasksPage.content;
        const doneCount = allTasks.filter((task) => task.status === "DONE").length;
        const progress = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
        const overdueCount = allTasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE").length;

        elements.taskMeta.innerHTML = `
            <span class="mini-chip">Задач: ${tasks.length}</span>
            <span class="mini-chip">В работе: ${allTasks.filter((task) => task.status === "IN_PROGRESS").length}</span>
            <span class="mini-chip">Просрочено: ${overdueCount}</span>
            <span class="mini-chip">Прогресс: ${progress}%</span>
            ${state.activeTagId ? `<button type="button" class="mini-chip meta-action" data-action="clear-tag-filter">Сбросить тег</button>` : ""}
            <button type="button" class="mini-chip meta-action ${state.showFavoritesOnly ? "active" : ""}" data-action="toggle-favorites-filter">⭐ Важные</button>
        `;

        const columns = [
            { status: "TODO", title: "К выполнению", tone: "todo" },
            { status: "IN_PROGRESS", title: "В работе", tone: "progress" },
            { status: "DONE", title: "Готово", tone: "done" }
        ];

        elements.taskBoard.innerHTML = columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return `
                <section class="board-column board-column-${column.tone}" data-status="${column.status}">
                    <header class="board-column-header">
                        <div>
                            <h3>${column.title}</h3>
                            <span>${columnTasks.length} задач</span>
                        </div>
                        <button type="button" class="column-add-button" data-action="focus-new-task" data-status="${column.status}">+</button>
                    </header>
                    <div class="board-column-stack">
                        ${columnTasks.length > 0 ? columnTasks.map((task) => renderBoardTaskCard(task)).join("") : `
                            <div class="board-empty">Перетащите задачу сюда</div>
                        `}
                    </div>
                </section>
            `;
        }).join("");
    };

    renderBoardTaskCard = function (task) {
        const tags = (task.tags || []).slice(0, 3);
        const isFavorite = state.favoriteTaskIds.has(String(task.id));
        const isInlineEditing = state.inlineTitleTaskId === task.id;

        return `
            <article class="task-card clean-task-card ${task.id === state.selectedTaskId ? "active" : ""} ${task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE" ? "is-overdue" : ""}" data-id="${task.id}" draggable="true">
                <div class="clean-card-head">
                    <button type="button" class="favorite-button ${isFavorite ? "active" : ""}" data-action="toggle-favorite" data-id="${task.id}" title="Важная задача">★</button>
                    <span class="task-id">#${task.id}</span>
                </div>
                ${isInlineEditing ? `
                    <input class="inline-title-input" value="${escapeHtml(task.title)}" data-id="${task.id}" maxlength="160">
                ` : `
                    <button type="button" class="inline-title-button" data-action="quick-edit-title" data-id="${task.id}">${escapeHtml(task.title)}</button>
                `}
                <div class="clean-card-meta">
                    <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                    <select class="inline-priority-select priority-${task.priority}" data-id="${task.id}" title="Быстро сменить приоритет">
                        <option value="LOW" ${task.priority === "LOW" ? "selected" : ""}>Низкий</option>
                        <option value="MEDIUM" ${task.priority === "MEDIUM" ? "selected" : ""}>Средний</option>
                        <option value="HIGH" ${task.priority === "HIGH" ? "selected" : ""}>Высокий</option>
                    </select>
                </div>
                <div class="clean-card-extra">
                    <input class="inline-due-input ${task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE" ? "is-danger" : ""}" type="date" value="${escapeHtml(task.dueDate || "")}" data-id="${task.id}" title="Быстро сменить срок">
                    <div class="inline-tags">
                        ${tags.map((tag) => `<button type="button" class="inline-tag" data-action="filter-tag" data-tag-id="${tag.id}" style="--tag-color:${escapeHtml(normalizeColor(tag.color) || "#98a2b3")}">${escapeHtml(tag.name)}</button>`).join("")}
                    </div>
                </div>
                <div class="task-card-actions">
                    <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                    <button type="button" class="ghost-button" data-action="edit-task" data-id="${task.id}">Изм.</button>
                    <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                </div>
            </article>
        `;
    };

    renderTaskProjectPanel = function () {
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
                        <label><span>Название проекта</span><input name="name" type="text" maxlength="150" value="${escapeHtml(selectedProject.name)}" required></label>
                        <label><span>Описание</span><textarea name="description" rows="2" maxlength="1000">${escapeHtml(selectedProject.description || "")}</textarea></label>
                    </div>
                    <div class="button-row">
                        <button type="submit" class="primary-button">Сохранить</button>
                        <button type="button" class="ghost-button" data-action="cancel-project-edit">Вернуться</button>
                    </div>
                </form>
            `;
            return;
        }

        const projectTasks = state.tasksPage.content;
        const doneCount = projectTasks.filter((task) => task.status === "DONE").length;
        const progress = projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0;
        const overdueCount = projectTasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE").length;

        elements.taskProjectPanel.innerHTML = `
            <div class="project-hero-card compact-project-panel">
                <div>
                    <p class="section-tag">Текущий проект</p>
                    <h2>${escapeHtml(selectedProject.name)}</h2>
                    <p>${escapeHtml(selectedProject.description || "Описание не указано.")}</p>
                </div>
                <div class="project-analytics">
                    <span>${projectTasks.length} задач</span>
                    <span>${progress}% готово</span>
                    <span>${overdueCount} просрочено</span>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-project-here">Редактировать</button>
                    <button type="button" class="danger-button" data-action="delete-project-here">Удалить</button>
                    <button type="button" class="primary-button" data-action="focus-new-task">+ Задача</button>
                </div>
            </div>
        `;
    };

    async function updateTaskInline(task, patch) {
        if (!task) return;
        const payload = {
            title: patch.title ?? task.title,
            description: patch.description ?? task.description ?? null,
            status: patch.status ?? task.status,
            priority: patch.priority ?? task.priority,
            dueDate: Object.prototype.hasOwnProperty.call(patch, "dueDate") ? patch.dueDate : (task.dueDate || null),
            assigneeId: Object.prototype.hasOwnProperty.call(patch, "assigneeId") ? patch.assigneeId : (task.assigneeId || null),
            taskListId: patch.taskListId ?? task.taskListId,
            tagIds: patch.tagIds ?? (task.tags || []).map((tag) => tag.id)
        };
        const updated = await api(`/tasks/${task.id}`, { method: "PUT", body: payload });
        state.selectedTaskId = updated.id;
        await refreshAllData();
    }

    async function commitInlineTitle(input) {
        const id = Number(input.dataset.id);
        const task = state.tasksPage.content.find((item) => item.id === id);
        const nextTitle = input.value.trim();
        state.inlineTitleTaskId = null;
        if (!task || !nextTitle || nextTitle === task.title) {
            renderTasks();
            return;
        }
        try {
            await updateTaskInline(task, { title: nextTitle });
            showNotice("Название задачи обновлено.", "success");
        } catch (error) {
            showNotice(error.message, "error");
            renderTasks();
        }
    }

    async function handleTaskBoardChange(event) {
        const prioritySelect = event.target.closest(".inline-priority-select");
        const dueInput = event.target.closest(".inline-due-input");
        const id = Number(prioritySelect?.dataset.id || dueInput?.dataset.id);
        const task = state.tasksPage.content.find((item) => item.id === id);
        if (!task) return;
        try {
            if (prioritySelect) {
                await updateTaskInline(task, { priority: prioritySelect.value });
                showNotice("Приоритет обновлён.", "success");
            }
            if (dueInput) {
                await updateTaskInline(task, { dueDate: dueInput.value || null });
                showNotice("Срок обновлён.", "success");
            }
        } catch (error) {
            showNotice(error.message, "error");
            renderTasks();
        }
    }

    function handleTaskBoardKeydown(event) {
        const input = event.target.closest(".inline-title-input");
        if (!input) return;
        if (event.key === "Enter") {
            event.preventDefault();
            commitInlineTitle(input);
        }
        if (event.key === "Escape") {
            state.inlineTitleTaskId = null;
            renderTasks();
        }
    }

    function handleTaskBoardFocusOut(event) {
        const input = event.target.closest(".inline-title-input");
        if (input) {
            commitInlineTitle(input);
        }
    }

    handleTaskBoardClick = async function (event) {
        const button = event.target.closest("button");
        const card = event.target.closest(".task-card");
        const action = button?.dataset.action || (card ? "edit-task" : "");
        const id = Number(button?.dataset.id || card?.dataset.id);

        if (action === "clear-tag-filter") {
            state.activeTagId = "";
            renderTasks();
            return;
        }
        if (action === "toggle-favorites-filter") {
            state.showFavoritesOnly = !state.showFavoritesOnly;
            renderTasks();
            return;
        }
        if (action === "filter-tag") {
            state.activeTagId = button.dataset.tagId;
            renderTasks();
            return;
        }
        if (action === "focus-new-task") {
            setActiveMode("task");
            resetTaskForm();
            if (button?.dataset.due) elements.taskDueDate.value = button.dataset.due;
            if (button?.dataset.status) elements.taskStatus.value = button.dataset.status;
            state.taskEditorExpanded = true;
            syncTaskEditorState();
            elements.taskTitle.focus();
            return;
        }
        if (!action || !id) return;
        if (action === "toggle-favorite") {
            toggleFavoriteTask(id);
            renderTasks();
            return;
        }
        if (action === "quick-edit-title") {
            state.inlineTitleTaskId = id;
            renderTasks();
            requestAnimationFrame(() => document.querySelector(`.inline-title-input[data-id="${id}"]`)?.focus());
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
            return;
        }
        if (action === "delete-task" && window.confirm("Удалить эту задачу?")) {
            try {
                await api(`/tasks/${id}`, { method: "DELETE" });
                if (state.selectedTaskId === id) state.selectedTaskId = null;
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
    };

    function toggleFavoriteTask(id) {
        const key = String(id);
        if (state.favoriteTaskIds.has(key)) {
            state.favoriteTaskIds.delete(key);
        } else {
            state.favoriteTaskIds.add(key);
        }
        saveFavoriteTaskIds();
    }

    function loadFavoriteTaskIds() {
        try {
            return new Set(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]").map(String));
        } catch (error) {
            return new Set();
        }
    }

    function saveFavoriteTaskIds() {
        try {
            window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favoriteTaskIds]));
        } catch (error) {
            // Local favorites are optional; ignore storage failures.
        }
    }

    // Final UX polish: clearer empty states, settings, visible project creation.
    state.interfaceDensity = window.localStorage.getItem("todo-lab-density") || "normal";
    state.dragAndDropEnabled = window.localStorage.getItem("todo-lab-dnd") !== "false";
    state.showCompletedTasks = window.localStorage.getItem("todo-lab-show-completed") !== "false";
    state.defaultTaskPriority = window.localStorage.getItem("todo-lab-default-priority") || "MEDIUM";
    state.defaultTaskStatus = window.localStorage.getItem("todo-lab-default-status") || "TODO";
    state.notificationsEnabled = window.localStorage.getItem("todo-lab-notifications") !== "false";

    const originalEnhanceProductInteractions = enhanceProductInteractions;
    enhanceProductInteractions = function () {
        originalEnhanceProductInteractions();
        document.body.dataset.density = state.interfaceDensity;
        ensureSettingsSection();
        elements.taskProjectPanel?.addEventListener("submit", handleQuickProjectSubmit);
        elements.projectActionPanel?.addEventListener("submit", handleQuickProjectSubmit);
        document.addEventListener("keydown", handleCommandShortcut);
    };

    const originalSetActiveView = setActiveView;
    setActiveView = function (view) {
        originalSetActiveView(view);
        syncSettingsVisibility();
    };

    const originalRenderApp = renderApp;
    renderApp = function () {
        originalRenderApp();
        ensureSettingsSection();
        renderSettings();
        syncSettingsVisibility();
    };

    const originalRefreshAllData = refreshAllData;
    refreshAllData = async function () {
        await originalRefreshAllData();
        ensureSettingsSection();
        renderSettings();
        syncSettingsVisibility();
    };

    renderStats = function () {
        const tasks = state.tasksPage.content || [];
        const today = agendaIsoDate();
        const tomorrow = agendaIsoDate(1);
        const overdue = tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "DONE").length;
        const todayCount = tasks.filter((task) => task.dueDate === today).length;
        const tomorrowCount = tasks.filter((task) => task.dueDate === tomorrow).length;
        const done = tasks.filter((task) => task.status === "DONE").length;

        const counters = [
            { label: "Всего задач", value: state.tasksPage.totalElements || tasks.length, tone: "neutral", icon: "📋" },
            { label: "Сегодня", value: todayCount, tone: "today", icon: "☀" },
            { label: "Завтра", value: tomorrowCount, tone: "tomorrow", icon: "→" },
            { label: "Просрочено", value: overdue, tone: "danger", icon: "!" },
            { label: "Выполнено", value: done, tone: "done", icon: "✓" }
        ];

        elements.statsRow.innerHTML = counters.map((item) => `
            <article class="stats-card stat-card stat-card-${item.tone}">
                <span class="stat-icon">${item.icon}</span>
                <div>
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                </div>
            </article>
        `).join("");
    };

    renderProjectActionPanel = function () {
        const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
        elements.projectActionPanel.classList.remove("hidden");

        elements.projectActionPanel.innerHTML = `
            <div class="project-action-content">
                <div>
                    <span class="mini-chip">Проекты</span>
                    <h3>${selectedProject ? escapeHtml(selectedProject.name) : "Создайте проект"}</h3>
                    <p>${selectedProject
                        ? escapeHtml(selectedProject.description || "Описание не указано.")
                        : "Проект нужен, чтобы группировать списки, задачи, сроки и теги."}</p>
                </div>
                ${selectedProject ? `
                    <div class="button-row">
                        <button type="button" class="ghost-button" data-action="edit-selected-project">Редактировать</button>
                        <button type="button" class="danger-button" data-action="delete-selected-project">Удалить</button>
                        <button type="button" class="primary-button" data-action="open-selected-project">К задачам проекта</button>
                    </div>
                ` : ""}
            </div>
            <form class="quick-project-create quick-project-create-inline" data-quick-project-form>
                <input name="name" type="text" maxlength="150" placeholder="Название нового проекта" required>
                <input name="description" type="text" maxlength="300" placeholder="Краткое описание">
                <button type="submit" class="primary-button">Создать проект</button>
            </form>
        `;
        elements.returnToProjectButton?.classList.toggle("hidden", !elements.projectId?.value);
    };

    renderProjectTaskBoard = function () {
        const tasks = getVisibleBoardTasks();
        const allTasks = state.tasksPage.content || [];
        const projectName = labelForProject(state.filters.projectId || state.selectedProjectId);
        const doneCount = allTasks.filter((task) => task.status === "DONE").length;
        const progress = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
        const overdueCount = allTasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE").length;

        elements.taskMeta.innerHTML = `
            <span class="mini-chip">Задач: ${tasks.length}</span>
            <span class="mini-chip">Проект: ${escapeHtml(projectName)}</span>
            <span class="mini-chip">Прогресс: ${progress}%</span>
            <span class="mini-chip ${overdueCount ? "chip-danger" : ""}">Просрочено: ${overdueCount}</span>
            ${state.activeTagId ? `<button type="button" class="mini-chip meta-action" data-action="clear-tag-filter">Сбросить тег</button>` : ""}
            <button type="button" class="mini-chip meta-action ${state.showFavoritesOnly ? "active" : ""}" data-action="toggle-favorites-filter">⭐ Важные</button>
        `;

        const columns = [
            { status: "TODO", title: "К выполнению", tone: "todo", hint: "Новые задачи", icon: "📋" },
            { status: "IN_PROGRESS", title: "В работе", tone: "progress", hint: "Сейчас делаем", icon: "🧩" },
            { status: "DONE", title: "Готово", tone: "done", hint: "Завершено", icon: "✓" }
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
                        <button type="button" class="column-add-button" data-action="focus-new-task" data-status="${column.status}" title="Добавить задачу">
                            <span aria-hidden="true">+</span>
                            <strong>Добавить задачу</strong>
                        </button>
                    </header>
                    <div class="board-column-stack">
                        ${columnTasks.length > 0 ? columnTasks.map((task) => renderBoardTaskCard(task)).join("") : renderBoardEmpty(column)}
                    </div>
                </section>
            `;
        }).join("");
    };

    function renderBoardEmpty(column) {
        const primaryText = column.status === "TODO" ? "Создать первую задачу" : "Перетащи сюда";
        const secondaryText = column.status === "TODO"
            ? "Добавь карточку или перенеси задачу в эту колонку."
            : "Смени статус задачи простым перетаскиванием.";
        return `
            <button type="button" class="board-empty board-empty-cta" data-action="focus-new-task" data-status="${column.status}">
                <span class="empty-icon">${column.icon}</span>
                <strong>${primaryText}</strong>
                <small>${secondaryText}</small>
            </button>
        `;
    }

    renderMyTasks = function () {
        const allTasks = state.tasksPage.content || [];
        const tasks = state.showCompletedTasks ? allTasks : allTasks.filter((task) => task.status !== "DONE");
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
        const completedCount = allTasks.filter((task) => task.status === "DONE").length;
        const selectedRemindersCount = state.selectedTaskId ? state.reminders.length : 0;

        elements.taskMeta.innerHTML = `
            <div class="my-stats-grid">
                <article class="stat-card stat-card-neutral"><span class="stat-icon">📋</span><div><span>Всего</span><strong>${allTasks.length}</strong></div></article>
                <article class="stat-card stat-card-today"><span class="stat-icon">☀</span><div><span>Сегодня</span><strong>${todayTasks.length}</strong></div></article>
                <article class="stat-card stat-card-tomorrow"><span class="stat-icon">→</span><div><span>Завтра</span><strong>${tomorrowTasks.length}</strong></div></article>
                <article class="stat-card stat-card-danger"><span class="stat-icon">!</span><div><span>Просрочено</span><strong>${overdueTasks.length}</strong></div></article>
                <article class="stat-card stat-card-done"><span class="stat-icon">✓</span><div><span>Выполнено</span><strong>${completedCount}</strong></div></article>
                <article class="stat-card stat-card-neutral"><span class="stat-icon">🔔</span><div><span>Напоминания</span><strong>${selectedRemindersCount}</strong></div></article>
            </div>
        `;

        const groups = [
            { title: "Просрочено", date: today, tasks: overdueTasks, tone: "danger", icon: "!" },
            { title: "Сегодня", date: today, tasks: todayTasks, tone: "today", icon: "☀" },
            { title: "Завтра", date: tomorrow, tasks: tomorrowTasks, tone: "tomorrow", icon: "→" },
            { title: "Без срока", date: "", tasks: noDateTasks, tone: "muted", icon: "○" },
            { title: "Другие задачи", date: "", tasks: otherTasks, tone: "default", icon: "•" }
        ];

        elements.taskBoard.innerHTML = `
            <section class="my-tasks-view">
                <div class="my-tasks-header">
                    <div>
                        <p class="section-tag">Мои задачи</p>
                        <h2>План по дням</h2>
                        <p>Личный список: задачи на сегодня, завтра, просроченные и без срока. Проекты остаются отдельной рабочей доской.</p>
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
    };

    renderAgendaGroup = function (group) {
        return `
            <section class="agenda-day agenda-day-${group.tone}">
                <button type="button" class="agenda-day-title agenda-day-title-${group.tone}" data-action="focus-new-task" data-due="${group.date}">
                    <span><b>${group.icon}</b> ${group.title}</span>
                    <small>${group.tasks.length} задач</small>
                </button>
                <button type="button" class="agenda-new-row" data-action="focus-new-task" data-due="${group.date}">+ Новая задача</button>
                ${group.tasks.length > 0
                    ? group.tasks.map((task) => renderAgendaTaskRow(task)).join("")
                    : `<button type="button" class="agenda-empty-line agenda-empty-cta" data-action="focus-new-task" data-due="${group.date}">
                        <span class="empty-icon">📋</span>
                        <strong>Создать первую задачу</strong>
                        <small>Нажми сюда или используй поле быстрого создания сверху.</small>
                    </button>`}
            </section>
        `;
    };

    renderAgendaTaskRow = function (task) {
        const done = task.status === "DONE";
        return `
            <article class="agenda-row task-card ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" tabindex="0" role="button" title="Открыть задачу">
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
                <span class="agenda-tags">${(task.tags || []).map((tag) => `<button type="button" class="tag-pill clickable-tag" data-action="filter-tag" data-tag-id="${tag.id}">${escapeHtml(tag.name)}</button>`).join("") || "—"}</span>
            </article>
        `;
    };

    renderTaskProjectPanel = function () {
        const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
        elements.taskProjectPanel.classList.remove("hidden");

        if (!selectedProject) {
            elements.taskProjectPanel.innerHTML = `
                <div class="project-hero-card empty-project-card">
                    <div class="empty-project-copy">
                        <span class="empty-project-icon">🧩</span>
                        <div>
                            <p class="section-tag">Проекты</p>
                            <h2>Создайте первый проект</h2>
                            <p>Проект объединяет списки, задачи, теги и сроки. Это основная рабочая область для защиты лабораторной.</p>
                        </div>
                    </div>
                    <form class="quick-project-create" data-quick-project-form>
                        <input name="name" type="text" maxlength="150" placeholder="Название проекта" required>
                        <input name="description" type="text" maxlength="300" placeholder="Краткое описание">
                        <button type="submit" class="primary-button">Создать проект</button>
                    </form>
                </div>
            `;
            return;
        }

        if (state.projectInlineEditing) {
            elements.taskProjectPanel.innerHTML = `
                <form class="project-hero-card is-editing compact-project-panel" data-project-edit-form>
                    <div>
                        <p class="section-tag">Редактирование проекта</p>
                        <label><span>Название проекта</span><input name="name" type="text" maxlength="150" value="${escapeHtml(selectedProject.name)}" required></label>
                        <label><span>Описание</span><textarea name="description" rows="2" maxlength="1000">${escapeHtml(selectedProject.description || "")}</textarea></label>
                    </div>
                    <div class="button-row">
                        <button type="submit" class="primary-button">Сохранить</button>
                        <button type="button" class="ghost-button" data-action="cancel-project-edit">Вернуться в проект</button>
                    </div>
                </form>
            `;
            return;
        }

        const projectTasks = state.tasksPage.content || [];
        const doneCount = projectTasks.filter((task) => task.status === "DONE").length;
        const progress = projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0;
        const overdueCount = projectTasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE").length;
        const projectLists = state.taskLists.filter((item) => item.projectId === selectedProject.id);

        elements.taskProjectPanel.innerHTML = `
            <div class="project-hero-card compact-project-panel">
                <div>
                    <p class="section-tag">Текущий проект</p>
                    <h2>${escapeHtml(selectedProject.name)}</h2>
                    <p>${escapeHtml(selectedProject.description || "Описание не указано.")}</p>
                </div>
                <div class="project-analytics">
                    <span>${projectTasks.length} задач</span>
                    <span>${projectLists.length} списков</span>
                    <span>${progress}% готово</span>
                    <span class="${overdueCount ? "danger-text" : ""}">${overdueCount} просрочено</span>
                </div>
                <div class="button-row">
                    <button type="button" class="ghost-button" data-action="edit-project-here">Редактировать</button>
                    <button type="button" class="danger-button" data-action="delete-project-here">Удалить</button>
                    <button type="button" class="primary-button" data-action="focus-new-task">+ Задача</button>
                </div>
            </div>
        `;
    };

    async function handleQuickProjectSubmit(event) {
        const form = event.target.closest("[data-quick-project-form]");
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const description = String(formData.get("description") || "").trim();
        if (!name) {
            showNotice("Введите название проекта.", "error");
            return;
        }
        try {
            const project = await api("/projects", { method: "POST", body: { name, description: description || null } });
            state.selectedProjectId = project.id;
            state.filters.projectId = String(project.id);
            state.projectInlineCreating = false;
            state.projectInlineEditing = false;
            await refreshAllData();
            showNotice("Проект создан. Теперь можно добавлять задачи.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    function ensureSettingsSection() {
        if (document.getElementById("settingsSection")) return;
        const section = document.createElement("section");
        section.id = "settingsSection";
        section.className = "settings-section hidden";
        section.setAttribute("aria-label", "Настройки");
        document.getElementById("tasksSection")?.insertAdjacentElement("afterend", section);
        section.addEventListener("submit", handleSettingsSubmit);
        section.addEventListener("click", handleSettingsClick);
        section.addEventListener("change", handleSettingsChange);
        if (state.me) {
            renderSettings();
        }
    }

    function syncSettingsVisibility() {
        const section = document.getElementById("settingsSection");
        if (!section) return;
        const isSettings = document.body.dataset.view === "settings";
        const tasksSection = document.getElementById("tasksSection");
        const projectsSection = document.getElementById("projectsSection");
        const usersSection = document.getElementById("usersSection");
        section.classList.toggle("hidden", !isSettings);
        tasksSection?.classList.toggle("hidden", isSettings);
        projectsSection?.classList.toggle("hidden", isSettings);
        usersSection?.classList.add("hidden");
        if (isSettings) {
            renderSettings();
        }
    }

    function renderSettings() {
        const section = document.getElementById("settingsSection");
        if (!section || !state.me) return;
        const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
        section.innerHTML = `
            <div class="settings-header">
                <div>
                    <p class="section-tag">Настройки</p>
                    <h2>Рабочее пространство Todo Lab</h2>
                    <p>Профиль, внешний вид, правила задач, уведомления, проекты, теги и экспорт данных.</p>
                </div>
                <button type="button" class="primary-button" data-action="export-json">Экспорт JSON</button>
            </div>
            <div class="settings-grid">
                <article class="settings-card">
                    <h3>Профиль</h3>
                    <form data-settings-form="profile" class="settings-stack">
                        <label><span>Имя</span><input name="displayName" value="${escapeHtml(state.me.displayName || "")}"></label>
                        <label><span>Email</span><input value="${escapeHtml(state.me.email || "")}" disabled></label>
                        <label><span>Новый пароль</span><input name="password" type="password" placeholder="Опционально"></label>
                        <button class="ghost-button" type="submit">Сохранить профиль</button>
                    </form>
                </article>
                <article class="settings-card">
                    <h3>Интерфейс</h3>
                    <div class="settings-stack">
                        <div class="settings-option-row"><span>Тема</span><div class="segmented-control"><button type="button" data-action="theme-light">Светлая</button><button type="button" data-action="theme-dark">Темная</button></div></div>
                        <label><span>Плотность</span><select data-setting="density"><option value="normal" ${state.interfaceDensity === "normal" ? "selected" : ""}>Обычная</option><option value="compact" ${state.interfaceDensity === "compact" ? "selected" : ""}>Компактная</option></select></label>
                        <label><span>Язык</span><select><option>Русский</option><option disabled>English позже</option></select></label>
                    </div>
                </article>
                <article class="settings-card">
                    <h3>Задачи</h3>
                    <div class="settings-stack">
                        <label><span>Приоритет по умолчанию</span><select data-setting="defaultPriority"><option value="LOW" ${state.defaultTaskPriority === "LOW" ? "selected" : ""}>Низкий</option><option value="MEDIUM" ${state.defaultTaskPriority === "MEDIUM" ? "selected" : ""}>Средний</option><option value="HIGH" ${state.defaultTaskPriority === "HIGH" ? "selected" : ""}>Высокий</option></select></label>
                        <label><span>Статус по умолчанию</span><select data-setting="defaultStatus"><option value="TODO" ${state.defaultTaskStatus === "TODO" ? "selected" : ""}>К выполнению</option><option value="IN_PROGRESS" ${state.defaultTaskStatus === "IN_PROGRESS" ? "selected" : ""}>В работе</option></select></label>
                        <label class="checkbox-item"><input type="checkbox" data-setting="dragAndDrop" ${state.dragAndDropEnabled ? "checked" : ""}> <span>Включить drag & drop</span></label>
                        <label class="checkbox-item"><input type="checkbox" data-setting="showCompleted" ${state.showCompletedTasks ? "checked" : ""}> <span>Показывать выполненные</span></label>
                    </div>
                </article>
                <article class="settings-card">
                    <h3>Уведомления</h3>
                    <div class="settings-stack">
                        <label class="checkbox-item"><input type="checkbox" data-setting="notifications" ${state.notificationsEnabled ? "checked" : ""}> <span>Включить напоминания</span></label>
                        <label class="checkbox-item"><input type="checkbox" checked> <span>За день до срока</span></label>
                        <label class="checkbox-item"><input type="checkbox" checked> <span>За час до срока</span></label>
                    </div>
                </article>
                <article class="settings-card settings-card-wide">
                    <h3>Управление проектами</h3>
                    <form data-quick-project-form class="settings-project-form">
                        <input name="name" placeholder="Новый проект" required>
                        <input name="description" placeholder="Описание проекта">
                        <input name="color" type="color" value="#ffd43b" title="Цвет проекта">
                        <button class="primary-button" type="submit">Создать проект</button>
                    </form>
                    <div class="settings-list">
                        ${state.projects.map((project) => `
                            <button type="button" class="settings-list-item ${project.id === state.selectedProjectId ? "active" : ""}" data-action="select-project-settings" data-id="${project.id}">
                                <span>${escapeHtml(project.name)}</span>
                                <small>${project.id === selectedProject?.id ? "выбран" : "открыть"}</small>
                            </button>
                        `).join("") || `<div class="settings-empty">Проектов пока нет.</div>`}
                    </div>
                </article>
                <article class="settings-card">
                    <h3>Теги</h3>
                    <form data-settings-form="tag" class="settings-tag-form">
                        <input name="name" placeholder="Название тега" required>
                        <input name="color" type="color" value="#ffd43b">
                        <button class="ghost-button" type="submit">Создать тег</button>
                    </form>
                    <div class="settings-tags">
                        ${state.tags.map((tag) => `<span class="tag-pill" style="--tag-color:${escapeHtml(normalizeColor(tag.color) || "#ffd43b")}">${escapeHtml(tag.name)}</span>`).join("") || "Тегов пока нет."}
                    </div>
                </article>
                <article class="settings-card">
                    <h3>Данные</h3>
                    <div class="settings-stack">
                        <button type="button" class="ghost-button" data-action="export-json">Скачать JSON</button>
                        <button type="button" class="ghost-button" data-action="export-csv">Скачать CSV</button>
                        <button type="button" class="danger-button" data-action="clear-local-settings">Сбросить локальные настройки</button>
                    </div>
                </article>
            </div>
        `;
    }

    async function handleSettingsSubmit(event) {
        const profileForm = event.target.closest('[data-settings-form="profile"]');
        const tagForm = event.target.closest('[data-settings-form="tag"]');
        const quickProjectForm = event.target.closest("[data-quick-project-form]");
        if (quickProjectForm) {
            await handleQuickProjectSubmit(event);
            return;
        }
        if (!profileForm && !tagForm) return;
        event.preventDefault();

        if (profileForm) {
            showNotice("Профиль сохранен в демо-интерфейсе. Backend endpoint смены профиля можно добавить отдельно.", "info");
            return;
        }
        if (tagForm) {
            const formData = new FormData(tagForm);
            try {
                await api("/tags", {
                    method: "POST",
                    body: {
                        name: String(formData.get("name") || "").trim(),
                        color: String(formData.get("color") || "#FFD43B").trim()
                    }
                });
                await refreshAllData();
                showNotice("Тег создан.", "success");
            } catch (error) {
                showNotice(error.message, "error");
            }
        }
    }

    function handleSettingsChange(event) {
        const setting = event.target.dataset.setting;
        if (!setting) return;
        if (setting === "density") {
            state.interfaceDensity = event.target.value;
            document.body.dataset.density = state.interfaceDensity;
            window.localStorage.setItem("todo-lab-density", state.interfaceDensity);
        }
        if (setting === "defaultPriority") {
            state.defaultTaskPriority = event.target.value;
            elements.taskPriority.value = state.defaultTaskPriority;
            window.localStorage.setItem("todo-lab-default-priority", state.defaultTaskPriority);
        }
        if (setting === "defaultStatus") {
            state.defaultTaskStatus = event.target.value;
            elements.taskStatus.value = state.defaultTaskStatus;
            window.localStorage.setItem("todo-lab-default-status", state.defaultTaskStatus);
        }
        if (setting === "dragAndDrop") {
            state.dragAndDropEnabled = event.target.checked;
            window.localStorage.setItem("todo-lab-dnd", String(state.dragAndDropEnabled));
        }
        if (setting === "showCompleted") {
            state.showCompletedTasks = event.target.checked;
            window.localStorage.setItem("todo-lab-show-completed", String(state.showCompletedTasks));
            renderTasks();
        }
        if (setting === "notifications") {
            state.notificationsEnabled = event.target.checked;
            window.localStorage.setItem("todo-lab-notifications", String(state.notificationsEnabled));
        }
    }

    function handleSettingsClick(event) {
        const button = event.target.closest("button");
        if (!button) return;
        const action = button.dataset.action;
        if (action === "theme-light") {
            document.documentElement.dataset.theme = "light";
            window.localStorage.setItem("todo-lab-theme", "light");
        }
        if (action === "theme-dark") {
            document.documentElement.dataset.theme = "dark";
            window.localStorage.setItem("todo-lab-theme", "dark");
        }
        if (action === "select-project-settings") {
            state.selectedProjectId = Number(button.dataset.id);
            state.filters.projectId = String(button.dataset.id);
            refreshAllData();
        }
        if (action === "export-json") {
            downloadData("todo-lab-export.json", JSON.stringify({
                projects: state.projects,
                taskLists: state.taskLists,
                tasks: state.tasksPage.content,
                tags: state.tags
            }, null, 2), "application/json");
        }
        if (action === "export-csv") {
            const rows = ["id,title,status,priority,dueDate,project"];
            (state.tasksPage.content || []).forEach((task) => {
                rows.push([task.id, task.title, task.status, task.priority, task.dueDate || "", agendaProjectName(task)]
                    .map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","));
            });
            downloadData("todo-lab-tasks.csv", rows.join("\n"), "text/csv;charset=utf-8");
        }
        if (action === "clear-local-settings" && window.confirm("Сбросить локальные настройки интерфейса?")) {
            ["todo-lab-density", "todo-lab-dnd", "todo-lab-show-completed", "todo-lab-default-priority", "todo-lab-default-status", "todo-lab-notifications"].forEach((key) => window.localStorage.removeItem(key));
            showNotice("Локальные настройки сброшены. Обновите страницу.", "info");
        }
    }

    function downloadData(fileName, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    }

    function handleCommandShortcut(event) {
        if (event.key !== "/" || event.target.matches("input, textarea, select")) return;
        event.preventDefault();
        const search = document.getElementById("quickTaskSearch");
        if (search) {
            setActiveView("overview");
            search.focus();
            showNotice("Поиск активен. Введите название задачи.", "info");
        }
    }
})();
