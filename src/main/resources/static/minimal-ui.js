(function () {
    let minimalUiInitialized = false;
    state.minimalFilter = "all";

    const bootMinimalUi = () => {
        setTimeout(initMinimalUi, 0);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootMinimalUi);
    } else {
        bootMinimalUi();
    }

    function initMinimalUi() {
        if (minimalUiInitialized) {
            return;
        }
        minimalUiInitialized = true;
        document.body.classList.add("minimal-ui");
        elements.taskMeta?.addEventListener("click", handleMinimalMetaClick);
        elements.taskBoard?.addEventListener("click", handleMinimalBoardClick, true);
        elements.taskBoard?.addEventListener("dragstart", handleMinimalBoardDragStart, true);
        elements.taskBoard?.addEventListener("dragover", handleMinimalBoardDragOver, true);
        elements.taskBoard?.addEventListener("drop", handleMinimalBoardDrop, true);
        elements.taskBoard?.addEventListener("dragend", clearMinimalDragState, true);
        overrideBoardRendering();
        if (state.me) {
            renderApp();
        }
    }

    function overrideBoardRendering() {
        renderTaskProjectPanel = function () {
            const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
            elements.taskProjectPanel.classList.remove("hidden");

            if (!selectedProject) {
                elements.taskProjectPanel.innerHTML = `
                    <section class="minimal-project-bar is-empty">
                        <div>
                            <p class="section-tag">Проект</p>
                            <h2>Создайте проект</h2>
                            <span>Проект нужен для канбан-доски, списков задач и тегов.</span>
                        </div>
                        <button type="button" class="primary-button" data-action="show-project-settings">Создать проект</button>
                    </section>
                `;
                return;
            }

            if (state.projectInlineCreating) {
                elements.taskProjectPanel.innerHTML = `
                    <form class="minimal-project-bar is-creating" data-quick-project-form>
                        <div>
                            <p class="section-tag">Новый проект</p>
                            <h2>Создать проект</h2>
                            <span>Название, короткое описание и сразу новая канбан-доска.</span>
                        </div>
                        <label class="minimal-inline-field">
                            <span>Название</span>
                            <input name="name" type="text" maxlength="150" placeholder="Например: Лабораторная работа" required>
                        </label>
                        <label class="minimal-inline-field">
                            <span>Описание</span>
                            <input name="description" type="text" maxlength="500" placeholder="Кратко о проекте">
                        </label>
                        <div class="minimal-project-actions">
                            <button type="submit" class="primary-button">Создать проект</button>
                            <button type="button" class="ghost-button" data-action="cancel-project-create">Отмена</button>
                        </div>
                    </form>
                `;
                return;
            }

            if (state.projectInlineEditing) {
                elements.taskProjectPanel.innerHTML = `
                    <form class="minimal-project-bar is-editing" data-project-edit-form>
                        <div>
                            <p class="section-tag">Редактирование</p>
                            <h2>${escapeHtml(selectedProject.name)}</h2>
                            <span>Измени название или описание проекта без перехода на отдельную форму.</span>
                        </div>
                        <label class="minimal-inline-field">
                            <span>Название</span>
                            <input name="name" type="text" value="${escapeHtml(selectedProject.name)}" maxlength="120" required>
                        </label>
                        <label class="minimal-inline-field">
                            <span>Описание</span>
                            <input name="description" type="text" value="${escapeHtml(selectedProject.description || "")}" maxlength="500">
                        </label>
                        <div class="minimal-project-actions">
                            <button type="submit" class="primary-button">Сохранить</button>
                            <button type="button" class="ghost-button" data-action="cancel-project-edit">Назад</button>
                        </div>
                    </form>
                `;
                return;
            }

            const projectTasks = state.tasksPage.content || [];
            const doneCount = projectTasks.filter((task) => task.status === "DONE").length;
            const overdueCount = projectTasks.filter((task) => isOverdue(task)).length;
            elements.taskProjectPanel.innerHTML = `
                <section class="minimal-project-bar">
                    <div>
                        <p class="section-tag">Проект</p>
                        <h2>${escapeHtml(selectedProject.name)}</h2>
                        <span>${escapeHtml(selectedProject.description || "Рабочая канбан-доска проекта")}</span>
                    </div>
                    <div class="minimal-project-stats">
                        <span>${projectTasks.length} задач</span>
                        <span class="success">${doneCount} готово</span>
                        <span class="${overdueCount ? "danger" : ""}">${overdueCount} просрочено</span>
                    </div>
                    <div class="minimal-project-actions">
                        <button type="button" class="ghost-button" data-action="new-project-here">+ Проект</button>
                        <button type="button" class="secondary-button" data-action="edit-project-here">Настроить</button>
                        <button type="button" class="primary-button" data-action="focus-new-task">+ Задача</button>
                    </div>
                </section>
            `;
        };

        renderProjectTaskBoard = function () {
            const tasks = filterMinimalTasks(state.tasksPage.content || []);
            const today = agendaIsoDate();
            const overdueCount = tasks.filter((task) => isOverdue(task)).length;
            const todayCount = tasks.filter((task) => task.dueDate === today).length;
            const doneCount = tasks.filter((task) => task.status === "DONE").length;
            const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

            elements.taskMeta.innerHTML = `
                <div class="minimal-toolbar">
                    <div class="minimal-summary">
                        <strong>${tasks.length} задач</strong>
                        <span>Выполнено ${doneCount}/${tasks.length} · ${progress}%</span>
                    </div>
                    <div class="minimal-filter-chips" aria-label="Быстрые фильтры">
                        ${minimalFilterButton("all", "Все", tasks.length)}
                        ${minimalFilterButton("today", "Сегодня", todayCount)}
                        ${minimalFilterButton("overdue", "Просрочено", overdueCount)}
                        ${minimalFilterButton("important", "Важные", tasks.filter((task) => task.priority === "HIGH").length)}
                    </div>
                </div>
            `;

            const columns = [
                { status: "TODO", title: "К выполнению", tone: "todo" },
                { status: "IN_PROGRESS", title: "В работе", tone: "progress" },
                { status: "DONE", title: "Готово", tone: "done" }
            ];

            elements.taskBoard.innerHTML = columns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.status);
                return `
                    <section class="board-column minimal-board-column board-column-${column.tone}" data-status="${column.status}">
                        <header class="board-column-header">
                            <div>
                                <h3>${column.title}</h3>
                                <span>${columnTasks.length} задач</span>
                            </div>
                            <button type="button" class="column-add-button" data-action="focus-new-task" data-status="${column.status}" title="Создать задачу">
                                <span>+</span>
                                <strong>Создать</strong>
                            </button>
                        </header>
                        <div class="board-column-stack">
                            ${columnTasks.length
                                ? columnTasks.map((task) => renderBoardTaskCard(task)).join("")
                                : renderMinimalEmpty(column.status)}
                        </div>
                    </section>
                `;
            }).join("");
        };

        renderBoardTaskCard = function (task) {
            const done = task.status === "DONE";
            const attention = getMinimalAttention(task);
            return `
                <article class="task-card clean-task-card minimal-task-card ${attention} ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" draggable="true" tabindex="0">
                    <div class="minimal-card-top">
                        <span class="task-id">#${task.id}</span>
                        <button type="button" class="minimal-menu-button" data-action="select-task" data-id="${task.id}" title="Действия">⋯</button>
                    </div>
                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                    ${task.description ? `<p class="minimal-card-description">${escapeHtml(task.description)}</p>` : ""}
                    <div class="minimal-card-meta">
                        <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                        ${task.priority === "HIGH" ? `<span class="priority-label priority-HIGH">Высокий</span>` : ""}
                        ${task.dueDate ? `<span class="due-label ${isOverdue(task) ? "danger" : task.dueDate === agendaIsoDate() ? "today" : ""}">${escapeHtml(agendaDateLabel(task.dueDate))}</span>` : ""}
                    </div>
                    <div class="task-card-actions minimal-card-actions">
                        <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                        <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="${done ? "TODO" : "DONE"}">${done ? "Вернуть" : "Готово"}</button>
                        <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                    </div>
                </article>
            `;
        };

        renderAgendaTaskRow = function (task) {
            const done = task.status === "DONE";
            const attention = getMinimalAttention(task);
            return `
                <article class="agenda-row task-card smart-task-row minimal-task-row ${attention} ${done ? "is-done" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" draggable="true" tabindex="0" role="button">
                    <div class="agenda-name">
                        <button type="button" class="task-done-toggle" data-smart-action="complete-task" data-id="${task.id}" title="${done ? "Вернуть в работу" : "Выполнено"}">${done ? "✓" : ""}</button>
                        <div>
                            <h3>${escapeHtml(task.title)}</h3>
                            <p>${escapeHtml(task.description || "Добавь описание")}</p>
                        </div>
                    </div>
                    <span class="task-id">#${task.id}</span>
                    <span class="agenda-date ${agendaDateClass(task.dueDate)}">${escapeHtml(agendaDateLabel(task.dueDate))}</span>
                    <span class="mini-chip priority-chip priority-${task.priority}">${priorityLabel(task.priority)}</span>
                    <span class="agenda-row-actions">
                        <button type="button" class="row-action" data-smart-action="complete-task" data-id="${task.id}" title="Выполнено">✓</button>
                        <input class="row-date-input" type="date" value="${escapeHtml(task.dueDate || "")}" data-smart-task="${task.id}" title="Срок">
                        <button type="button" class="row-action" data-smart-action="open-inspector" data-id="${task.id}" title="Еще">⋯</button>
                    </span>
                </article>
            `;
        };
    }

    function handleMinimalMetaClick(event) {
        const button = event.target.closest("[data-minimal-filter]");
        if (!button) return;
        state.minimalFilter = button.dataset.minimalFilter || "all";
        renderTasks();
    }

    async function handleMinimalBoardClick(event) {
        if (!isMinimalProjectBoardView()) return;
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        if (!["focus-new-task", "select-task", "edit-task", "delete-task", "set-status"].includes(action)) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (action === "focus-new-task") {
            resetTaskForm();
            if (button.dataset.status) elements.taskStatus.value = button.dataset.status;
            state.taskEditorExpanded = false;
            syncTaskEditorState();
            elements.taskTitle.focus();
            return;
        }

        const id = Number(button.dataset.id || button.closest(".task-card")?.dataset.id);
        if (!id) return;

        if (action === "select-task" || action === "edit-task") {
            state.selectedTaskId = id;
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
            await moveTaskToStatus(id, button.dataset.status);
        }
    }

    function handleMinimalBoardDragStart(event) {
        if (!isMinimalProjectBoardView()) return;
        const card = event.target.closest(".task-card[data-id]");
        if (!card) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.id);
        card.classList.add("is-dragging");
    }

    function handleMinimalBoardDragOver(event) {
        if (!isMinimalProjectBoardView()) return;
        const column = event.target.closest(".board-column[data-status]");
        if (!column) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        event.dataTransfer.dropEffect = "move";
        column.classList.add("is-drop-target");
    }

    async function handleMinimalBoardDrop(event) {
        if (!isMinimalProjectBoardView()) return;
        const column = event.target.closest(".board-column[data-status]");
        if (!column) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        clearMinimalDragState();
        const id = Number(event.dataTransfer.getData("text/plain"));
        await moveTaskToStatus(id, column.dataset.status);
    }

    async function moveTaskToStatus(id, status) {
        const task = state.tasksPage.content.find((item) => item.id === id);
        if (!id || !status || !task || task.status === status) return;
        try {
            await api(`/tasks/${id}/status?status=${status}`, { method: "PATCH" });
            state.selectedTaskId = id;
            await refreshAllData();
            showNotice(`Задача перенесена: ${statusLabel(status)}.`, "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    function isMinimalProjectBoardView() {
        return document.body.dataset.view === "projects" || document.body.dataset.view === "overview";
    }

    function clearMinimalDragState() {
        document.querySelectorAll(".is-drop-target, .is-dragging").forEach((item) => {
            item.classList.remove("is-drop-target", "is-dragging");
        });
    }

    function minimalFilterButton(filter, label, count) {
        return `<button type="button" class="minimal-chip ${state.minimalFilter === filter ? "active" : ""}" data-minimal-filter="${filter}">${label}<span>${count}</span></button>`;
    }

    function filterMinimalTasks(tasks) {
        const search = String(state.quickSearch || "").trim().toLowerCase();
        return tasks.filter((task) => {
            const matchesSearch = !search || [
                task.title,
                task.description,
                task.taskListName,
                task.assigneeEmail,
                ...(task.tags || []).map((tag) => tag.name)
            ].filter(Boolean).join(" ").toLowerCase().includes(search);
            if (!matchesSearch) return false;
            if (state.minimalFilter === "today") return task.dueDate === agendaIsoDate();
            if (state.minimalFilter === "overdue") return isOverdue(task);
            if (state.minimalFilter === "important") return task.priority === "HIGH";
            return true;
        });
    }

    function renderMinimalEmpty(status) {
        const text = status === "TODO" ? "Создать первую задачу" : "Перетащи задачу сюда";
        return `
            <button type="button" class="board-empty board-empty-cta minimal-empty" data-action="focus-new-task" data-status="${status}">
                <span class="empty-icon">📋</span>
                <strong>${text}</strong>
                <small>${status === "TODO" ? "Добавь карточку и начни работу." : "Так задача сменит статус."}</small>
            </button>
        `;
    }

    function getMinimalAttention(task) {
        if (isOverdue(task)) return "attention-overdue";
        if (task.dueDate === agendaIsoDate() && task.status !== "DONE") return "attention-today";
        return "";
    }

    function isOverdue(task) {
        return task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE";
    }
})();
