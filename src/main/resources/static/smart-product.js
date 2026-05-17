(function () {
    const NOTES_KEY = "todo-lab-notes";
    const VIEW_KEY = "todo-lab-my-tasks-view";

    state.smartQuickFilter = "all";
    state.myTasksView = window.localStorage.getItem(VIEW_KEY) || "list";
    state.notes = loadNotes();
    state.inspectorOpen = false;
    state.smartInitialViewApplied = false;
    state.quickTaskGroupId = "";
    state.quickTaskDueDate = "";

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(initSmartProductLayer, 0);
    });

    function initSmartProductLayer() {
        ensureDashboardSection();
        ensureDocsSection();
        ensureTaskInspector();
        localizeSmartNavigation();
        restoreProjectsTabLabel();
        bindSmartEvents();
        wrapSmartRenderers();
        renderSmartScreens();
        applySmartVisibility();
    }

    function bindSmartEvents() {
        elements.taskBoard?.addEventListener("click", handleSmartTaskClick, true);
        elements.taskBoard?.addEventListener("submit", handleQuickTaskSubmit, true);
        elements.taskBoard?.addEventListener("change", handleSmartTaskChange, true);
        elements.taskBoard?.addEventListener("dragstart", handleSmartDragStart, true);
        elements.taskBoard?.addEventListener("dragover", handleSmartDragOver, true);
        elements.taskBoard?.addEventListener("dragleave", handleSmartDragLeave, true);
        elements.taskBoard?.addEventListener("drop", handleSmartDrop, true);
        document.getElementById("taskInspector")?.addEventListener("click", handleInspectorClick);
        document.getElementById("docsSection")?.addEventListener("submit", handleNoteSubmit);
        document.getElementById("docsSection")?.addEventListener("click", handleDocsClick);
        document.getElementById("dashboardSection")?.addEventListener("click", handleDashboardClick);
        document.querySelector(".sidebar-nav")?.addEventListener("click", handleSmartSidebarNavigation, true);
    }

    function wrapSmartRenderers() {
        const previousRenderApp = renderApp;
        renderApp = function () {
            previousRenderApp();
            if (state.me && !state.smartInitialViewApplied) {
                state.smartInitialViewApplied = true;
                setActiveView("overview");
            }
            renderSmartScreens();
            applySmartVisibility();
        };

        const previousRefreshAllData = refreshAllData;
        refreshAllData = async function () {
            await previousRefreshAllData();
            renderSmartScreens();
            applySmartVisibility();
        };

        const previousSetActiveView = setActiveView;
        setActiveView = function (view) {
            previousSetActiveView(view);
            applySmartVisibility();
            renderSmartScreens();
        };
    }

    renderMyTasks = function () {
        const baseTasks = state.showCompletedTasks
            ? state.tasksPage.content || []
            : (state.tasksPage.content || []).filter((task) => task.status !== "DONE");
        const tasks = applySmartTaskFilters(baseTasks);
        const today = agendaIsoDate();
        const tomorrow = agendaIsoDate(1);
        const todayAll = baseTasks.filter((task) => task.dueDate === today);
        const todayDone = todayAll.filter((task) => task.status === "DONE").length;
        const todayProgress = todayAll.length ? Math.round((todayDone / todayAll.length) * 100) : 0;
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

        elements.taskMeta.innerHTML = `
            <div class="smart-meta-panel">
                ${renderSmartHint(baseTasks)}
                <div class="quick-filter-row" aria-label="Быстрые фильтры">
                    ${quickFilterButton("all", "Все", baseTasks.length)}
                    ${quickFilterButton("today", "Сегодня", baseTasks.filter((task) => task.dueDate === today).length)}
                    ${quickFilterButton("overdue", "Просрочено", baseTasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== "DONE").length)}
                    ${quickFilterButton("no-date", "Без срока", baseTasks.filter((task) => !task.dueDate).length)}
                    ${quickFilterButton("important", "Важные", baseTasks.filter((task) => task.priority === "HIGH").length)}
                </div>
                <div class="day-progress-card">
                    <div>
                        <strong>Сегодня выполнено: ${todayDone} / ${todayAll.length}</strong>
                        <span>${todayAll.length ? `${todayProgress}% дневного плана закрыто` : "На сегодня задач нет"}</span>
                    </div>
                    <div class="progress-bar" aria-hidden="true"><span style="width:${todayProgress}%"></span></div>
                </div>
                <div class="view-switcher" aria-label="Вид задач">
                    <button type="button" class="${state.myTasksView === "list" ? "active" : ""}" data-smart-action="set-view" data-view="list">Список</button>
                    <button type="button" class="${state.myTasksView === "kanban" ? "active" : ""}" data-smart-action="set-view" data-view="kanban">Канбан</button>
                </div>
            </div>
        `;

        if (state.myTasksView === "kanban") {
            elements.taskBoard.innerHTML = renderPersonalKanban(tasks);
            return;
        }

        const groups = [
            { id: "overdue", title: "Просрочено", date: today, tasks: overdueTasks, tone: "danger", icon: "!" },
            { id: "today", title: "Сегодня", date: today, tasks: todayTasks, tone: "today", icon: "☀" },
            { id: "tomorrow", title: "Завтра", date: tomorrow, tasks: tomorrowTasks, tone: "tomorrow", icon: "→" },
            { id: "no-date", title: "Без срока", date: "", tasks: noDateTasks, tone: "muted", icon: "○" },
            { id: "other", title: "Другие задачи", date: "", tasks: otherTasks, tone: "default", icon: "•" }
        ];

        elements.taskBoard.innerHTML = `
            <section class="my-tasks-view smart-list-view">
                <div class="my-tasks-header">
                    <div>
                        <p class="section-tag">Мои задачи</p>
                        <h2>План по дням</h2>
                        <p>Перетаскивай задачи между днями, закрывай чекбоксом и меняй срок прямо в строке.</p>
                    </div>
                    <div class="my-tasks-tabs" aria-label="Фильтры задач">
                        <button type="button" class="active">Назначенные мне</button>
                        <button type="button" data-smart-action="quick-filter" data-filter="important">Важные</button>
                        <button type="button" data-smart-action="quick-filter" data-filter="overdue">Просроченные</button>
                    </div>
                </div>
                <div class="agenda-table">
                    <div class="agenda-head smart-agenda-head">
                        <span>Наименование</span>
                        <span>Номер</span>
                        <span>Исполнитель</span>
                        <span>Проект</span>
                        <span>Срок</span>
                        <span>Приоритет</span>
                        <span>Действия</span>
                    </div>
                    ${groups.map((group) => renderAgendaGroup(group)).join("")}
                </div>
            </section>
        `;
    };

    renderAgendaGroup = function (group) {
        return `
            <section class="agenda-day agenda-day-${group.tone}" data-date="${group.date}">
                <button type="button" class="agenda-day-title agenda-day-title-${group.tone}" data-action="focus-new-task" data-group="${group.id}" data-due="${group.date}">
                    <span><b>${group.icon}</b> ${group.title}</span>
                    <small>${group.tasks.length} задач</small>
                </button>
                <button type="button" class="agenda-new-row" data-action="focus-new-task" data-group="${group.id}" data-due="${group.date}">+ Новая задача</button>
                ${state.quickTaskGroupId === group.id ? renderQuickTaskForm(group) : ""}
                ${group.tasks.length > 0
                    ? group.tasks.map((task) => renderAgendaTaskRow(task)).join("")
                    : `<button type="button" class="agenda-empty-line agenda-empty-cta" data-action="focus-new-task" data-group="${group.id}" data-due="${group.date}">
                        <span class="empty-icon">📋</span>
                        <strong>Создать первую задачу</strong>
                        <small>Или перетащи сюда задачу, чтобы поставить срок.</small>
                    </button>`}
            </section>
        `;
    };

    function renderQuickTaskForm(group) {
        return `
            <form class="quick-task-add-form" data-quick-task-form data-group="${group.id}" data-due="${group.date}">
                <label>
                    <span>Новая задача</span>
                    <input name="title" type="text" placeholder="Например: подготовить отчет" autocomplete="off" data-quick-task-input="${group.id}" required>
                </label>
                <label>
                    <span>Приоритет</span>
                    <select name="priority">
                        <option value="MEDIUM">Средний</option>
                        <option value="HIGH">Высокий</option>
                        <option value="LOW">Низкий</option>
                    </select>
                </label>
                <button type="submit" class="primary-button">Создать</button>
                <button type="button" class="ghost-button" data-smart-action="cancel-quick-task">Отмена</button>
            </form>
        `;
    }

    renderAgendaTaskRow = function (task) {
        const done = task.status === "DONE";
        const attention = getAttentionClass(task);
        return `
            <article class="agenda-row task-card smart-task-row ${attention} ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" draggable="true" tabindex="0" role="button" title="Открыть мини-панель задачи">
                <div class="agenda-name">
                    <button type="button" class="task-done-toggle" data-smart-action="complete-task" data-id="${task.id}" title="${done ? "Вернуть в работу" : "Отметить выполненной"}">
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
                <span class="mini-chip priority-chip priority-${task.priority}">${priorityLabel(task.priority)}</span>
                <span class="agenda-row-actions">
                    <button type="button" class="row-action" data-smart-action="complete-task" data-id="${task.id}" title="Выполнено">✓</button>
                    <input class="row-date-input" type="date" value="${escapeHtml(task.dueDate || "")}" data-smart-task="${task.id}" title="Срок">
                    <select class="row-assignee-select" data-smart-task="${task.id}" title="Исполнитель">
                        <option value="">Не назначен</option>
                        ${state.users.map((user) => `<option value="${user.id}" ${String(task.assigneeId || "") === String(user.id) ? "selected" : ""}>${escapeHtml(initials(user.displayName || user.email))}</option>`).join("")}
                    </select>
                    <button type="button" class="row-action" data-smart-action="open-inspector" data-id="${task.id}" title="Еще">⋯</button>
                </span>
            </article>
        `;
    };

    function renderPersonalKanban(tasks) {
        const columns = [
            { status: "TODO", title: "К выполнению", tone: "todo" },
            { status: "IN_PROGRESS", title: "В работе", tone: "progress" },
            { status: "DONE", title: "Готово", tone: "done" }
        ];
        return `
            <section class="smart-kanban">
                ${columns.map((column) => {
                    const columnTasks = tasks.filter((task) => task.status === column.status);
                    return `
                        <section class="board-column board-column-${column.tone}" data-status="${column.status}">
                            <header class="board-column-header">
                                <div>
                                    <h3>${column.title}</h3>
                                    <span>${columnTasks.length} задач</span>
                                </div>
                                <button type="button" class="column-add-button" data-action="focus-new-task" data-status="${column.status}" title="Добавить задачу"><span>+</span><strong>Добавить задачу</strong></button>
                            </header>
                            <div class="board-column-stack">
                                ${columnTasks.length ? columnTasks.map((task) => renderSmartKanbanCard(task)).join("") : `
                                    <button type="button" class="board-empty board-empty-cta" data-action="focus-new-task" data-status="${column.status}">
                                        <span class="empty-icon">🧩</span>
                                        <strong>Перетащи сюда</strong>
                                        <small>Так задача сменит статус.</small>
                                    </button>
                                `}
                            </div>
                        </section>
                    `;
                }).join("")}
            </section>
        `;
    }

    function renderSmartKanbanCard(task) {
        const done = task.status === "DONE";
        return `
            <article class="task-card clean-task-card smart-kanban-card ${getAttentionClass(task)} ${done ? "is-done" : ""}" data-id="${task.id}" draggable="true">
                <div class="clean-card-head">
                    <button type="button" class="task-done-toggle" data-smart-action="complete-task" data-id="${task.id}" title="Выполнено">${done ? "✓" : ""}</button>
                    <span class="task-id">#${task.id}</span>
                    <button type="button" class="row-action" data-smart-action="open-inspector" data-id="${task.id}" title="Еще">⋯</button>
                </div>
                <h3 class="card-title">${escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="minimal-card-description">${escapeHtml(task.description)}</p>` : ""}
                <div class="clean-card-meta">
                    <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                    <span class="priority-label priority-${task.priority}">${priorityLabel(task.priority)}</span>
                </div>
                <small>${escapeHtml(task.dueDate ? agendaDateLabel(task.dueDate) : "Без срока")}</small>
            </article>
        `;
    }

    function renderSmartScreens() {
        renderDashboard();
        renderDocs();
        renderTaskInspector();
    }

    function renderDashboard() {
        const section = document.getElementById("dashboardSection");
        if (!section || !state.me) return;
        const tasks = state.tasksPage.content || [];
        const done = tasks.filter((task) => task.status === "DONE").length;
        const overdue = tasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE");
        const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        const activeProjects = state.projects.slice(0, 4);

        section.innerHTML = `
            <div class="dashboard-hero">
                <div>
                    <p class="section-tag">Обзор</p>
                    <h2>Рабочий день в Todo Lab</h2>
                    <p>${buildDashboardHint(tasks, overdue)}</p>
                </div>
                <button type="button" class="primary-button" data-dashboard-action="new-task">+ Быстрая задача</button>
            </div>
            <div class="dashboard-grid">
                <article class="dashboard-card">
                    <span>Прогресс проекта</span>
                    <strong>${progress}%</strong>
                    <div class="progress-bar"><span style="width:${progress}%"></span></div>
                </article>
                <article class="dashboard-card attention-danger">
                    <span>Просрочено</span>
                    <strong>${overdue.length}</strong>
                    <button type="button" class="link-button" data-dashboard-action="overdue">Показать</button>
                </article>
                <article class="dashboard-card attention-today">
                    <span>Сегодня</span>
                    <strong>${tasks.filter((task) => task.dueDate === agendaIsoDate()).length}</strong>
                    <button type="button" class="link-button" data-dashboard-action="today">К плану</button>
                </article>
                <article class="dashboard-card attention-done">
                    <span>Выполнено</span>
                    <strong>${done}</strong>
                    <small>Закрытые задачи остаются в истории</small>
                </article>
            </div>
            <div class="dashboard-grid two-columns">
                <article class="dashboard-card">
                    <h3>Активные проекты</h3>
                    <div class="dashboard-list">
                        ${activeProjects.map((project) => `<button type="button" data-dashboard-action="project" data-id="${project.id}"><span>${escapeHtml(project.name)}</span><small>Открыть</small></button>`).join("") || `<div class="dashboard-empty">Проектов пока нет. Создай первый проект в разделе ниже.</div>`}
                    </div>
                </article>
                <article class="dashboard-card">
                    <h3>Что требует внимания</h3>
                    <div class="dashboard-list">
                        ${overdue.slice(0, 5).map((task) => `<button type="button" data-dashboard-action="task" data-id="${task.id}"><span>${escapeHtml(task.title)}</span><small>${escapeHtml(agendaDateLabel(task.dueDate))}</small></button>`).join("") || `<div class="dashboard-empty">Критичных задач нет. Отличная работа.</div>`}
                    </div>
                </article>
            </div>
        `;
    }

    function renderDocs() {
        const section = document.getElementById("docsSection");
        if (!section || !state.me) return;
        const selectedTask = getSelectedTask();
        const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);

        section.innerHTML = `
            <div class="docs-header">
                <div>
                    <p class="section-tag">Документы</p>
                    <h2>Заметки проекта</h2>
                    <p>Мини-Notion внутри лабораторной: ТЗ, идеи, требования и заметки можно привязать к проекту или задаче.</p>
                </div>
                <span class="mini-chip">${state.notes.length} заметок</span>
            </div>
            <form class="note-editor" data-note-form>
                <input name="title" placeholder="Название заметки" required maxlength="120">
                <textarea name="text" rows="6" placeholder="Текст заметки, markdown или список требований" required></textarea>
                <div class="note-links">
                    <label><span>Проект</span><select name="projectId">
                        <option value="">Без проекта</option>
                        ${state.projects.map((project) => `<option value="${project.id}" ${project.id === selectedProject?.id ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
                    </select></label>
                    <label><span>Задача</span><select name="taskId">
                        <option value="">Без задачи</option>
                        ${(state.tasksPage.content || []).map((task) => `<option value="${task.id}" ${task.id === selectedTask?.id ? "selected" : ""}>#${task.id} ${escapeHtml(task.title)}</option>`).join("")}
                    </select></label>
                    <button type="submit" class="primary-button">Сохранить заметку</button>
                </div>
            </form>
            <div class="notes-grid">
                ${state.notes.map((note) => renderNote(note)).join("") || `
                    <div class="docs-empty">
                        <span class="empty-icon">📝</span>
                        <strong>Создай первую заметку</strong>
                        <p>Например: “ТЗ проекта”, “Идеи”, “Список требований”.</p>
                    </div>
                `}
            </div>
        `;
    }

    function renderNote(note) {
        const project = state.projects.find((item) => String(item.id) === String(note.projectId));
        const task = (state.tasksPage.content || []).find((item) => String(item.id) === String(note.taskId));
        return `
            <article class="note-card">
                <div>
                    <h3>${escapeHtml(note.title)}</h3>
                    <p>${escapeHtml(note.text)}</p>
                </div>
                <div class="note-meta">
                    ${project ? `<span>Проект: ${escapeHtml(project.name)}</span>` : ""}
                    ${task ? `<span>Задача: #${task.id}</span>` : ""}
                    <button type="button" class="danger-button" data-doc-action="delete-note" data-id="${note.id}">Удалить</button>
                </div>
            </article>
        `;
    }

    function renderTaskInspector() {
        const inspector = document.getElementById("taskInspector");
        if (!inspector) return;
        const task = getSelectedTask();
        inspector.classList.toggle("open", Boolean(state.inspectorOpen && task));
        if (!task) {
            inspector.innerHTML = "";
            return;
        }

        inspector.innerHTML = `
            <aside class="task-inspector-panel">
                <div class="inspector-head">
                    <span class="task-id">#${task.id}</span>
                    <button type="button" class="ghost-button" data-inspector-action="close">Закрыть</button>
                </div>
                <h2>${escapeHtml(task.title)}</h2>
                <p>${escapeHtml(task.description || "Описание пока не добавлено.")}</p>
                <div class="inspector-grid">
                    <span>Статус</span><strong>${statusLabel(task.status)}</strong>
                    <span>Приоритет</span><strong>${priorityLabel(task.priority)}</strong>
                    <span>Срок</span><strong>${escapeHtml(task.dueDate ? agendaDateLabel(task.dueDate) : "Без срока")}</strong>
                    <span>Исполнитель</span><strong>${escapeHtml(task.assigneeEmail || "Не назначен")}</strong>
                </div>
                <div class="inspector-tags">
                    ${(task.tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag.name)}</span>`).join("") || "<span class=\"muted-text\">Тегов нет</span>"}
                </div>
                <section>
                    <h3>Комментарии</h3>
                    <div class="inspector-list">
                        ${(state.comments || []).map((comment) => `<p>${escapeHtml(comment.text)}</p>`).join("") || "<p>Комментариев пока нет. Добавь первый справа в блоке обсуждения.</p>"}
                    </div>
                </section>
                <section>
                    <h3>История</h3>
                    <p class="muted-text">Задача создана в списке “${escapeHtml(task.taskListName || "Основной список")}”. Изменения статуса и срока показываются toast-уведомлениями.</p>
                </section>
            </aside>
        `;
    }

    function handleSmartTaskClick(event) {
        const smartButton = event.target.closest("[data-smart-action]");
        const focusButton = event.target.closest('[data-action="focus-new-task"]');
        const row = event.target.closest(".agenda-row[data-id], .smart-kanban-card[data-id]");

        if (smartButton) {
            const action = smartButton.dataset.smartAction;
            const id = Number(smartButton.dataset.id || row?.dataset.id);
            event.preventDefault();
            event.stopImmediatePropagation();
            if (action === "cancel-quick-task") {
                state.quickTaskGroupId = "";
                state.quickTaskDueDate = "";
                renderTasks();
            }
            if (action === "complete-task") {
                completeTask(id, smartButton.closest(".task-card"));
            }
            if (action === "open-inspector") {
                openInspector(id);
            }
            if (action === "quick-filter") {
                state.smartQuickFilter = smartButton.dataset.filter || "all";
                renderTasks();
            }
            if (action === "set-view") {
                state.myTasksView = smartButton.dataset.view || "list";
                window.localStorage.setItem(VIEW_KEY, state.myTasksView);
                renderTasks();
            }
            return;
        }

        if (focusButton && document.body.dataset.view === "tasks" && state.myTasksView === "list") {
            event.preventDefault();
            event.stopImmediatePropagation();
            state.quickTaskGroupId = focusButton.dataset.group || "today";
            state.quickTaskDueDate = focusButton.dataset.due || "";
            renderTasks();
            requestAnimationFrame(() => {
                document.querySelector(`[data-quick-task-input="${state.quickTaskGroupId}"]`)?.focus();
            });
            return;
        }

        if (event.target.closest("button, input, select, textarea")) {
            return;
        }

        if (row) {
            event.preventDefault();
            event.stopImmediatePropagation();
            openInspector(Number(row.dataset.id));
        }
    }

    async function handleQuickTaskSubmit(event) {
        const form = event.target.closest("[data-quick-task-form]");
        if (!form) return;
        event.preventDefault();
        event.stopImmediatePropagation();

        const title = String(new FormData(form).get("title") || "").trim();
        const priority = String(new FormData(form).get("priority") || "MEDIUM");
        if (!title) {
            form.querySelector("input")?.focus();
            return;
        }

        try {
            const taskListId = await ensureTaskListForCurrentProject();
            if (!taskListId) {
                showNotice("Сначала создай или выбери проект.", "error");
                return;
            }
            const created = await api("/tasks", {
                method: "POST",
                body: {
                    title,
                    description: null,
                    status: "TODO",
                    priority,
                    dueDate: form.dataset.due || null,
                    assigneeId: state.me?.id || null,
                    taskListId,
                    tagIds: []
                }
            });
            makeCreatedTaskVisible(created);
            state.quickTaskGroupId = form.dataset.group || state.quickTaskGroupId;
            state.quickTaskDueDate = form.dataset.due || "";
            await refreshAllData();
            showNotice("Задача создана.", "success");
            requestAnimationFrame(() => {
                document.querySelector(`[data-quick-task-input="${state.quickTaskGroupId}"]`)?.focus();
            });
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    async function handleSmartTaskChange(event) {
        const dateInput = event.target.closest(".row-date-input");
        const assigneeSelect = event.target.closest(".row-assignee-select");
        if (!dateInput && !assigneeSelect) return;
        event.stopImmediatePropagation();
        const id = Number((dateInput || assigneeSelect).dataset.smartTask);
        const task = findTask(id);
        if (!task) return;
        try {
            await smartUpdateTask(task, {
                dueDate: dateInput ? (dateInput.value || null) : task.dueDate || null,
                assigneeId: assigneeSelect ? (assigneeSelect.value ? Number(assigneeSelect.value) : null) : task.assigneeId || null
            });
            showNotice(dateInput ? "Срок задачи обновлен." : "Исполнитель обновлен.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    function handleSmartDragStart(event) {
        if (!state.dragAndDropEnabled) return;
        const row = event.target.closest(".agenda-row[data-id]");
        if (!row || document.body.dataset.view !== "tasks") return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", row.dataset.id);
        row.classList.add("is-dragging");
    }

    function handleSmartDragOver(event) {
        if (!state.dragAndDropEnabled) return;
        const day = event.target.closest(".agenda-day[data-date]");
        if (!day || document.body.dataset.view !== "tasks") return;
        event.preventDefault();
        day.classList.add("is-date-drop-target");
    }

    function handleSmartDragLeave(event) {
        const day = event.target.closest(".agenda-day[data-date]");
        if (!day || day.contains(event.relatedTarget)) return;
        day.classList.remove("is-date-drop-target");
    }

    async function handleSmartDrop(event) {
        if (!state.dragAndDropEnabled) return;
        const day = event.target.closest(".agenda-day[data-date]");
        if (!day || document.body.dataset.view !== "tasks") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        document.querySelectorAll(".is-date-drop-target, .is-dragging").forEach((item) => item.classList.remove("is-date-drop-target", "is-dragging"));
        const task = findTask(Number(event.dataTransfer.getData("text/plain")));
        if (!task) return;
        try {
            await smartUpdateTask(task, { dueDate: day.dataset.date || null });
            showNotice(`Срок изменен: ${day.dataset.date ? agendaDateLabel(day.dataset.date) : "без срока"}.`, "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    async function completeTask(id, visualElement) {
        const task = findTask(id);
        if (!task) return;
        const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
        try {
            visualElement?.classList.add("is-completing");
            await api(`/tasks/${id}/status?status=${nextStatus}`, { method: "PATCH" });
            state.selectedTaskId = id;
            await refreshAllData();
            showNotice(nextStatus === "DONE" ? "Задача выполнена." : "Задача возвращена в работу.", "success");
        } catch (error) {
            visualElement?.classList.remove("is-completing");
            showNotice(error.message, "error");
        }
    }

    async function openInspector(id) {
        state.selectedTaskId = id;
        state.inspectorOpen = true;
        await loadTaskSideData();
        renderTaskDetail();
        renderComments();
        renderReminders();
        renderTaskInspector();
    }

    function handleInspectorClick(event) {
        if (event.target.closest('[data-inspector-action="close"]')) {
            state.inspectorOpen = false;
            renderTaskInspector();
        }
    }

    async function handleNoteSubmit(event) {
        const form = event.target.closest("[data-note-form]");
        if (!form) return;
        event.preventDefault();
        const data = new FormData(form);
        state.notes.unshift({
            id: Date.now(),
            title: String(data.get("title") || "").trim(),
            text: String(data.get("text") || "").trim(),
            projectId: String(data.get("projectId") || ""),
            taskId: String(data.get("taskId") || ""),
            createdAt: new Date().toISOString()
        });
        saveNotes();
        form.reset();
        renderDocs();
        showNotice("Заметка сохранена.", "success");
    }

    function handleDocsClick(event) {
        const button = event.target.closest("[data-doc-action]");
        if (!button) return;
        if (button.dataset.docAction === "delete-note") {
            state.notes = state.notes.filter((note) => String(note.id) !== String(button.dataset.id));
            saveNotes();
            renderDocs();
            showNotice("Заметка удалена.", "success");
        }
    }

    function handleDashboardClick(event) {
        const button = event.target.closest("[data-dashboard-action]");
        if (!button) return;
        const action = button.dataset.dashboardAction;
        if (action === "new-task") {
            setActiveView("tasks");
            elements.taskTitle?.focus();
        }
        if (action === "today" || action === "overdue") {
            state.smartQuickFilter = action;
            setActiveView("tasks");
            renderTasks();
        }
        if (action === "project") {
            state.selectedProjectId = Number(button.dataset.id);
            state.filters.projectId = String(button.dataset.id);
            setActiveView("projects");
            refreshAllData();
        }
        if (action === "task") {
            setActiveView("tasks");
            openInspector(Number(button.dataset.id));
        }
    }

    async function smartUpdateTask(task, patch) {
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
        return updated;
    }

    function applySmartTaskFilters(tasks) {
        const search = normalizeSearch(state.quickSearch || "");
        return tasks.filter((task) => {
            const matchesSearch = !search || smartSearchMatch(task, search);
            const matchesQuick = matchesQuickFilter(task);
            return matchesSearch && matchesQuick;
        });
    }

    function smartSearchMatch(task, search) {
        if (search === "today" || search === "сегодня") return task.dueDate === agendaIsoDate();
        if (search === "tomorrow" || search === "завтра") return task.dueDate === agendaIsoDate(1);
        if (search === "overdue" || search === "просрочено") return task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE";
        const haystack = [
            task.title,
            task.description,
            agendaProjectName(task),
            task.taskListName,
            task.assigneeEmail,
            ...(task.tags || []).map((tag) => tag.name)
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search);
    }

    function matchesQuickFilter(task) {
        if (state.smartQuickFilter === "today") return task.dueDate === agendaIsoDate();
        if (state.smartQuickFilter === "overdue") return task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE";
        if (state.smartQuickFilter === "no-date") return !task.dueDate;
        if (state.smartQuickFilter === "important") return task.priority === "HIGH";
        return true;
    }

    function quickFilterButton(filter, label, count) {
        return `<button type="button" class="quick-filter-chip ${state.smartQuickFilter === filter ? "active" : ""}" data-smart-action="quick-filter" data-filter="${filter}">${label}<span>${count}</span></button>`;
    }

    function renderSmartHint(tasks) {
        const overdue = tasks.filter((task) => task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE").length;
        const open = tasks.filter((task) => task.status !== "DONE").length;
        if (tasks.length === 0) {
            return `<div class="smart-hint empty">📋 Создай первую задачу, чтобы запустить планирование.</div>`;
        }
        if (overdue > 0) {
            return `<div class="smart-hint danger">Есть просроченные задачи: ${overdue}. Лучше закрыть их первыми.</div>`;
        }
        if (open === 0) {
            return `<div class="smart-hint success">Отличная работа! Все задачи выполнены.</div>`;
        }
        return `<div class="smart-hint">Фокус на главном: важные и сегодняшние задачи подсвечены.</div>`;
    }

    function buildDashboardHint(tasks, overdue) {
        if (tasks.length === 0) return "Начните с первой задачи или проекта, и обзор сразу оживет.";
        if (overdue.length > 0) return `У тебя ${overdue.length} просроченных задач. Они вынесены в блок внимания.`;
        if (tasks.every((task) => task.status === "DONE")) return "Отличная работа! Все задачи закрыты.";
        return "Здесь видно прогресс, активные проекты и задачи, требующие внимания.";
    }

    function getAttentionClass(task) {
        if (task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE") return "attention-overdue";
        if (task.dueDate === agendaIsoDate() && task.status !== "DONE") return "attention-today";
        if (task.priority === "HIGH" && task.status !== "DONE") return "attention-important";
        return "";
    }

    function applySmartVisibility() {
        const view = document.body.dataset.view || "tasks";
        const dashboard = document.getElementById("dashboardSection");
        const docs = document.getElementById("docsSection");
        const projects = document.getElementById("projectsSection");
        const tasks = document.getElementById("tasksSection");
        const settings = document.getElementById("settingsSection");

        dashboard?.classList.toggle("hidden", view !== "overview");
        docs?.classList.toggle("hidden", view !== "docs");

        if (view === "docs") {
            projects?.classList.add("hidden");
            tasks?.classList.add("hidden");
            settings?.classList.add("hidden");
        } else if (view === "projects") {
            projects?.classList.add("hidden");
            tasks?.classList.remove("hidden");
            settings?.classList.add("hidden");
        } else if (view === "overview") {
            projects?.classList.add("hidden");
            tasks?.classList.add("hidden");
            settings?.classList.add("hidden");
        } else if (view === "tasks") {
            projects?.classList.add("hidden");
            tasks?.classList.remove("hidden");
            settings?.classList.add("hidden");
        }

        document.querySelectorAll(".product-tab").forEach((button) => {
            button.classList.toggle("active", button.dataset.view === view);
        });
        document.querySelectorAll(".sidebar-nav .nav-link").forEach((link) => {
            const target = link.getAttribute("href");
            link.classList.toggle("active",
                (view === "projects" && target === "#projectsSection")
                || (view === "tasks" && target === "#tasksSection")
            );
        });
    }

    function ensureDashboardSection() {
        if (document.getElementById("dashboardSection")) return;
        const section = document.createElement("section");
        section.id = "dashboardSection";
        section.className = "dashboard-section surface-card section-card hidden";
        document.getElementById("projectsSection")?.insertAdjacentElement("beforebegin", section);
    }

    function ensureDocsSection() {
        if (document.getElementById("docsSection")) return;
        const section = document.createElement("section");
        section.id = "docsSection";
        section.className = "docs-section surface-card section-card hidden";
        document.getElementById("tasksSection")?.insertAdjacentElement("afterend", section);
    }

    function ensureTaskInspector() {
        if (document.getElementById("taskInspector")) return;
        const inspector = document.createElement("div");
        inspector.id = "taskInspector";
        inspector.className = "task-inspector";
        document.body.appendChild(inspector);
    }

    function localizeSmartNavigation() {
        const overviewTab = document.querySelector('.product-tab[data-view="overview"]');
        const tasksTab = document.querySelector('.product-tab[data-view="tasks"]');
        const docsTab = document.querySelector('.product-tab[data-view="docs"]');
        const settingsTab = document.querySelector('.product-tab[data-view="settings"]');
        if (overviewTab) overviewTab.textContent = "Обзор";
        if (tasksTab) tasksTab.textContent = "Мои задачи";
        if (docsTab) docsTab.textContent = "Документы";
        if (settingsTab) settingsTab.textContent = "Настройки";
    }

    function restoreProjectsTabLabel() {
        const overviewTab = document.querySelector('.product-tab[data-view="overview"]');
        const projectsTab = document.querySelector('.product-tab[data-view="projects"]');
        if (overviewTab) overviewTab.textContent = "Dashboard";
        if (projectsTab) projectsTab.textContent = "Проекты";
    }

    function handleSmartSidebarNavigation(event) {
        const link = event.target.closest(".nav-link");
        if (!link) return;
        const target = link.getAttribute("href");
        if (target === "#projectsSection") {
            event.preventDefault();
            event.stopImmediatePropagation();
            setActiveView("projects");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (target === "#tasksSection") {
            event.preventDefault();
            event.stopImmediatePropagation();
            setActiveView("tasks");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function findTask(id) {
        return (state.tasksPage.content || []).find((task) => Number(task.id) === Number(id));
    }

    function normalizeSearch(value) {
        return String(value || "").trim().toLowerCase();
    }

    function initials(value) {
        return String(value || "?")
            .split(/\s|@/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
    }

    function loadNotes() {
        try {
            return JSON.parse(window.localStorage.getItem(NOTES_KEY) || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveNotes() {
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
    }
})();
