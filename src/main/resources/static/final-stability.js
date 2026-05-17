(function () {
    "use strict";

    const SIDEBAR_STATE_KEY = "todo-lab-sidebar-state-v3";
    const VIEW_KEY = "todo-lab-my-tasks-view";
    const TAG_FILTER_KEY = "todo-lab-tag-filter";
    const VALID_SIDEBAR_STATES = ["expanded", "collapsed", "hidden"];

    state.finalTagFilter = window.localStorage.getItem(TAG_FILTER_KEY) || "";
    state.myTasksView = window.localStorage.getItem(VIEW_KEY) || state.myTasksView || "list";

    const navItems = [
        {
            view: "overview",
            href: "#dashboardSection",
            label: "Dashboard",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z"/></svg>'
        },
        {
            view: "tasks",
            href: "#tasksSection",
            label: "Мои задачи",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5 7 8.5 11 4.5 12.4 5.9 7 11.3 3.6 7.9 5 6.5Zm9 .5h7v2h-7V7ZM5 15.5l2 2 4-4 1.4 1.4L7 20.3l-3.4-3.4L5 15.5Zm9 .5h7v2h-7v-2Z"/></svg>'
        },
        {
            view: "projects",
            href: "#projectsSection",
            label: "Проекты",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4h4c.8 0 1.5.7 1.5 1.5V10H4V5.5ZM4 12h7v6.5c0 .8-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.7-1.5-1.5V12Zm9-6.5c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.7-1.5-1.5v-4Zm0 8c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5v5c0 .8-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.7-1.5-1.5v-5Z"/></svg>'
        }
    ];

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootFinalStability);
    } else {
        bootFinalStability();
    }

    function bootFinalStability() {
        document.body.classList.add("final-stability");
        wrapFinalRenderers();
        installFinalEvents();
        applySidebarState(readSidebarState());
        runFinalEnhancements();
        if (state.me) {
            renderApp();
        }
    }

    function wrapFinalRenderers() {
        if (typeof renderApp === "function" && !renderApp.__finalStabilityWrapped) {
            const originalRenderApp = renderApp;
            renderApp = function () {
                originalRenderApp();
                runFinalEnhancements();
            };
            renderApp.__finalStabilityWrapped = true;
        }

        if (typeof refreshAllData === "function" && !refreshAllData.__finalStabilityWrapped) {
            const originalRefreshAllData = refreshAllData;
            refreshAllData = async function () {
                const viewBefore = document.body.dataset.view || "overview";
                await originalRefreshAllData();
                if (viewBefore && document.body.dataset.view !== viewBefore && typeof setActiveView === "function") {
                    setActiveView(viewBefore);
                }
                runFinalEnhancements();
            };
            refreshAllData.__finalStabilityWrapped = true;
        }

        if (typeof setActiveView === "function" && !setActiveView.__finalStabilityWrapped) {
            const originalSetActiveView = setActiveView;
            setActiveView = function (view) {
                originalSetActiveView(view);
                runFinalEnhancements();
            };
            setActiveView.__finalStabilityWrapped = true;
        }

        renderMyTasks = renderFinalMyTasks;
        renderBoardTaskCard = renderFinalBoardTaskCard;
    }

    function installFinalEvents() {
        document.addEventListener("click", handleFinalClick, true);
        document.addEventListener("change", handleFinalChange, true);
        document.addEventListener("submit", handleFinalSubmit, true);
        document.addEventListener("dragstart", handleFinalDragStart, true);
        document.addEventListener("dragover", handleFinalDragOver, true);
        document.addEventListener("dragleave", handleFinalDragLeave, true);
        document.addEventListener("drop", handleFinalDrop, true);
        document.addEventListener("dragend", clearFinalDragState, true);
    }

    function runFinalEnhancements() {
        normalizeLayout();
        repairSidebar();
        syncSidebarActive();
        renderDashboardTags();
        fixTopbarLabels();
        decorateTaskTagColors();
    }

    function normalizeLayout() {
        document.getElementById("filtersSection")?.setAttribute("hidden", "hidden");
        document.querySelectorAll(".sidebar-nav .nav-link").forEach((link) => {
            const view = link.dataset.view;
            if (view === "docs" || view === "settings" || view === "users" || link.getAttribute("href") === "#usersSection") {
                link.remove();
            }
        });
    }

    function repairSidebar() {
        const sidebar = document.querySelector(".sidebar");
        const nav = sidebar?.querySelector(".sidebar-nav");
        if (!sidebar || !nav) return;

        nav.innerHTML = navItems.map((item) => `
            <a href="${item.href}" class="nav-link final-nav-link" data-view="${item.view}" title="${item.label}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </a>
        `).join("");

        let toggle = sidebar.querySelector("[data-final-sidebar-toggle]");
        if (!toggle) {
            toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "sidebar-collapse-button final-sidebar-toggle";
            toggle.dataset.finalSidebarToggle = "true";
            (sidebar.querySelector(".brand-card") || sidebar.querySelector(".sidebar-top") || sidebar).appendChild(toggle);
        }

        const current = readSidebarState();
        toggle.title = current === "expanded"
            ? "Свернуть меню до иконок"
            : current === "collapsed"
                ? "Скрыть меню полностью"
                : "Открыть меню";
        toggle.textContent = current === "expanded" ? "‹" : current === "collapsed" ? "×" : "☰";

        let restore = document.querySelector("[data-final-sidebar-restore]");
        if (!restore) {
            restore = document.createElement("button");
            restore.type = "button";
            restore.className = "sidebar-restore-button";
            restore.dataset.finalSidebarRestore = "true";
            restore.textContent = "Меню";
            restore.title = "Показать левое меню";
            document.body.appendChild(restore);
        }

        repairProjectList();
    }

    function repairProjectList() {
        const list = document.getElementById("projectList");
        if (!list) return;

        list.querySelectorAll(".list-card, .project-list-card").forEach((card) => {
            const id = Number(card.dataset.id);
            const project = state.projects.find((item) => Number(item.id) === id);
            const title = project?.name || card.querySelector(".card-title")?.textContent?.trim() || "Проект";
            const taskCount = countProjectTasks(id);
            const doneCount = countProjectDoneTasks(id);
            const progress = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

            card.classList.add("final-project-pill");
            card.title = `${title}: ${doneCount}/${taskCount} задач`;
            card.dataset.tooltip = card.title;
            card.dataset.initial = getInitials(title);
            card.style.setProperty("--project-progress", `${progress}%`);
            card.innerHTML = `
                <span class="project-pill-title">${escapeSafe(title)}</span>
                <span class="project-pill-meta">${taskCount} задач · ${progress}%</span>
            `;
            card.classList.toggle("active", Number(state.selectedProjectId) === id);
        });
    }

    function syncSidebarActive() {
        const view = document.body.dataset.view || "overview";
        document.querySelectorAll(".sidebar-nav .nav-link[data-view]").forEach((link) => {
            link.classList.toggle("active", link.dataset.view === view);
        });
        repairProjectList();
    }

    function readSidebarState() {
        const saved = window.localStorage.getItem(SIDEBAR_STATE_KEY);
        if (VALID_SIDEBAR_STATES.includes(saved)) return saved;
        if (window.localStorage.getItem("todo-lab-sidebar-collapsed") === "true") return "collapsed";
        return "expanded";
    }

    function writeSidebarState(value) {
        const next = VALID_SIDEBAR_STATES.includes(value) ? value : "expanded";
        window.localStorage.setItem(SIDEBAR_STATE_KEY, next);
        window.localStorage.setItem("todo-lab-sidebar-collapsed", String(next === "collapsed"));
        applySidebarState(next);
    }

    function applySidebarState(value) {
        const stateName = VALID_SIDEBAR_STATES.includes(value) ? value : "expanded";
        document.body.dataset.sidebarState = stateName;
        document.body.classList.toggle("sidebar-collapsed", stateName === "collapsed");
        document.body.classList.toggle("sidebar-hidden", stateName === "hidden");
        document.body.classList.toggle("sidebar-expanded", stateName === "expanded");
    }

    function nextSidebarState() {
        const current = readSidebarState();
        if (current === "expanded") return "collapsed";
        if (current === "collapsed") return "hidden";
        return "expanded";
    }

    function handleFinalClick(event) {
        const restore = event.target.closest("[data-final-sidebar-restore]");
        if (restore) {
            event.preventDefault();
            event.stopImmediatePropagation();
            writeSidebarState("expanded");
            runFinalEnhancements();
            return;
        }

        const toggle = event.target.closest("[data-final-sidebar-toggle]");
        if (toggle) {
            event.preventDefault();
            event.stopImmediatePropagation();
            writeSidebarState(nextSidebarState());
            runFinalEnhancements();
            return;
        }

        const navLink = event.target.closest(".sidebar-nav .nav-link[data-view]");
        if (navLink) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setActiveView(navLink.dataset.view);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const finalButton = event.target.closest("[data-final-action]");
        if (finalButton) {
            const action = finalButton.dataset.finalAction;
            if (action === "set-my-view") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.myTasksView = finalButton.dataset.view || "list";
                window.localStorage.setItem(VIEW_KEY, state.myTasksView);
                renderTasks();
                return;
            }
            if (action === "set-final-filter") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.smartQuickFilter = finalButton.dataset.filter || "all";
                state.finalTagFilter = "";
                window.localStorage.removeItem(TAG_FILTER_KEY);
                renderTasks();
                return;
            }
            if (action === "filter-tag") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.finalTagFilter = finalButton.dataset.tagId || "";
                window.localStorage.setItem(TAG_FILTER_KEY, state.finalTagFilter);
                setActiveView("tasks");
                renderTasks();
                return;
            }
            if (action === "clear-tag-filter") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.finalTagFilter = "";
                window.localStorage.removeItem(TAG_FILTER_KEY);
                renderTasks();
                return;
            }
            if (action === "focus-quick-task") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.quickTaskGroupId = finalButton.dataset.group || "today";
                state.quickTaskDueDate = finalButton.dataset.due || "";
                renderTasks();
                requestAnimationFrame(() => document.querySelector(`[data-final-quick-input="${state.quickTaskGroupId}"]`)?.focus());
                return;
            }
            if (action === "cancel-quick-task") {
                event.preventDefault();
                event.stopImmediatePropagation();
                state.quickTaskGroupId = "";
                state.quickTaskDueDate = "";
                renderTasks();
                return;
            }
            if (action === "toggle-complete") {
                event.preventDefault();
                event.stopImmediatePropagation();
                toggleTaskDone(Number(finalButton.dataset.id), finalButton.closest(".task-card, .final-task-card"));
                return;
            }
        }
    }

    async function handleFinalSubmit(event) {
        const form = event.target.closest("[data-final-quick-task-form]");
        if (!form) return;
        event.preventDefault();
        event.stopImmediatePropagation();

        const formData = new FormData(form);
        const title = String(formData.get("title") || "").trim();
        if (!title) {
            form.querySelector("input[name='title']")?.focus();
            showNotice("Введите название задачи.", "error");
            return;
        }

        try {
            const taskListId = await ensureTaskListForCurrentProject();
            if (!taskListId) {
                showNotice("Сначала создайте или выберите проект.", "error");
                return;
            }
            const created = await api("/tasks", {
                method: "POST",
                body: {
                    title,
                    description: String(formData.get("description") || "").trim() || null,
                    status: form.dataset.status || "TODO",
                    priority: String(formData.get("priority") || state.defaultTaskPriority || "MEDIUM"),
                    dueDate: form.dataset.due || null,
                    assigneeId: state.me?.id || null,
                    taskListId,
                    tagIds: []
                }
            });
            makeCreatedTaskVisible(created);
            state.quickTaskGroupId = form.dataset.group || "";
            await refreshAllData();
            showNotice("Задача создана.", "success");
            requestAnimationFrame(() => document.querySelector(`[data-final-quick-input="${state.quickTaskGroupId}"]`)?.focus());
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    async function handleFinalChange(event) {
        const dueInput = event.target.closest("[data-final-task-due]");
        if (!dueInput) return;
        event.stopImmediatePropagation();

        const task = findFinalTask(Number(dueInput.dataset.finalTaskDue));
        if (!task) return;
        try {
            await updateFinalTask(task, { dueDate: dueInput.value || null });
            showNotice("Срок задачи обновлен.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    function handleFinalDragStart(event) {
        const card = event.target.closest(".final-agenda-card[data-id]");
        if (!card || document.body.dataset.view !== "tasks") return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.id);
        card.classList.add("is-dragging");
    }

    function handleFinalDragOver(event) {
        const group = event.target.closest(".final-day-column[data-date]");
        if (!group || document.body.dataset.view !== "tasks") return;
        event.preventDefault();
        group.classList.add("is-date-drop-target");
    }

    function handleFinalDragLeave(event) {
        const group = event.target.closest(".final-day-column[data-date]");
        if (!group || group.contains(event.relatedTarget)) return;
        group.classList.remove("is-date-drop-target");
    }

    async function handleFinalDrop(event) {
        const group = event.target.closest(".final-day-column[data-date]");
        if (!group || document.body.dataset.view !== "tasks") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const task = findFinalTask(Number(event.dataTransfer.getData("text/plain")));
        clearFinalDragState();
        if (!task) return;
        try {
            await updateFinalTask(task, { dueDate: group.dataset.date || null });
            showNotice("Срок задачи изменен.", "success");
        } catch (error) {
            showNotice(error.message, "error");
        }
    }

    function clearFinalDragState() {
        document.querySelectorAll(".is-date-drop-target, .is-dragging").forEach((node) => {
            node.classList.remove("is-date-drop-target", "is-dragging");
        });
    }

    function renderFinalMyTasks() {
        const baseTasks = state.showCompletedTasks
            ? state.tasksPage.content || []
            : (state.tasksPage.content || []).filter((task) => task.status !== "DONE");
        const tasks = filterFinalTasks(baseTasks);
        const today = agendaIsoDate();
        const tomorrow = agendaIsoDate(1);
        const todayAll = baseTasks.filter((task) => task.dueDate === today);
        const todayDone = todayAll.filter((task) => task.status === "DONE").length;
        const todayProgress = todayAll.length ? Math.round((todayDone / todayAll.length) * 100) : 0;

        elements.taskMeta.innerHTML = `
            <div class="final-task-toolbar">
                <div class="final-focus-note">Фокус: важные и сегодняшние задачи подсвечены.</div>
                <div class="quick-filter-row">
                    ${finalFilterButton("all", "Все", baseTasks.length)}
                    ${finalFilterButton("today", "Сегодня", baseTasks.filter((task) => task.dueDate === today).length)}
                    ${finalFilterButton("overdue", "Просрочено", baseTasks.filter((task) => isFinalOverdue(task)).length)}
                    ${finalFilterButton("no-date", "Без срока", baseTasks.filter((task) => !task.dueDate).length)}
                    ${finalFilterButton("important", "Важные", baseTasks.filter((task) => task.priority === "HIGH").length)}
                    ${state.finalTagFilter ? `<button type="button" class="quick-filter-chip active" data-final-action="clear-tag-filter">Метка: ${escapeSafe(getTagName(state.finalTagFilter))}<span>×</span></button>` : ""}
                </div>
                <div class="day-progress-card compact-progress-card">
                    <strong>Сегодня выполнено: ${todayDone} / ${todayAll.length}</strong>
                    <div class="progress-bar"><span style="width:${todayProgress}%"></span></div>
                </div>
                <div class="view-switcher">
                    <button type="button" class="${state.myTasksView === "list" ? "active" : ""}" data-final-action="set-my-view" data-view="list">Список</button>
                    <button type="button" class="${state.myTasksView === "kanban" ? "active" : ""}" data-final-action="set-my-view" data-view="kanban">Канбан</button>
                </div>
            </div>
        `;

        if (state.myTasksView === "kanban") {
            elements.taskBoard.innerHTML = renderFinalPersonalKanban(tasks);
            return;
        }

        const groups = buildFinalDayGroups(tasks);
        elements.taskBoard.innerHTML = `
            <section class="final-my-tasks">
                <div class="final-section-header">
                    <div>
                        <p class="section-tag">Мои задачи</p>
                        <h2>План по дням</h2>
                        <p>Компактная недельная доска: перетаскивай задачи между группами, меняй срок и закрывай чекбоксом.</p>
                    </div>
                </div>
                <div class="final-day-grid">
                    ${groups.map(renderFinalDayGroup).join("")}
                </div>
            </section>
        `;
    }

    function renderFinalPersonalKanban(tasks) {
        const columns = [
            { status: "TODO", title: "К выполнению", tone: "todo" },
            { status: "IN_PROGRESS", title: "В работе", tone: "progress" },
            { status: "DONE", title: "Готово", tone: "done" }
        ];

        return `
            <section class="final-my-tasks">
                <div class="final-section-header">
                    <div>
                        <p class="section-tag">Мои задачи</p>
                        <h2>Канбан личных задач</h2>
                        <p>Тот же список, но сгруппированный по статусу.</p>
                    </div>
                </div>
                <div class="task-board-kanban final-kanban">
                    ${columns.map((column) => {
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
                                    ${columnTasks.length ? columnTasks.map(renderFinalBoardTaskCard).join("") : renderCompactEmpty(column.status)}
                                </div>
                            </section>
                        `;
                    }).join("")}
                </div>
            </section>
        `;
    }

    function buildFinalDayGroups(tasks) {
        const today = agendaIsoDate();
        const tomorrow = agendaIsoDate(1);
        const weekEnd = agendaIsoDate(7);
        return [
            { id: "today", title: "Сегодня", date: today, tone: "today", tasks: tasks.filter((task) => task.dueDate === today && task.status !== "DONE") },
            { id: "tomorrow", title: "Завтра", date: tomorrow, tone: "tomorrow", tasks: tasks.filter((task) => task.dueDate === tomorrow && task.status !== "DONE") },
            { id: "week", title: "Неделя", date: weekEnd, tone: "week", tasks: tasks.filter((task) => task.dueDate && task.dueDate > tomorrow && task.dueDate <= weekEnd && task.status !== "DONE") },
            { id: "no-date", title: "Без срока", date: "", tone: "muted", tasks: tasks.filter((task) => !task.dueDate && task.status !== "DONE") },
            { id: "overdue", title: "Просрочено", date: today, tone: "danger", tasks: tasks.filter((task) => isFinalOverdue(task)) },
            { id: "done", title: "Готово", date: "", tone: "done", tasks: (state.tasksPage.content || []).filter((task) => task.status === "DONE").slice(0, 8) }
        ];
    }

    function renderFinalDayGroup(group) {
        return `
            <section class="final-day-column final-day-${group.tone}" data-date="${group.date}">
                <header class="final-day-head">
                    <div>
                        <h3>${group.title}</h3>
                        <span>${group.tasks.length} задач</span>
                    </div>
                    <button type="button" data-final-action="focus-quick-task" data-group="${group.id}" data-due="${group.date}" title="Создать задачу">+</button>
                </header>
                ${state.quickTaskGroupId === group.id ? renderFinalQuickTaskForm(group) : ""}
                <div class="final-day-stack">
                    ${group.tasks.length ? group.tasks.map(renderFinalAgendaCard).join("") : `
                        <button type="button" class="final-empty-mini" data-final-action="focus-quick-task" data-group="${group.id}" data-due="${group.date}">
                            <span>📋</span>
                            <strong>Нет задач</strong>
                            <small>Создать задачу</small>
                        </button>
                    `}
                </div>
            </section>
        `;
    }

    function renderFinalQuickTaskForm(group) {
        const status = group.id === "done" ? "DONE" : "TODO";
        return `
            <form class="final-quick-task-form" data-final-quick-task-form data-group="${group.id}" data-due="${group.date}" data-status="${status}">
                <input name="title" data-final-quick-input="${group.id}" autocomplete="off" placeholder="Название задачи" required>
                <input name="description" autocomplete="off" placeholder="Короткое описание">
                <select name="priority">
                    <option value="MEDIUM">Средний</option>
                    <option value="HIGH">Высокий</option>
                    <option value="LOW">Низкий</option>
                </select>
                <div>
                    <button type="submit" class="primary-button">Создать</button>
                    <button type="button" class="ghost-button" data-final-action="cancel-quick-task">Отмена</button>
                </div>
            </form>
        `;
    }

    function renderFinalAgendaCard(task) {
        const done = task.status === "DONE";
        return `
            <article class="final-agenda-card task-card ${done ? "is-done" : ""} ${isFinalOverdue(task) ? "attention-overdue" : ""}" data-id="${task.id}" draggable="true">
                <button type="button" class="task-done-toggle" data-final-action="toggle-complete" data-id="${task.id}" title="${done ? "Вернуть в работу" : "Выполнено"}">${done ? "✓" : ""}</button>
                <div class="final-task-body">
                    <div class="final-task-title-row">
                        <h3>${escapeSafe(task.title)}</h3>
                        <span class="task-id">#${task.id}</span>
                    </div>
                    ${task.description ? `<p>${escapeSafe(task.description)}</p>` : ""}
                    <div class="final-task-meta">
                        <span>${escapeSafe(agendaProjectName(task))}</span>
                        <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                        <span class="priority-label priority-${task.priority}">${priorityLabel(task.priority)}</span>
                        <span class="due-label ${isFinalOverdue(task) ? "danger" : task.dueDate === agendaIsoDate() ? "today" : ""}">${escapeSafe(agendaDateLabel(task.dueDate))}</span>
                        ${task.assigneeEmail ? `<span>${escapeSafe(task.assigneeEmail)}</span>` : ""}
                    </div>
                    ${renderTagPills(task, true)}
                </div>
                <input class="row-date-input" type="date" value="${escapeSafe(task.dueDate || "")}" data-final-task-due="${task.id}" title="Срок">
            </article>
        `;
    }

    function renderFinalBoardTaskCard(task) {
        const done = task.status === "DONE";
        return `
            <article class="task-card clean-task-card minimal-task-card final-board-task-card ${done ? "is-done" : ""} ${isFinalOverdue(task) ? "attention-overdue" : ""} ${task.id === state.selectedTaskId ? "active" : ""}" data-id="${task.id}" draggable="true" tabindex="0">
                <div class="minimal-card-top">
                    <span class="task-id">#${task.id}</span>
                    <button type="button" class="minimal-menu-button" data-action="select-task" data-id="${task.id}" title="Открыть">⋯</button>
                </div>
                <h3 class="card-title">${escapeSafe(task.title)}</h3>
                ${task.description ? `<p class="minimal-card-description">${escapeSafe(task.description)}</p>` : ""}
                <div class="minimal-card-meta">
                    <span class="status-label status-${task.status}">${statusLabel(task.status)}</span>
                    <span class="priority-label priority-${task.priority}">${priorityLabel(task.priority)}</span>
                    ${task.dueDate ? `<span class="due-label ${isFinalOverdue(task) ? "danger" : task.dueDate === agendaIsoDate() ? "today" : ""}">${escapeSafe(agendaDateLabel(task.dueDate))}</span>` : `<span class="due-label">Без срока</span>`}
                </div>
                ${renderTagPills(task, false)}
                ${task.assigneeEmail ? `<small class="task-assignee">${escapeSafe(task.assigneeEmail)}</small>` : ""}
                <div class="task-card-actions minimal-card-actions">
                    <button type="button" class="ghost-button" data-action="select-task" data-id="${task.id}">Открыть</button>
                    <button type="button" class="ghost-button" data-action="set-status" data-id="${task.id}" data-status="${done ? "TODO" : "DONE"}">${done ? "Вернуть" : "Готово"}</button>
                    <button type="button" class="danger-button" data-action="delete-task" data-id="${task.id}">Удалить</button>
                </div>
            </article>
        `;
    }

    function renderCompactEmpty(status) {
        return `
            <button type="button" class="board-empty board-empty-cta minimal-empty final-compact-empty" data-action="focus-new-task" data-status="${status}">
                <span class="empty-icon">📋</span>
                <strong>${status === "TODO" ? "Создать задачу" : "Перетащи сюда"}</strong>
            </button>
        `;
    }

    function renderDashboardTags() {
        const section = document.getElementById("dashboardSection");
        if (!section || section.classList.contains("hidden") || !state.me) return;

        let card = section.querySelector("[data-final-dashboard-tags]");
        const html = buildDashboardTagsHtml();

        if (!card) {
            card = document.createElement("article");
            card.className = "dashboard-card final-tags-card";
            card.dataset.finalDashboardTags = "true";
            const grid = section.querySelector(".dashboard-grid.two-columns") || section.querySelector(".dashboard-grid") || section;
            grid.appendChild(card);
        }
        card.innerHTML = html;
    }

    function buildDashboardTagsHtml() {
        const tagStats = (state.tags || []).map((tag) => ({
            tag,
            count: (state.tasksPage.content || []).filter((task) => taskHasTag(task, tag.id)).length
        })).filter((item) => item.count > 0);

        if (!tagStats.length) {
            return `
                <h3>Метки</h3>
                <div class="final-tags-empty">Меток пока нет.</div>
            `;
        }

        return `
            <h3>Метки</h3>
            <div class="final-tag-cloud">
                ${tagStats.map(({ tag, count }) => `
                    <button type="button" class="tag-pill clickable-tag" style="--tag-color:${escapeSafe(normalizeColor(tag.color) || tag.color || "#FFCC33")}" data-final-action="filter-tag" data-tag-id="${tag.id}">
                        ${escapeSafe(tag.name)} <span>${count}</span>
                    </button>
                `).join("")}
            </div>
        `;
    }

    function renderTagPills(task, clickable) {
        const tags = getTaskTags(task);
        if (!tags.length) return "";
        return `
            <div class="final-task-tags">
                ${tags.map((tag) => `
                    <${clickable ? "button" : "span"} ${clickable ? 'type="button" data-final-action="filter-tag"' : ""} class="tag-pill ${clickable ? "clickable-tag" : ""}" data-tag-id="${tag.id}" style="--tag-color:${escapeSafe(normalizeColor(tag.color) || tag.color || "#FFCC33")}">
                        ${escapeSafe(tag.name)}
                    </${clickable ? "button" : "span"}>
                `).join("")}
            </div>
        `;
    }

    function decorateTaskTagColors() {
        document.querySelectorAll(".tag-pill").forEach((pill) => {
            const tagId = pill.dataset.tagId;
            const tag = tagId ? state.tags.find((item) => String(item.id) === String(tagId)) : null;
            if (tag) {
                pill.style.setProperty("--tag-color", normalizeColor(tag.color) || tag.color || "#FFCC33");
            }
        });
    }

    function filterFinalTasks(tasks) {
        const search = String(state.quickSearch || "").trim().toLowerCase();
        return tasks.filter((task) => {
            if (state.finalTagFilter && !taskHasTag(task, state.finalTagFilter)) return false;
            if (state.smartQuickFilter === "today" && task.dueDate !== agendaIsoDate()) return false;
            if (state.smartQuickFilter === "overdue" && !isFinalOverdue(task)) return false;
            if (state.smartQuickFilter === "no-date" && task.dueDate) return false;
            if (state.smartQuickFilter === "important" && task.priority !== "HIGH") return false;
            if (!search) return true;
            const haystack = [
                task.title,
                task.description,
                task.assigneeEmail,
                agendaProjectName(task),
                task.taskListName,
                ...getTaskTags(task).map((tag) => tag.name)
            ].filter(Boolean).join(" ").toLowerCase();
            return haystack.includes(search);
        });
    }

    function finalFilterButton(filter, label, count) {
        const active = !state.finalTagFilter && (state.smartQuickFilter || "all") === filter;
        return `<button type="button" class="quick-filter-chip ${active ? "active" : ""}" data-final-action="set-final-filter" data-filter="${filter}">${label}<span>${count}</span></button>`;
    }

    function fixTopbarLabels() {
        const labels = {
            overview: "Dashboard",
            tasks: "Мои задачи",
            projects: "Проекты",
            docs: "Документы",
            settings: "Настройки"
        };
        document.querySelectorAll(".product-tab[data-view]").forEach((button) => {
            button.textContent = labels[button.dataset.view] || button.textContent;
        });
    }

    async function toggleTaskDone(id, visualElement) {
        const task = findFinalTask(id);
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

    async function updateFinalTask(task, patch) {
        const payload = {
            title: patch.title ?? task.title,
            description: patch.description ?? task.description ?? null,
            status: patch.status ?? task.status,
            priority: patch.priority ?? task.priority,
            dueDate: Object.prototype.hasOwnProperty.call(patch, "dueDate") ? patch.dueDate : (task.dueDate || null),
            assigneeId: Object.prototype.hasOwnProperty.call(patch, "assigneeId") ? patch.assigneeId : (task.assigneeId || null),
            taskListId: patch.taskListId ?? task.taskListId,
            tagIds: patch.tagIds ?? getTaskTags(task).map((tag) => tag.id)
        };
        const updated = await api(`/tasks/${task.id}`, { method: "PUT", body: payload });
        state.selectedTaskId = updated.id;
        await refreshAllData();
        return updated;
    }

    function findFinalTask(id) {
        return (state.tasksPage.content || []).find((task) => Number(task.id) === Number(id));
    }

    function getTaskTags(task) {
        if (Array.isArray(task.tags) && task.tags.length && typeof task.tags[0] === "object") {
            return task.tags;
        }
        const ids = new Set([
            ...(task.tagIds || []),
            ...(task.tags || []).filter((item) => typeof item !== "object")
        ].map(String));
        return (state.tags || []).filter((tag) => ids.has(String(tag.id)));
    }

    function taskHasTag(task, tagId) {
        return getTaskTags(task).some((tag) => String(tag.id) === String(tagId));
    }

    function getTagName(tagId) {
        return state.tags.find((tag) => String(tag.id) === String(tagId))?.name || "тег";
    }

    function countProjectTasks(projectId) {
        const listIds = new Set((state.taskLists || []).filter((list) => Number(list.projectId) === Number(projectId)).map((list) => Number(list.id)));
        return (state.tasksPage.content || []).filter((task) => listIds.has(Number(task.taskListId))).length;
    }

    function countProjectDoneTasks(projectId) {
        const listIds = new Set((state.taskLists || []).filter((list) => Number(list.projectId) === Number(projectId)).map((list) => Number(list.id)));
        return (state.tasksPage.content || []).filter((task) => listIds.has(Number(task.taskListId)) && task.status === "DONE").length;
    }

    function isFinalOverdue(task) {
        return Boolean(task.dueDate && task.dueDate < agendaIsoDate() && task.status !== "DONE");
    }

    function getInitials(value) {
        return String(value || "P").trim().slice(0, 2).toUpperCase();
    }

    function escapeSafe(value) {
        if (typeof escapeHtml === "function") return escapeHtml(value);
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }
})();
