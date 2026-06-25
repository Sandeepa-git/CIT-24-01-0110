const API_BASE = "http://localhost:5000";

// Global State
let allNotes = [];
let composerState = {
    title: "",
    content: "",
    color: "default",
    pinned: false,
    tags: []
};
let activeFilters = {
    search: "",
    color: "all",
    pinnedOnly: false
};
let editingNote = null;

// DOM Elements
const composerContainer = document.getElementById("composerContainer");
const composerTextarea = document.getElementById("composerTextarea");
const composerTitleInput = document.getElementById("composerTitle");
const composerPinBtn = document.getElementById("composerPinBtn");
const selectedColorOption = document.getElementById("selectedColorOption");
const composerTagsInput = document.getElementById("composerTagsInput");
const composerTagsList = document.getElementById("composerTagsList");
const notesGrid = document.getElementById("notesGrid");
const searchInput = document.getElementById("searchInput");
const filterChips = document.querySelectorAll(".filter-chip");
const toastContainer = document.getElementById("toastContainer");

// Modal Elements
const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editTextarea = document.getElementById("editTextarea");
const editColorOption = document.getElementById("editColorOption");
const editPinBtn = document.getElementById("editPinBtn");
const editTagsInput = document.getElementById("editTagsInput");
const editTagsList = document.getElementById("editTagsList");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    // Load notes from DB
    fetchNotes();

    // Event Listeners
    setupComposer();
    setupFilters();
    setupModal();
    setupTextAreaAutoResize();
});

// Toast Helper
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast`;
    
    const icon = type === "success" 
        ? '<i class="bi bi-check-circle-fill success"></i>' 
        : '<i class="bi bi-exclamation-circle-fill error"></i>';
        
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Fetch all notes
async function fetchNotes() {
    renderLoading();
    try {
        const response = await fetch(`${API_BASE}/notes`);
        if (!response.ok) throw new Error("Failed to fetch notes");
        allNotes = await response.json();
        renderNotes();
    } catch (err) {
        console.error(err);
        showToast("Error loading notes: backend offline", "error");
        renderError();
    }
}

// Textarea Auto-Resize Helper
function setupTextAreaAutoResize() {
    const adjustHeight = (el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };
    
    composerTextarea.addEventListener("input", function() {
        adjustHeight(this);
    });
    
    editTextarea.addEventListener("input", function() {
        adjustHeight(this);
    });
}

// Composer Setup
function setupComposer() {
    // Expand composer when clicking inside
    composerContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        composerContainer.classList.add("expanded");
    });

    // Collapse when clicking outside
    document.addEventListener("click", () => {
        if (composerTextarea.value.trim() === "" && composerTitleInput.value.trim() === "" && composerState.tags.length === 0) {
            collapseComposer();
        }
    });

    // Pin click inside composer
    composerPinBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        composerState.pinned = !composerState.pinned;
        composerPinBtn.classList.toggle("active", composerState.pinned);
        showToast(composerState.pinned ? "Pinned note" : "Unpinned note");
    });

    // Color Pickers Setup
    setupColorPicker("composerColorPicker", (selectedColor) => {
        composerState.color = selectedColor;
        // Update selected swatch visual
        selectedColorOption.className = `color-option color-swatch-${selectedColor} selected`;
    });

    // Tags Setup
    composerTagsInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const tagVal = composerTagsInput.value.trim().toLowerCase();
            if (tagVal && !composerState.tags.includes(tagVal)) {
                composerState.tags.push(tagVal);
                renderComposerTags();
                composerTagsInput.value = "";
            }
        }
    });
}

function collapseComposer() {
    composerContainer.classList.remove("expanded");
    composerTitleInput.value = "";
    composerTextarea.value = "";
    composerTextarea.style.height = "auto";
    composerState.pinned = false;
    composerState.color = "default";
    composerState.tags = [];
    composerPinBtn.classList.remove("active");
    selectedColorOption.className = "color-option color-swatch-default selected";
    renderComposerTags();
}

function renderComposerTags() {
    composerTagsList.innerHTML = composerState.tags.map((tag, idx) => `
        <span class="note-tag">
            #${tag}
            <span class="tag-btn-remove" onclick="removeComposerTag(${idx})">&times;</span>
        </span>
    `).join("");
}

window.removeComposerTag = function(idx) {
    composerState.tags.splice(idx, 1);
    renderComposerTags();
};

// Color Swatch Popover setup helper
function setupColorPicker(containerId, onSelect) {
    const trigger = document.getElementById(containerId);
    const popover = trigger.querySelector(".color-picker-popover");
    
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.toggle("show");
    });
    
    // Close other popovers
    document.addEventListener("click", () => {
        popover.classList.remove("show");
    });

    const options = popover.querySelectorAll(".color-option");
    options.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            options.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            const color = opt.getAttribute("data-color");
            onSelect(color);
            popover.classList.remove("show");
        });
    });
}

// Add Note Action
async function saveNote() {
    const title = composerTitleInput.value.trim();
    const content = composerTextarea.value.trim();

    if (!title && !content) {
        showToast("Cannot save empty note", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                content: content,
                color: composerState.color,
                pinned: composerState.pinned,
                tags: composerState.tags
            })
        });

        if (!response.ok) throw new Error("Failed to save note");
        
        showToast("Note added successfully");
        collapseComposer();
        fetchNotes();
    } catch (err) {
        console.error(err);
        showToast("Error saving note", "error");
    }
}

// Delete Note Action
window.deleteNote = async function(id, event) {
    if (event) event.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
        const response = await fetch(`${API_BASE}/notes/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete note");
        
        showToast("Note deleted");
        fetchNotes();
    } catch (err) {
        console.error(err);
        showToast("Error deleting note", "error");
    }
};

