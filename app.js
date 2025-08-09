// Chat Application JavaScript
class ChatApp {
    constructor() {
        this.socket = null;
        this.username = '';
        this.sessionId = '';
        this.currentChat = null;
        this.chats = [];
        this.selectedFiles = [];
        this.availableUsers = [];
        this.selectedUsers = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoginModal();
    }

    bindEvents() {
        // Login events
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Header events
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshChats());
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettingsDropdown());
        document.getElementById('notificationIcon').addEventListener('click', () => this.toggleNotificationPanel());

        // Settings dropdown events
        document.getElementById('newGroupBtn').addEventListener('click', () => this.openNewGroupModal());
        document.getElementById('activeSessionsBtn').addEventListener('click', () => this.openActiveSessionsModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modal events
        document.getElementById('closeSessionsModal').addEventListener('click', () => this.closeActiveSessionsModal());
        document.getElementById('closeNewGroupModal').addEventListener('click', () => this.closeNewGroupModal());
        document.getElementById('notificationClose').addEventListener('click', () => this.closeNotificationPanel());

        // New Group Modal events
        document.getElementById('groupNameInput').addEventListener('input', () => this.validateGroupForm());
        document.getElementById('availableUsersSearch').addEventListener('input', (e) => this.searchUsers('available', e.target.value));
        document.getElementById('selectedUsersSearch').addEventListener('input', (e) => this.searchUsers('selected', e.target.value));
        
        // Transfer buttons
        document.getElementById('moveAllRight').addEventListener('click', () => this.moveAllUsers('right'));
        document.getElementById('moveRight').addEventListener('click', () => this.moveSelectedUsers('right'));
        document.getElementById('moveLeft').addEventListener('click', () => this.moveSelectedUsers('left'));
        document.getElementById('moveAllLeft').addEventListener('click', () => this.moveAllUsers('left'));
        
        // Group form buttons
        document.getElementById('createGroupBtn').addEventListener('click', () => this.createGroup());
        document.getElementById('cancelGroupBtn').addEventListener('click', () => this.closeNewGroupModal());

        // Search and filter events
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchChats(e.target.value));
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.filterChats(e.target.dataset.filter));
        });

        // Message input events
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('attachBtn').addEventListener('click', () => this.openFileDialog());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelection(e));

        // Welcome continue button
        document.getElementById('welcomeContinueBtn').addEventListener('click', () => this.hideWelcomeScreen());

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-container')) {
                this.closeSettingsDropdown();
            }
        });
    }

    generateBatchId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'flex';
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
    }

    login() {
        const username = document.getElementById('usernameInput').value.trim();
        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        this.username = username;
        this.sessionId = this.generateBatchId();
        
        // Initialize WebSocket connection
        this.connectWebSocket();
        
        this.hideLoginModal();
        this.showPostLoginWelcome();
        this.updateUserInfo();
    }

    connectWebSocket() {
        // WebSocket connection logic would go here
        // For now, we'll simulate the connection
        this.updateConnectionStatus('connected');
    }

    showPostLoginWelcome() {
        document.getElementById('postLoginUsername').textContent = this.username;
        document.getElementById('postLoginWelcome').style.display = 'flex';
        
        setTimeout(() => {
            this.hideWelcomeScreen();
        }, 3000);
    }

    hideWelcomeScreen() {
        document.getElementById('postLoginWelcome').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
    }

    updateUserInfo() {
        document.getElementById('currentUserName').textContent = this.username;
        document.getElementById('userAvatar').textContent = this.username.charAt(0).toUpperCase();
        document.getElementById('welcomeUsername').textContent = this.username;
    }

    updateConnectionStatus(status) {
        const statusElement = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        if (status === 'connected') {
            statusElement.textContent = 'Connected';
            statusDot.className = 'status-dot connected';
        } else {
            statusElement.textContent = 'Connecting...';
            statusDot.className = 'status-dot';
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
    }

    toggleSettingsDropdown() {
        const dropdown = document.getElementById('settingsDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }

    closeSettingsDropdown() {
        document.getElementById('settingsDropdown').style.display = 'none';
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        panel.classList.toggle('active');
    }

    closeNotificationPanel() {
        document.getElementById('notificationPanel').classList.remove('active');
    }

    openActiveSessionsModal() {
        document.getElementById('activeSessionsModal').style.display = 'flex';
        this.closeSettingsDropdown();
    }

    closeActiveSessionsModal() {
        document.getElementById('activeSessionsModal').style.display = 'none';
    }

    openNewGroupModal() {
        document.getElementById('newGroupModal').style.display = 'flex';
        this.closeSettingsDropdown();
        this.loadUsers();
        this.resetGroupForm();
    }

    closeNewGroupModal() {
        document.getElementById('newGroupModal').style.display = 'none';
        this.resetGroupForm();
    }

    resetGroupForm() {
        document.getElementById('groupNameInput').value = '';
        document.getElementById('availableUsersSearch').value = '';
        document.getElementById('selectedUsersSearch').value = '';
        this.availableUsers = [];
        this.selectedUsers = [];
        this.updateUserLists();
        this.validateGroupForm();
    }

    loadUsers() {
        // Show loading state
        document.getElementById('availableUsersList').innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading users...</p>
            </div>
        `;

        // Make WebSocket request for users
        const request = {
            action: 'get_users',
            username: this.username,
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };

        // Simulate WebSocket send
        this.sendWebSocketMessage(request);
        
        // Simulate response (replace with actual WebSocket response handling)
        setTimeout(() => {
            this.handleUsersResponse({
                status: 'success',
                users: [
                    { login: 'john_doe', name: 'John Doe' },
                    { login: 'jane_smith', name: 'Jane Smith' },
                    { login: 'bob_wilson', name: 'Bob Wilson' },
                    { login: 'alice_brown', name: 'Alice Brown' }
                ]
            });
        }, 1000);
    }

    handleUsersResponse(response) {
        if (response.status === 'success') {
            this.availableUsers = response.users || [];
            this.selectedUsers = [];
            this.updateUserLists();
        } else {
            this.showError(response.message || 'Failed to load users');
        }
    }

    updateUserLists() {
        this.renderUserList('available', this.availableUsers);
        this.renderUserList('selected', this.selectedUsers);
        this.validateGroupForm();
    }

    renderUserList(type, users) {
        const listElement = document.getElementById(`${type}UsersList`);
        
        if (users.length === 0) {
            const emptyMessage = type === 'available' ? 'No users available' : 'No users selected';
            const emptySubtext = type === 'available' ? 'All users are already selected' : 'Select users from the available list';
            
            listElement.innerHTML = `
                <div class="empty-state">
                    <p>${emptyMessage}</p>
                    <small>${emptySubtext}</small>
                </div>
            `;
            return;
        }

        listElement.innerHTML = users.map(user => `
            <div class="user-item" data-username="${user.login}" draggable="true">
                <div class="user-avatar">
                    <span>${user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-username">@${user.login}</div>
                </div>
                <div class="user-checkbox">
                    <input type="checkbox" id="${type}_${user.login}">
                </div>
            </div>
        `).join('');

        // Add event listeners for drag and drop
        this.setupDragAndDrop(listElement, type);
        
        // Add click event listeners
        listElement.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                }
                item.classList.toggle('selected', item.querySelector('input[type="checkbox"]').checked);
            });
        });
    }

    setupDragAndDrop(listElement, type) {
        listElement.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('user-item')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.username);
                e.dataTransfer.setData('source', type);
                e.target.classList.add('dragging');
            }
        });

        listElement.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('user-item')) {
                e.target.classList.remove('dragging');
            }
        });

        listElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            listElement.classList.add('drag-over');
        });

        listElement.addEventListener('dragleave', (e) => {
            if (!listElement.contains(e.relatedTarget)) {
                listElement.classList.remove('drag-over');
            }
        });

        listElement.addEventListener('drop', (e) => {
            e.preventDefault();
            listElement.classList.remove('drag-over');
            
            const username = e.dataTransfer.getData('text/plain');
            const source = e.dataTransfer.getData('source');
            
            if (source !== type) {
                this.moveUser(username, source, type);
            }
        });
    }

    moveUser(username, from, to) {
        let user;
        
        if (from === 'available') {
            const index = this.availableUsers.findIndex(u => u.login === username);
            if (index !== -1) {
                user = this.availableUsers.splice(index, 1)[0];
            }
        } else {
            const index = this.selectedUsers.findIndex(u => u.login === username);
            if (index !== -1) {
                user = this.selectedUsers.splice(index, 1)[0];
            }
        }

        if (user) {
            if (to === 'available') {
                this.availableUsers.push(user);
                this.availableUsers.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                this.selectedUsers.push(user);
                this.selectedUsers.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            this.updateUserLists();
        }
    }

    moveSelectedUsers(direction) {
        const sourceType = direction === 'right' ? 'available' : 'selected';
        const targetType = direction === 'right' ? 'selected' : 'available';
        const sourceList = direction === 'right' ? this.availableUsers : this.selectedUsers;
        
        const selectedUsers = [];
        const checkboxes = document.querySelectorAll(`#${sourceType}UsersList input[type="checkbox"]:checked`);
        
        checkboxes.forEach(checkbox => {
            const username = checkbox.id.replace(`${sourceType}_`, '');
            const user = sourceList.find(u => u.login === username);
            if (user) {
                selectedUsers.push(user);
            }
        });

        selectedUsers.forEach(user => {
            this.moveUser(user.login, sourceType, targetType);
        });
    }

    moveAllUsers(direction) {
        const sourceType = direction === 'right' ? 'available' : 'selected';
        const sourceList = direction === 'right' ? [...this.availableUsers] : [...this.selectedUsers];
        
        sourceList.forEach(user => {
            this.moveUser(user.login, sourceType, direction === 'right' ? 'selected' : 'available');
        });
    }

    searchUsers(type, query) {
        const listElement = document.getElementById(`${type}UsersList`);
        const userItems = listElement.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            const userName = item.querySelector('.user-name').textContent.toLowerCase();
            const userUsername = item.querySelector('.user-username').textContent.toLowerCase();
            const matches = userName.includes(query.toLowerCase()) || userUsername.includes(query.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    validateGroupForm() {
        const groupName = document.getElementById('groupNameInput').value.trim();
        const hasSelectedUsers = this.selectedUsers.length > 0;
        const createBtn = document.getElementById('createGroupBtn');
        
        createBtn.disabled = !groupName || !hasSelectedUsers;
    }

    createGroup() {
        const groupName = document.getElementById('groupNameInput').value.trim();
        
        if (!groupName) {
            this.showError('Group name is required');
            return;
        }

        if (this.selectedUsers.length === 0) {
            this.showError('At least one user must be selected');
            return;
        }

        const request = {
            action: 'create_group',
            groupname: groupName,
            users: this.selectedUsers.map(user => user.login),
            username: this.username,
            sessionid: this.sessionId,
            batchId: this.generateBatchId(),
            requestId: this.generateBatchId()
        };

        this.sendWebSocketMessage(request);
        
        // Simulate response (replace with actual WebSocket response handling)
        setTimeout(() => {
            this.handleCreateGroupResponse({
                status: 'success',
                message: 'Group created successfully'
            });
        }, 1000);
    }

    handleCreateGroupResponse(response) {
        if (response.status === 'success') {
            this.showSuccess(response.message || 'Group created successfully');
            this.closeNewGroupModal();
            this.refreshChats();
        } else {
            this.showError(response.message || 'Failed to create group');
        }
    }

    sendWebSocketMessage(message) {
        // WebSocket send logic would go here
        console.log('Sending WebSocket message:', message);
        
        // If socket is available, send the message
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    refreshChats() {
        this.showNotificationToast('Chats Refreshed', 'Chat list has been updated');
    }

    searchChats(query) {
        // Chat search logic
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchChats('');
    }

    filterChats(filter) {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Send message logic
        messageInput.value = '';
    }

    openFileDialog() {
        document.getElementById('fileInput').click();
    }

    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        this.selectedFiles = files;
        // Handle file selection logic
    }

    logout() {
        this.username = '';
        this.sessionId = '';
        this.currentChat = null;
        this.chats = [];
        this.closeSettingsDropdown();
        this.showLoginModal();
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    showNotificationToast(title, message) {
        const toast = document.getElementById('notificationToast');
        toast.querySelector('.notification-title').textContent = title;
        toast.querySelector('.notification-message').textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});