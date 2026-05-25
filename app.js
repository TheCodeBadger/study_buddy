// =====================
// 1. NAVIGATION
// =====================

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const targetPage = button.getAttribute("data-page");

        navButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });
        button.classList.add("active");

        pages.forEach(function (page) {
            page.classList.remove("active");
        });
        document.getElementById("page-" + targetPage).classList.add("active");
    });
});

// =====================
// 2. THEME SWITCHER
// =====================

function setTheme(themeName) {
    document.body.classList.remove("theme-light", "theme-dark", "theme-contrast");
    document.body.classList.add("theme-" + themeName);
    localStorage.setItem("theme", themeName);
}

// =====================
// 3. FONT SWITCHER
// =====================

function setFont(fontName) {
    document.body.classList.remove(
        "font-standard",
        "font-dyslexic",
        "font-hyperlegible",
        "font-comic",
        "font-arial"
    );
    document.body.classList.add("font-" + fontName);
    localStorage.setItem("font", fontName);
}

// =====================
// 4. LOAD SAVED PREFERENCES
// =====================

function loadPreferences() {
    const savedTheme = localStorage.getItem("theme");
    const savedFont = localStorage.getItem("font");

    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme("light");
    }

    if (savedFont) {
        setFont(savedFont);
    } else {
        setFont("standard");
    }
}

loadPreferences();

// =====================
// 5. TASKS
// =====================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    const taskList = document.getElementById("task-list");

    if (tasks.length === 0) {
        taskList.innerHTML =
            '<p style="opacity:0.5; margin-top: 8px;">No tasks yet — add one above!</p>';
        return;
    }

    taskList.innerHTML = tasks
        .map(function (task, index) {
            return `
      <div class="task-item ${task.completed ? "completed" : ""}">
        <input
          type="checkbox"
          class="task-checkbox"
          ${task.completed ? "checked" : ""}
          onchange="toggleTask(${index})"
        />
        <span class="task-text">${task.text}</span>
        <span class="task-subject">${task.subject}</span>
        <button class="task-delete" onclick="deleteTask(${index})">🗑</button>
      </div>
    `;
        })
        .join("");
}

function addTask() {
    const input = document.getElementById("task-input");
    const select = document.getElementById("subject-select");
    const text = input.value.trim();

    if (text === "") return;

    tasks.push({
        text: text,
        subject: select.value,
        completed: false,
    });

    input.value = "";
    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

document.getElementById("add-task-btn").addEventListener("click", addTask);

document.getElementById("task-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") addTask();
});

renderTasks();

// =====================
// 6. FOCUS TIMER
// =====================

function getFocusDuration() {
    return parseInt(document.getElementById("custom-focus").value) * 60;
}

function getBreakDuration() {
    return parseInt(document.getElementById("custom-break").value) * 60;
}

let timerInterval = null;
let timeRemaining = getFocusDuration();
let isRunning = false;
let isFocusMode = true;
let sessionsCompleted =
    parseInt(localStorage.getItem("sessions-today")) || 0;

const timerDisplay = document.getElementById("timer-display");
const timerMode = document.getElementById("timer-mode");
const timerProgressBar = document.getElementById("timer-progress-bar");
const timerStartBtn = document.getElementById("timer-start-btn");
const sessionCount = document.getElementById("session-count");

sessionCount.textContent = sessionsCompleted;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
    const totalDuration = isFocusMode ? getFocusDuration() : getBreakDuration();
    const progress = (timeRemaining / totalDuration) * 100;
    timerDisplay.textContent = formatTime(timeRemaining);
    timerProgressBar.style.width = progress + "%";
}

function tick() {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        timerStartBtn.textContent = "▶ Start";

        if (isFocusMode) {
            sessionsCompleted++;
            sessionCount.textContent = sessionsCompleted;
            localStorage.setItem("sessions-today", sessionsCompleted);
            isFocusMode = false;
            timeRemaining = getBreakDuration();
            timerMode.textContent = "☕ Break Time";
            timerDisplay.style.color = "#4caf50";
        } else {
            isFocusMode = true;
            timeRemaining = getFocusDuration();
            timerMode.textContent = "🎯 Focus Time";
            timerDisplay.style.color = "var(--accent)";
        }

        updateTimerDisplay();
    }
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        timerStartBtn.textContent = "▶ Start";
    } else {
        timerInterval = setInterval(tick, 1000);
        isRunning = true;
        timerStartBtn.textContent = "⏸ Pause";
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isFocusMode = true;
    timeRemaining = getFocusDuration();
    timerStartBtn.textContent = "▶ Start";
    timerMode.textContent = "🎯 Focus Time";
    timerDisplay.style.color = "var(--accent)";
    updateTimerDisplay();
}