// Toggle Pin Status Action
window.togglePin = async function(id, currentPinned, event) {
    if (event) event.stopPropagation();
    
    try {
        const response = await fetch(`${API_BASE}/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pinned: !currentPinned })
        });
        if (!response.ok) throw new Error("Failed to toggle pin");
        
        fetchNotes();
    } catch (err) {
        console.error(err);
        showToast("Error pin update", "error");
    }
};

// Filter setup
function setupFilters() {
    // Search input handler
    searchInput.addEventListener("input", (e) => {
        activeFilters.search = e.target.value.toLowerCase().trim();
        renderNotes();
    });

    // Filters chips
    filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
            filterChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            
            const filterType = chip.getAttribute("data-filter");
            if (filterType === "all") {
                activeFilters.color = "all";
                activeFilters.pinnedOnly = false;
            } else if (filterType === "pinned") {
                activeFilters.color = "all";
                activeFilters.pinnedOnly = true;
            } else {
                activeFilters.color = filterType;
                activeFilters.pinnedOnly = false;
            }
            renderNotes();
        });
    });
}

// Render Helper Functions
function renderLoading() {
    notesGrid.innerHTML = `
        <div class="spinner-container" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
        </div>
    `;
}

function renderError() {
    notesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="bi bi-wifi-off"></i>
            <h3>Connection Refused</h3>
            <p>Could not reach the database API. Check if the server is running on port 5000.</p>
            <button class="primary-btn" onclick="fetchNotes()" style="margin-top: 1rem;">Retry Connection</button>
        </div>
    `;
}

// Render Notes to Grid
function renderNotes() {
    let filtered = allNotes;

    // Search filter (Matches Title, Content or Tags)
    if (activeFilters.search) {
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(activeFilters.search) ||
            n.content.toLowerCase().includes(activeFilters.search) ||
            n.tags.some(t => t.toLowerCase().includes(activeFilters.search))
        );
    }

    // Color filter
    if (activeFilters.color !== "all") {
        filtered = filtered.filter(n => n.color === activeFilters.color);
    }

    // Pinned filter
    if (activeFilters.pinnedOnly) {
        filtered = filtered.filter(n => n.pinned);
    }

    if (filtered.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="bi bi-file-earmark-text"></i>
                <h3>No notes found</h3>
                <p>Try creating a new note or modifying your filters/search query.</p>
            </div>
        `;
        return;
    }

    notesGrid.innerHTML = filtered.map(note => {
        const formattedDate = formatDate(note.createdAt);
        const tagsHtml = note.tags && note.tags.length > 0 
            ? `<div class="note-tags">${note.tags.map(t => `<span class="note-tag">#${t}</span>`).join("")}</div>`
            : "";
            
        return `
            <div class="note-card theme-${note.color || 'default'}" onclick="openEditModal('${note.id}')">
                <div class="note-header">
                    <h3 class="note-title">${note.title || "Untitled"}</h3>
                    <div class="note-card-actions">
                        <button class="note-btn pin-btn ${note.pinned ? 'active' : ''}" title="Pin Note" onclick="togglePin('${note.id}', ${note.pinned}, event)">
                            <i class="bi bi-pin-angle${note.pinned ? '-fill' : ''}" style="width: 15px; height: 15px;"></i>
                        </button>
                        <button class="note-btn" title="Delete Note" onclick="deleteNote('${note.id}', event)">
                            <i class="bi bi-trash" style="width: 15px; height: 15px;"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">${note.content || note.text || ""}</div>
                ${tagsHtml}
                <div class="note-footer">
                    <span class="note-date">${formattedDate}</span>
                </div>
            </div>
        `;
    }).join("");
}

// Date Formatter (e.g., Jun 25, 2026, 1:40 PM)
function formatDate(dateString) {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return dateString;
    }
}

// Edit Modal Configuration
function setupModal() {
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Pin click inside modal
    editPinBtn.addEventListener("click", () => {
        if (!editingNote) return;
        editingNote.pinned = !editingNote.pinned;
        editPinBtn.classList.toggle("active", editingNote.pinned);
    });

    // Color Pickers in modal setup
    setupColorPicker("editColorPicker", (selectedColor) => {
        if (!editingNote) return;
        editingNote.color = selectedColor;
        editColorOption.className = `color-option color-swatch-${selectedColor} selected`;
    });

    // Tags inside edit modal
    editTagsInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const tagVal = editTagsInput.value.trim().toLowerCase();
            if (tagVal && editingNote && !editingNote.tags.includes(tagVal)) {
                editingNote.tags.push(tagVal);
                renderEditModalTags();
                editTagsInput.value = "";
            }
        }
    });
}

window.openEditModal = function(id) {
    const note = allNotes.find(n => n.id === id);
    if (!note) return;
    
    // Set clone editing state
    editingNote = JSON.parse(JSON.stringify(note));
    
    editTitle.value = editingNote.title;
    editTextarea.value = editingNote.content || editingNote.text || "";
    editPinBtn.classList.toggle("active", editingNote.pinned);
    editColorOption.className = `color-option color-swatch-${editingNote.color || 'default'} selected`;
    
    renderEditModalTags();
    
    editModal.classList.add("show");
    editTextarea.style.height = "auto";
    editTextarea.style.height = editTextarea.scrollHeight + "px";
};

window.closeEditModal = function() {
    editModal.classList.remove("show");
    editingNote = null;
};

function renderEditModalTags() {
    if (!editingNote || !editingNote.tags) return;
    editTagsList.innerHTML = editingNote.tags.map((tag, idx) => `
        <span class="note-tag">
            #${tag}
            <span class="tag-btn-remove" onclick="removeEditTag(${idx})">&times;</span>
        </span>
    `).join("");
}

window.removeEditTag = function(idx) {
    if (!editingNote) return;
    editingNote.tags.splice(idx, 1);
    renderEditModalTags();
};

window.saveEdit = async function() {
    if (!editingNote) return;
    
    const updatedTitle = editTitle.value.trim();
    const updatedContent = editTextarea.value.trim();
    
    if (!updatedTitle && !updatedContent) {
        showToast("Note cannot be completely empty", "error");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/notes/${editingNote.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: updatedTitle,
                content: updatedContent,
                color: editingNote.color,
                pinned: editingNote.pinned,
                tags: editingNote.tags
            })
        });
        
        if (!response.ok) throw new Error("Failed to save changes");
        
        showToast("Note updated");
        closeEditModal();
        fetchNotes();
    } catch (err) {
        console.error(err);
        showToast("Error updating note", "error");
    }
};
