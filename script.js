let taskIdCounter = 1;
let tasks = [];

// Initialize the kanban board
document.addEventListener('DOMContentLoaded', function() {
    loadTasksFromStorage();
    updateTaskCounts();
});

function saveTasksToStorage() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem('kanbanTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        taskIdCounter = Math.max(...tasks.map(t => t.id), 0) + 1;
        tasks.forEach(task => renderTask(task));
    } else {
        addSampleTasks();
    }
}

function addSampleTasks() {
    const sampleTasks = [
        {
            title: "Design new landing page",
            description: "Create wireframes and mockups for the new product landing page",
            priority: "high",
            status: "todo"
        },
        {
            title: "Implement user authentication",
            description: "Set up login/logout functionality with JWT tokens",
            priority: "medium",
            status: "in-progress"
        },
        {
            title: "Write unit tests",
            description: "Add comprehensive test coverage for the API endpoints",
            priority: "medium",
            status: "todo"
        },
        {
            title: "Deploy to staging",
            description: "Push latest changes to staging environment for testing",
            priority: "low",
            status: "done"
        }
    ];

    sampleTasks.forEach(task => {
        createTask(task.title, task.description, task.priority, task.status);
    });
}

function showAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'block';
}

function hideAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
}

// Handle form submission
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    
    createTask(title, description, priority, 'todo');
    hideAddTaskModal();
    updateTaskCounts();
});

function createTask(title, description, priority, status = 'todo') {
    const taskId = taskIdCounter++;
    const task = {
        id: taskId,
        title,
        description,
        priority,
        status
    };
    
    tasks.push(task);
    renderTask(task);
    saveTasksToStorage();
}

function renderTask(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card ${task.priority}-priority`;
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    
    taskElement.innerHTML = `
        <div class="task-title" ondblclick="editTask(${task.id}, 'title')">${task.title}</div>
        ${task.description ? `<div class="task-description" ondblclick="editTask(${task.id}, 'description')">${task.description}</div>` : ''}
        <div class="task-meta">
            <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            <div class="task-actions">
                <button class="task-edit" onclick="showEditModal(${task.id})">✏️</button>
                <button class="task-delete" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>
    `;
    
    // Add drag event listeners
    taskElement.addEventListener('dragstart', dragStart);
    taskElement.addEventListener('dragend', dragEnd);
    
    // Add to appropriate column
    const column = document.querySelector(`[data-status="${task.status}"] .task-list`);
    column.appendChild(taskElement);
}

function deleteTask(taskId) {
    // Remove from tasks array
    tasks = tasks.filter(task => task.id !== taskId);
    
    // Remove from DOM
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    taskElement.remove();
    
    updateTaskCounts();
    saveTasksToStorage();
}

function updateTaskCounts() {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        const taskCount = column.querySelectorAll('.task-card').length;
        const countElement = column.querySelector('.task-count');
        countElement.textContent = taskCount;
    });
}

// Drag and Drop functionality
let draggedElement = null;

function dragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function dragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    const column = e.currentTarget.closest('.column');
    column.classList.add('drag-over');
}

function drop(e) {
    e.preventDefault();
    
    if (draggedElement) {
        const column = e.currentTarget.closest('.column');
        const newStatus = column.dataset.status;
        const taskId = parseInt(draggedElement.dataset.taskId);
        
        // Update task status in data
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
        }
        
        // Move element to new column
        e.currentTarget.appendChild(draggedElement);
        
        updateTaskCounts();
        saveTasksToStorage();
    }
    
    // Remove visual feedback
    document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('drag-over');
    });
}

// Remove drag-over class when dragging leaves the column
document.querySelectorAll('.task-list').forEach(list => {
    list.addEventListener('dragleave', function(e) {
        // Only remove if we're actually leaving the column area
        if (!this.contains(e.relatedTarget)) {
            this.closest('.column').classList.remove('drag-over');
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('addTaskModal');
    if (e.target === modal) {
        hideAddTaskModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press 'N' to add new task
    if (e.key === 'n' || e.key === 'N') {
        if (!document.getElementById('addTaskModal').style.display || 
            document.getElementById('addTaskModal').style.display === 'none') {
            showAddTaskModal();
            document.getElementById('taskTitle').focus();
        }
    }
    
    // Press 'Escape' to close modal
    if (e.key === 'Escape') {
        hideAddTaskModal();
    }
});