timerStartBtn.addEventListener("click", toggleTimer);
document.getElementById("timer-reset-btn").addEventListener("click", resetTimer);

function readableTime(mins) {
    if (mins < 60) {
        return mins + " minutes";
    } else if (mins === 60) {
        return "1 hour";
    } else {
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        if (remaining === 0) {
            return hours + " hours";
        } else {
            return hours + " hour " + remaining + " minutes";
        }
    }
}

document.getElementById("custom-focus").addEventListener("input", function () {
    document.getElementById("focus-readable").textContent = readableTime(
        parseInt(this.value)
    );
    if (!isRunning) {
        timeRemaining = getFocusDuration();
        updateTimerDisplay();
    }
});

document.getElementById("custom-break").addEventListener("input", function () {
    document.getElementById("break-readable").textContent = readableTime(
        parseInt(this.value)
    );
});

updateTimerDisplay();

// =====================
// 7. NOTES
// =====================

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function renderNotes() {
    const notesList = document.getElementById("notes-list");

    if (notes.length === 0) {
        notesList.innerHTML =
            '<p style="opacity:0.5; margin-top: 8px;">No notes yet — add one above!</p>';
        return;
    }

    const reversed = [...notes].reverse();

    notesList.innerHTML = reversed
        .map(function (note, index) {
            const realIndex = notes.length - 1 - index;
            return `
      <div class="note-item" id="note-${realIndex}" onclick="toggleNote(${realIndex})">
        <div class="note-item-header">
          <span class="note-item-title">${note.title}</span>
          <div class="note-item-meta">
            <span class="task-subject">${note.subject}</span>
            <span class="note-item-date">${formatDate(note.date)}</span>
            <button class="task-delete" onclick="deleteNote(event, ${realIndex})">🗑</button>
          </div>
        </div>
        <div class="note-item-body">${note.body}</div>
      </div>
    `;
        })
        .join("");
}

function toggleNote(index) {
    const noteEl = document.getElementById("note-" + index);
    noteEl.classList.toggle("note-expanded");
}

function addNote() {
    const titleInput = document.getElementById("note-title-input");
    const bodyInput = document.getElementById("note-body-input");
    const subjectSelect = document.getElementById("note-subject-select");

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (title === "") return;

    notes.push({
        title: title,
        body: body,
        subject: subjectSelect.value,
        date: new Date().toISOString(),
    });

    titleInput.value = "";
    bodyInput.value = "";

    saveNotes();
    renderNotes();
}

function deleteNote(event, index) {
    event.stopPropagation();
    notes.splice(index, 1);
    saveNotes();
    renderNotes();
}

document.getElementById("add-note-btn").addEventListener("click", addNote);

renderNotes();

// =====================
// 8. SETTINGS — ACTIVE BUTTON STATE
// =====================

function updateSettingsButtons() {
    const currentTheme = localStorage.getItem("theme") || "light";
    const currentFont = localStorage.getItem("font") || "standard";

    document.querySelectorAll('[id^="theme-"]').forEach(function (btn) {
        btn.classList.remove("active");
    });

    document.querySelectorAll('[id^="font-"]').forEach(function (btn) {
        btn.classList.remove("active");
    });

    const themeBtn = document.getElementById("theme-" + currentTheme);
    const fontBtn = document.getElementById("font-" + currentFont);

    if (themeBtn) themeBtn.classList.add("active");
    if (fontBtn) fontBtn.classList.add("active");
}

const originalSetTheme = setTheme;
setTheme = function (themeName) {
    originalSetTheme(themeName);
    updateSettingsButtons();
};

const originalSetFont = setFont;
setFont = function (fontName) {
    originalSetFont(fontName);
    updateSettingsButtons();
};

// =====================
// 9. RESET DATA
// =====================

document.getElementById("reset-data-btn").addEventListener("click", function () {
    const confirmed = confirm(
        "Are you sure? This will delete all your tasks, notes and session data."
    );

    if (confirmed) {
        localStorage.removeItem("tasks");
        localStorage.removeItem("notes");
        localStorage.removeItem("sessions-today");

        tasks = [];
        notes = [];
        sessionsCompleted = 0;
        sessionCount.textContent = 0;

        renderTasks();
        renderNotes();
        resetTimer();
    }
});

updateSettingsButtons();
// =====================
// 10. CUSTOM SUBJECTS
// =====================

const defaultSubjects = [
    { emoji: "📚", name: "general" },
    { emoji: "🔢", name: "maths" },
    { emoji: "✏️", name: "english" },
    { emoji: "🔬", name: "science" },
    { emoji: "💻", name: "coding" },
];

