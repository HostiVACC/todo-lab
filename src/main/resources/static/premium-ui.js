(function () {
    "use strict";

    const STORAGE_KEY = "todo-lab-sidebar-collapsed";
    const SETTINGS_TAB_KEY = "todo-lab-settings-tab";
    const NOTES_KEY = "todo-lab-notes";
    const SIDEBAR_NAV_VERSION = "20260514-repaired-sidebar";
    const SIDEBAR_NAV_ITEMS = [
        {
            view: "overview",
            href: "#dashboardSection",
            label: "Dashboard",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h7V4H4v9zm0 7h7v-5H4v5zm9 0h7v-9h-7v9zm0-16v5h7V4h-7z"/></svg>'
        },
        {
            view: "tasks",
            href: "#tasksSection",
            label: "Мои задачи",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 1H9V4h12v2zM7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 1H9v-2h12v2zM7 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 1H9v-2h12v2z"/></svg>'
        },
        {
            view: "projects",
            href: "#projectsSection",
            label: "Проекты",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5V8H4V5.5zm0 5h7v9.5A1.5 1.5 0 0 1 9.5 21h-4A1.5 1.5 0 0 1 4 19.5v-9zm9-5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4A1.5 1.5 0 0 1 18.5 11h-4A1.5 1.5 0 0 1 13 9.5v-4zm0 8A1.5 1.5 0 0 1 14.5 12h4A1.5 1.5 0 0 1 20 13.5v6A1.5 1.5 0 0 1 18.5 21h-4a1.5 1.5 0 0 1-1.5-1.5v-6z"/></svg>'
        },
        {
            view: "docs",
            href: "#docsSection",
            label: "Документы",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6V2zm7 1.5V7h3.5L13 3.5zM8 11h8V9.5H8V11zm0 4h8v-1.5H8V15zm0 4h6v-1.5H8V19z"/></svg>'
        },
        {
            view: "settings",
            href: "#settingsSection",
            label: "Настройки",
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A8 8 0 0 0 7 6L4.6 5l-2 3.5 2 1.5A8.8 8.8 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5L10 22h4l.4-2.5A8 8 0 0 0 17 18l2.4 1 2-3.5-2-1.5zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"/></svg>'
        }
    ];

    document.addEventListener("DOMContentLoaded", () => {
        document.body.classList.add("premium-ui");
        restoreSidebarState();
        enhanceSidebar();
        enhanceButtonFeedback();
        enhanceGlobalInteractions();
        wrapRenderCycle();
        requestAnimationFrame(enhanceCurrentScreen);
    });

    function wrapRenderCycle() {
        if (typeof renderApp === "function" && !renderApp.__premiumWrapped) {
            const originalRenderApp = renderApp;
            renderApp = function () {
                originalRenderApp();
                enhanceCurrentScreen();
            };
            renderApp.__premiumWrapped = true;
        }

        if (typeof refreshAllData === "function" && !refreshAllData.__premiumWrapped) {
            const originalRefreshAllData = refreshAllData;
            refreshAllData = async function () {
                await originalRefreshAllData();
                enhanceCurrentScreen();
            };
            refreshAllData.__premiumWrapped = true;
        }

        if (typeof setActiveView === "function" && !setActiveView.__premiumWrappedByPremium) {
            const originalSetActiveView = setActiveView;
            setActiveView = function (view) {
                originalSetActiveView(view);
                requestAnimationFrame(syncPremiumSidebarActive);
            };
            setActiveView.__premiumWrappedByPremium = true;
        }
    }

    function enhanceCurrentScreen() {
        document.body.classList.add("premium-ui");
        enhanceSidebar();
        decorateTaskCards();
        decorateProjectPills();
        enhanceDashboard();
        enhanceSettingsTabs();
        enhanceDocsExperience();
        enhanceTaskEditGuard();
        enhanceEmptyStates();
    }

    function restoreSidebarState() {
        document.body.classList.toggle("sidebar-collapsed", localStorage.getItem(STORAGE_KEY) === "true");
    }

    function enhanceSidebar() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        ensureSidebarNavigation(sidebar);

        sidebar.querySelectorAll(".nav-link").forEach((link) => {
            const label = link.textContent.trim().replace(/\s+/g, " ");
            if (label) {
                link.dataset.tooltip = label;
                link.title = label;
            }
        });

        if (sidebar.querySelector("[data-premium-sidebar-toggle]")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "sidebar-collapse-button";
        button.dataset.premiumSidebarToggle = "true";
        button.title = "Свернуть меню";
        button.textContent = document.body.classList.contains("sidebar-collapsed") ? ">" : "<";
        button.addEventListener("click", () => {
            const collapsed = !document.body.classList.contains("sidebar-collapsed");
            document.body.classList.toggle("sidebar-collapsed", collapsed);
            localStorage.setItem(STORAGE_KEY, String(collapsed));
            button.textContent = collapsed ? ">" : "<";
        });

        const brand = sidebar.querySelector(".brand-card") || sidebar.firstElementChild;
        if (brand) {
            brand.appendChild(button);
        } else {
            sidebar.prepend(button);
        }
    }

    function ensureSidebarNavigation(sidebar) {
        const nav = sidebar.querySelector(".sidebar-nav");
        if (!nav) return;

        if (nav.dataset.version !== SIDEBAR_NAV_VERSION) {
            nav.innerHTML = SIDEBAR_NAV_ITEMS.map((item) => `
                <a href="${item.href}" class="nav-link" data-view="${item.view}">
                    <span class="nav-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `).join("");
            nav.dataset.version = SIDEBAR_NAV_VERSION;
        }

        if (!nav.dataset.premiumBound) {
            nav.addEventListener("click", handlePremiumSidebarNavigation, true);
            nav.dataset.premiumBound = "true";
        }

        syncPremiumSidebarActive();
    }

    function handlePremiumSidebarNavigation(event) {
        const link = event.target.closest(".nav-link[data-view]");
        if (!link) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (typeof setActiveView === "function") {
            setActiveView(link.dataset.view);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        requestAnimationFrame(syncPremiumSidebarActive);
    }

    function syncPremiumSidebarActive() {
        const view = document.body.dataset.view || (typeof activeView !== "undefined" ? activeView : "overview");
        document.querySelectorAll(".sidebar-nav .nav-link[data-view]").forEach((link) => {
            link.classList.toggle("active", link.dataset.view === view);
        });
    }

    function decorateTaskCards() {
        if (!window.state || !Array.isArray(state.tasksPage?.content)) return;
        const byId = new Map(state.tasksPage.content.map((task) => [String(task.id), task]));

        document.querySelectorAll(".task-card[data-id], .agenda-row[data-id], .minimal-task-row[data-id]").forEach((card) => {
            const task = byId.get(String(card.dataset.id));
            if (!task) return;
            card.dataset.status = task.status || "";
            card.dataset.priority = task.priority || "";
            card.dataset.hasDue = task.dueDate ? "true" : "false";
            card.classList.toggle("is-overdue", Boolean(task.dueDate && task.dueDate < todayIso() && task.status !== "DONE"));
            card.classList.toggle("is-today", task.dueDate === todayIso());
        });
    }

    function decorateProjectPills() {
        if (!window.state || !Array.isArray(state.projects) || !Array.isArray(state.taskLists)) return;
        document.querySelectorAll(".sidebar-list .list-card[data-id], .project-list-card[data-id]").forEach((card) => {
            const projectId = Number(card.dataset.id);
            const project = state.projects.find((item) => item.id === projectId);
            const listIds = new Set(state.taskLists.filter((list) => list.projectId === projectId).map((list) => list.id));
            const tasks = (state.tasksPage?.content || []).filter((task) => listIds.has(task.taskListId));
            const done = tasks.filter((task) => task.status === "DONE").length;
            const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
            const title = project?.name || card.querySelector(".card-title")?.textContent?.trim() || "Проект";
            const initial = title.trim().slice(0, 2).toUpperCase();
            card.dataset.initial = initial;
            card.dataset.tooltip = `${title}: ${tasks.length ? `${done}/${tasks.length} задач, ${progress}%` : "0 задач"}`;
            card.title = card.dataset.tooltip;
            card.style.setProperty("--project-progress", String(progress));
            const titleNode = card.querySelector(".card-title");
            if (titleNode) {
                titleNode.dataset.initial = initial;
                titleNode.textContent = title;
            }
            const sidebarProject = card.closest("#projectList");
            if (sidebarProject && titleNode) {
                card.setAttribute("aria-label", title);
                card.dataset.projectTitle = title;
                card.querySelectorAll(".card-copy, .card-meta, .mini-chip, .button-row").forEach((node) => {
                    node.setAttribute("hidden", "hidden");
                });
                titleNode.removeAttribute("hidden");
            }
        });
    }

    function enhanceDashboard() {
        const section = document.getElementById("dashboardSection");
        if (!section || section.classList.contains("hidden") || section.querySelector(".premium-dashboard-grid")) return;
        if (!window.state || !Array.isArray(state.tasksPage?.content)) return;

        const tasks = state.tasksPage.content || [];
        const today = todayIso();
        const done = tasks.filter((task) => task.status === "DONE").length;
        const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        const upcoming = tasks
            .filter((task) => task.dueDate && task.status !== "DONE")
            .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
            .slice(0, 4);
        const recent = tasks
            .slice()
            .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
            .slice(0, 4);

        const grid = document.createElement("div");
        grid.className = "premium-dashboard-grid";
        grid.innerHTML = `
            <article class="premium-insight-card">
                <h3>Живой прогресс</h3>
                <div class="mini-chart" aria-label="Прогресс задач"><span style="width:${progress}%"></span></div>
                <div class="premium-insight-row"><strong>${done} из ${tasks.length}</strong><span>задач выполнено</span></div>
                <div class="premium-insight-row"><strong>${progress}%</strong><span>общий прогресс</span></div>
            </article>
            <article class="premium-insight-card">
                <h3>Ближайшие дедлайны</h3>
                <div class="premium-insight-list">
                    ${upcoming.length ? upcoming.map((task) => `
                        <div class="premium-insight-row">
                            <strong>${escapeSafe(task.title)}</strong>
                            <span>${formatDateLabel(task.dueDate, today)}</span>
                        </div>
                    `).join("") : `<div class="premium-insight-row"><strong>Свободно</strong><span>срочных дедлайнов нет</span></div>`}
                </div>
            </article>
            <article class="premium-insight-card">
                <h3>Последние изменения</h3>
                <div class="premium-insight-list">
                    ${recent.length ? recent.map((task) => `
                        <div class="premium-insight-row">
                            <strong>#${task.id}</strong>
                            <span>${escapeSafe(task.title)}</span>
                        </div>
                    `).join("") : `<div class="premium-insight-row"><strong>Пока пусто</strong><span>создай первую задачу</span></div>`}
                </div>
            </article>
        `;

        const anchor = section.querySelector(".dashboard-grid") || section.firstElementChild;
        if (anchor) {
            anchor.insertAdjacentElement("afterend", grid);
        } else {
            section.appendChild(grid);
        }
    }

    function enhanceEmptyStates() {
        document.querySelectorAll(".board-empty, .dashboard-empty, .docs-empty, .minimal-empty").forEach((empty) => {
            if (!empty.querySelector(".premium-empty-dot")) {
                const dot = document.createElement("span");
                dot.className = "premium-empty-dot";
                dot.textContent = "□";
                empty.prepend(dot);
            }
        });
    }

    function enhanceSettingsTabs() {
        const section = document.getElementById("settingsSection");
        const grid = section?.querySelector(".settings-grid");
        if (!section || section.classList.contains("hidden") || !grid) return;

        const panes = [
            { id: "profile", label: "Профиль", index: 0 },
            { id: "interface", label: "Интерфейс", index: 1 },
            { id: "tasks", label: "Задачи", index: 2 },
            { id: "notifications", label: "Уведомления", index: 3 },
            { id: "projects", label: "Проекты", index: 4 },
            { id: "tags", label: "Теги", index: 5 },
            { id: "data", label: "Экспорт", index: 6 }
        ];
        const active = localStorage.getItem(SETTINGS_TAB_KEY) || "profile";

        if (!section.querySelector(".premium-settings-tabs")) {
            const tabs = document.createElement("div");
            tabs.className = "premium-settings-tabs";
            tabs.innerHTML = panes.map((pane) => `
                <button type="button" data-premium-settings-tab="${pane.id}">${pane.label}</button>
            `).join("");
            section.querySelector(".settings-header")?.insertAdjacentElement("afterend", tabs);
        }

        const cards = [...grid.querySelectorAll(".settings-card")];
        panes.forEach((pane) => {
            const card = cards[pane.index];
            if (card) card.dataset.settingsPane = pane.id;
        });

        grid.classList.add("is-tabbed");
        cards.forEach((card) => card.classList.toggle("active-pane", card.dataset.settingsPane === active));
        section.querySelectorAll("[data-premium-settings-tab]").forEach((button) => {
            button.classList.toggle("active", button.dataset.premiumSettingsTab === active);
        });
    }

    function enhanceDocsExperience() {
        const section = document.getElementById("docsSection");
        if (!section || section.classList.contains("hidden")) return;

        if (!section.querySelector(".premium-docs-toolbar")) {
            const toolbar = document.createElement("div");
            toolbar.className = "premium-docs-toolbar";
            toolbar.innerHTML = `
                <input type="search" data-premium-note-search placeholder="Поиск по заметкам">
                <span class="mini-chip">Markdown preview</span>
            `;
            section.querySelector(".docs-header")?.insertAdjacentElement("afterend", toolbar);
        }

        const form = section.querySelector("[data-note-form]");
        if (form && !form.querySelector("[name='noteId']")) {
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = "noteId";
            form.prepend(hidden);
        }
        if (form && !form.querySelector(".premium-markdown-preview")) {
            const preview = document.createElement("div");
            preview.className = "premium-markdown-preview";
            preview.textContent = "Здесь появится предпросмотр заметки.";
            form.querySelector("textarea")?.insertAdjacentElement("afterend", preview);
            updateMarkdownPreview(form);
        }

        section.querySelectorAll(".note-card").forEach((card) => {
            const deleteButton = card.querySelector('[data-doc-action="delete-note"]');
            if (!deleteButton || card.querySelector("[data-premium-note-edit]")) return;
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "ghost-button";
            editButton.dataset.premiumNoteEdit = deleteButton.dataset.id || "";
            editButton.textContent = "Редактировать";
            const actions = document.createElement("div");
            actions.className = "premium-note-actions";
            deleteButton.insertAdjacentElement("beforebegin", editButton);
            deleteButton.parentElement?.appendChild(actions);
        });
    }

    function enhanceTaskEditGuard() {
        const overlay = document.querySelector(".task-edit-overlay");
        const form = document.getElementById("taskEditForm");
        if (!overlay || !form || overlay.dataset.premiumGuardReady) return;
        overlay.dataset.premiumGuardReady = "true";
        form.addEventListener("input", () => {
            overlay.dataset.premiumDirty = "true";
        }, true);
        form.addEventListener("submit", () => {
            overlay.dataset.premiumDirty = "false";
        }, true);
    }

    function enhanceButtonFeedback() {
        document.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) return;
            button.classList.add("is-pressed");
            window.setTimeout(() => button.classList.remove("is-pressed"), 160);
        }, true);
    }

    function enhanceGlobalInteractions() {
        if (document.body.dataset.premiumGlobalReady) return;
        document.body.dataset.premiumGlobalReady = "true";

        document.addEventListener("click", handlePremiumClick, true);
        document.addEventListener("submit", handlePremiumSubmit, true);
        document.addEventListener("input", handlePremiumInput, true);
        document.addEventListener("dragstart", () => document.body.classList.add("premium-dragging"), true);
        document.addEventListener("dragend", () => document.body.classList.remove("premium-dragging"), true);
        document.addEventListener("drop", () => document.body.classList.remove("premium-dragging"), true);
    }

    function handlePremiumClick(event) {
        const settingsTab = event.target.closest("[data-premium-settings-tab]");
        if (settingsTab) {
            localStorage.setItem(SETTINGS_TAB_KEY, settingsTab.dataset.premiumSettingsTab);
            enhanceSettingsTabs();
            return;
        }

        const noteEdit = event.target.closest("[data-premium-note-edit]");
        if (noteEdit) {
            event.preventDefault();
            event.stopImmediatePropagation();
            editNote(noteEdit.dataset.premiumNoteEdit);
            return;
        }

        const noteDelete = event.target.closest('[data-doc-action="delete-note"]');
        if (noteDelete && !window.confirm("Удалить заметку?")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        const closeTaskEdit = event.target.closest("#closeTaskEditButton, #closeTaskEditButtonBottom");
        const overlay = document.querySelector(".task-edit-overlay");
        const clickedBackdrop = overlay && event.target === overlay;
        if ((closeTaskEdit || clickedBackdrop) && overlay?.dataset.premiumDirty === "true") {
            if (!window.confirm("Есть несохраненные изменения. Закрыть без сохранения?")) {
                event.preventDefault();
                event.stopImmediatePropagation();
            } else {
                overlay.dataset.premiumDirty = "false";
            }
        }
    }

    function handlePremiumSubmit(event) {
        const noteForm = event.target.closest("[data-note-form]");
        if (noteForm?.elements.noteId?.value) {
            event.preventDefault();
            event.stopImmediatePropagation();
            saveEditedNote(noteForm);
            return;
        }

        const submitter = event.submitter;
        if (submitter?.matches("button")) {
            submitter.dataset.premiumLoading = "true";
            window.setTimeout(() => {
                delete submitter.dataset.premiumLoading;
            }, 1200);
        }
    }

    function handlePremiumInput(event) {
        const noteForm = event.target.closest("[data-note-form]");
        if (noteForm) {
            updateMarkdownPreview(noteForm);
        }

        const search = event.target.closest("[data-premium-note-search]");
        if (search) {
            filterNotes(search.value);
        }
    }

    function editNote(id) {
        const note = (state.notes || []).find((item) => String(item.id) === String(id));
        const form = document.querySelector("[data-note-form]");
        if (!note || !form) return;
        form.elements.noteId.value = note.id;
        form.elements.title.value = note.title || "";
        form.elements.text.value = note.text || "";
        if (form.elements.projectId) form.elements.projectId.value = note.projectId || "";
        if (form.elements.taskId) form.elements.taskId.value = note.taskId || "";
        form.querySelector("button[type='submit']").textContent = "Сохранить изменения";
        updateMarkdownPreview(form);
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        form.elements.title.focus();
    }

    function saveEditedNote(form) {
        const id = form.elements.noteId.value;
        const updatedAt = new Date().toISOString();
        state.notes = (state.notes || []).map((note) => String(note.id) === String(id)
            ? {
                ...note,
                title: form.elements.title.value.trim(),
                text: form.elements.text.value.trim(),
                projectId: form.elements.projectId?.value || "",
                taskId: form.elements.taskId?.value || "",
                updatedAt
            }
            : note
        );
        localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
        form.reset();
        form.elements.noteId.value = "";
        if (typeof renderApp === "function") renderApp();
        if (typeof showNotice === "function") showNotice("Заметка обновлена.", "success");
    }

    function updateMarkdownPreview(form) {
        const preview = form.querySelector(".premium-markdown-preview");
        const text = form.elements.text?.value || "";
        if (!preview) return;
        preview.innerHTML = markdownToHtml(text) || "Здесь появится предпросмотр заметки.";
    }

    function markdownToHtml(text) {
        return escapeSafe(text)
            .replace(/^### (.*)$/gm, "<h4>$1</h4>")
            .replace(/^## (.*)$/gm, "<h3>$1</h3>")
            .replace(/^# (.*)$/gm, "<h2>$1</h2>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/^- (.*)$/gm, "<div>• $1</div>")
            .replace(/\n/g, "<br>");
    }

    function filterNotes(value) {
        const query = String(value || "").trim().toLowerCase();
        document.querySelectorAll(".note-card").forEach((card) => {
            card.classList.toggle("is-hidden-by-search", query && !card.textContent.toLowerCase().includes(query));
        });
    }

    function todayIso() {
        if (typeof agendaIsoDate === "function") return agendaIsoDate();
        return new Date().toISOString().slice(0, 10);
    }

    function formatDateLabel(date, today) {
        if (!date) return "без срока";
        if (date < today) return "просрочено";
        if (date === today) return "сегодня";
        return date;
    }

    function escapeSafe(value) {
        if (typeof escapeHtml === "function") return escapeHtml(value || "");
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