let subjects =
    JSON.parse(localStorage.getItem("subjects")) || defaultSubjects;

// Track which emoji is currently selected
let selectedEmoji = "🎨";

function saveSubjects() {
    localStorage.setItem("subjects", JSON.stringify(subjects));
}

function renderSubjectDropdowns() {
    const dropdowns = [
        document.getElementById("subject-select"),
        document.getElementById("note-subject-select"),
    ];

    dropdowns.forEach(function (dropdown) {
        dropdown.innerHTML = subjects
            .map(function (subject) {
                return `<option value="${subject.name}">${subject.emoji} ${subject.name}</option>`;
            })
            .join("");
    });
}

function renderSubjectTags() {
    const list = document.getElementById("subject-tags-list");

    if (subjects.length === 0) {
        list.innerHTML =
            '<p style="opacity:0.5; font-size:13px;">No subjects yet.</p>';
        return;
    }

    list.className = "subject-tags-list";
    list.innerHTML = subjects
        .map(function (subject, index) {
            const canDelete = subjects.length > 1;
            return `
        <div class="subject-tag">
          <span>${subject.emoji} ${subject.name}</span>
          ${canDelete
                    ? `<button class="subject-tag-delete" onclick="deleteSubject(${index})">✕</button>`
                    : ""
                }
        </div>
      `;
        })
        .join("");
}

function addSubject() {
    const nameInput = document.getElementById("subject-name-input");
    const name = nameInput.value.trim().toLowerCase();

    if (name === "") return;

    const exists = subjects.some(function (s) {
        return s.name === name;
    });
    if (exists) return;

    subjects.push({ emoji: selectedEmoji, name: name });

    nameInput.value = "";
    selectedEmoji = "🎨";
    document.getElementById("emoji-picker-btn").textContent = "🎨";

    saveSubjects();
    renderSubjectTags();
    renderSubjectDropdowns();
}

function deleteSubject(index) {
    subjects.splice(index, 1);
    saveSubjects();
    renderSubjectTags();
    renderSubjectDropdowns();
}

// =====================
// 11. EMOJI PICKER
// =====================

const emojis = [
    "📚", "📖", "✏️", "🔢", "🔬", "💻", "🎨", "🎭",
    "🎵", "🏃", "🌍", "📐", "📝", "🧪", "🧮", "🗣️",
    "💡", "🏛️", "📊", "🎯", "🧠", "📜", "🔭", "🎸",
    "⚽", "🍳", "💰", "🌱", "🏥", "⚖️", "🤝", "🎓",
];

function buildEmojiPicker() {
    const grid = document.getElementById("emoji-picker-grid");

    grid.innerHTML = emojis
        .map(function (emoji) {
            return `<button class="emoji-option" onclick="selectEmoji('${emoji}')">${emoji}</button>`;
        })
        .join("");
}

function selectEmoji(emoji) {
    selectedEmoji = emoji;
    document.getElementById("emoji-picker-btn").textContent = emoji;
    document.getElementById("emoji-picker-grid").classList.remove("open");
}

// Toggle picker open/closed
document.getElementById("emoji-picker-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    document.getElementById("emoji-picker-grid").classList.toggle("open");
});

// Close picker if clicking anywhere else
document.addEventListener("click", function () {
    document.getElementById("emoji-picker-grid").classList.remove("open");
});

document
    .getElementById("add-subject-btn")
    .addEventListener("click", addSubject);

document
    .getElementById("subject-name-input")
    .addEventListener("keypress", function (e) {
        if (e.key === "Enter") addSubject();
    });

buildEmojiPicker();
renderSubjectTags();
renderSubjectDropdowns();

// =====================
// 12. WELCOME SCREEN
// =====================

function checkWelcome() {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");

    if (!hasSeenWelcome) {
        document.getElementById("welcome-overlay").classList.remove("hidden");
    } else {
        document.getElementById("welcome-overlay").classList.add("hidden");
    }
}

function dismissWelcome() {
    localStorage.setItem("hasSeenWelcome", "true");
    document.getElementById("welcome-overlay").classList.add("hidden");
}

document
    .getElementById("welcome-btn")
    .addEventListener("click", dismissWelcome);

checkWelcome();

// =====================
// 13. TOOLTIPS
// =====================

const tooltipContent = {
    tasks: {
        title: "📋 My Tasks",
        text: "Add anything you need to get done — big or small. Pick a subject to keep things organised, then tick tasks off as you go. Your tasks are saved automatically, so they'll still be here when you come back.",
    },
    timer: {
        title: "⏱ Focus Timer",
        text: "The Focus Timer helps you study in short, manageable bursts. Set your focus time, hit Start, and give it your full attention. When the timer ends you'll get a well earned break. Even 25 minutes of focused study makes a real difference!",
    },
    notes: {
        title: "📝 Notes",
        text: "Use Notes to capture ideas, summarise what you've learned, or jot down anything worth remembering. Give each note a title and subject so you can find it easily. Click a note to expand and read it in full.",
    },
    settings: {
        title: "⚙️ Settings",
        text: "Make OpenDesk work for you. Switch between light, dark, or high contrast themes to find what's easiest on your eyes. Try the OpenDyslexic font if it helps you read more comfortably. You can also add your own subjects to match exactly what you're studying.",
    },
};

// Create one shared popup element
const tooltipPopup = document.createElement("div");
tooltipPopup.className = "tooltip-popup hidden";
tooltipPopup.innerHTML = `
  <div class="tooltip-popup-title" id="tooltip-title"></div>
  <div id="tooltip-text"></div>
  <button class="tooltip-popup-close" id="tooltip-close">✕ Close</button>
`;
document.body.appendChild(tooltipPopup);

document
    .getElementById("tooltip-close")
    .addEventListener("click", function () {
        tooltipPopup.classList.add("hidden");
    });

// Close if clicking outside
document.addEventListener("click", function (e) {
    if (
        !tooltipPopup.contains(e.target) &&
        !e.target.classList.contains("tooltip-btn")
    ) {
        tooltipPopup.classList.add("hidden");
    }
});

// Wire up all tooltip buttons
document.querySelectorAll(".tooltip-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
        e.stopPropagation();

        const key = btn.getAttribute("data-tooltip");
        const content = tooltipContent[key];

        document.getElementById("tooltip-title").textContent = content.title;
        document.getElementById("tooltip-text").textContent = content.text;

        // Position the popup near the button
        const rect = btn.getBoundingClientRect();
        tooltipPopup.style.top = rect.bottom + 10 + "px";
        tooltipPopup.style.left = Math.min(rect.left, window.innerWidth - 320) + "px";

        tooltipPopup.classList.remove("hidden");
    });
});

// =====================
// 14. ZOOM / TEXT SIZE
// =====================

function applyZoom(value) {
    document.querySelector(".main-content").style.zoom = value + "%";
    localStorage.setItem("zoom", value);

    document.querySelectorAll(".zoom-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });
    const activeBtn = document.querySelector(
        `.zoom-btn[onclick="applyZoom(${value})"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}

const savedZoom = parseInt(localStorage.getItem("zoom")) || 100;
applyZoom(savedZoom);

// =====================
// 15. LINE & LETTER SPACING
// =====================

function setLineSpacing(value) {
    document.body.style.setProperty("--line-spacing", value);
    localStorage.setItem("lineSpacing", value);

    document.querySelectorAll(".zoom-btn[onclick^='setLineSpacing']")
        .forEach(function (btn) {
            btn.classList.remove("active");
        });
    const activeBtn = document.querySelector(
        `.zoom-btn[onclick="setLineSpacing(${value})"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}

function setLetterSpacing(value) {
    document.body.style.setProperty("--letter-spacing", value + "px");
    localStorage.setItem("letterSpacing", value);

    document.querySelectorAll(".zoom-btn[onclick^='setLetterSpacing']")
        .forEach(function (btn) {
            btn.classList.remove("active");
        });
    const activeBtn = document.querySelector(
        `.zoom-btn[onclick="setLetterSpacing(${value})"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}

// Load saved spacing on startup
const savedLineSpacing = localStorage.getItem("lineSpacing") || 1.8;
const savedLetterSpacing = localStorage.getItem("letterSpacing") || 0;
setLineSpacing(parseFloat(savedLineSpacing));
setLetterSpacing(parseFloat(savedLetterSpacing));

// =====================
// 16. COLOUR TINT OVERLAY
// =====================

const tintColours = {
    none: "transparent",
    warm: "rgba(255, 220, 150, 0.15)",
    cool: "rgba(150, 200, 255, 0.15)",
    rose: "rgba(255, 180, 180, 0.15)",
    mint: "rgba(150, 230, 200, 0.15)",
    sand: "rgba(220, 200, 170, 0.15)",
};

function setTint(tintName) {
    const overlay = document.getElementById("tint-overlay");
    overlay.style.backgroundColor = tintColours[tintName];
    localStorage.setItem("tint", tintName);

    document.querySelectorAll(".tint-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });
    const activeBtn = document.getElementById("tint-" + tintName);
    if (activeBtn) activeBtn.classList.add("active");
}

// Load saved tint on startup
const savedTint = localStorage.getItem("tint") || "none";
setTint(savedTint);