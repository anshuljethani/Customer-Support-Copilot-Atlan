// Global variables
let currentPage = 1;
let ticketsPerPage = 10;
let allTickets = [];
let filteredTickets = [];
let currentUserId = null;
let isProcessing = false;
let isUploading = false;
let charts = {};

// API Configuration
const API_BASE_URL = 'http://localhost:8081';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboard();
});

// Initialize app
function initializeApp() {
    // Generate unique user ID for this session
    currentUserId = generateUUID();
    console.log('Generated user ID:', currentUserId);
    
    // Set up navigation
    setupNavigation();
}

// Generate UUID for user session
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Setup navigation
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
}

// Switch between pages
function switchPage(pageName) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Update active page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    // Load page-specific content
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'chat') {
        loadChat();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Dashboard filters
    document.getElementById('priority-filter').addEventListener('change', applyFilters);
    document.getElementById('sentiment-filter').addEventListener('change', applyFilters);
    document.getElementById('topic-filter').addEventListener('change', applyFilters);
    document.getElementById('keyword-search').addEventListener('input', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Pagination
    document.getElementById('prev-page').addEventListener('click', previousPage);
    document.getElementById('next-page').addEventListener('click', nextPage);
    
    // Upload functionality
    document.getElementById('upload-btn').addEventListener('click', openUploadModal);
    document.getElementById('close-modal').addEventListener('click', closeUploadModal);
    document.getElementById('cancel-upload').addEventListener('click', closeUploadModal);
    document.getElementById('confirm-upload').addEventListener('click', uploadFile);
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    
    // File upload area
    document.getElementById('file-upload-area').addEventListener('click', () => {
        if (isUploading) {
            showNotification('Please wait for the current upload to complete.', 'error');
            return;
        }
        document.getElementById('file-input').click();
    });
    
    // Chat functionality
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Keyboard support for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTicketModal();
            closeUploadModal();
        }
    });
    
    // Modal close on outside click
    document.getElementById('upload-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeUploadModal();
        }
    });
    
    // Ticket modal close button
    document.getElementById('close-ticket-modal').addEventListener('click', closeTicketModal);
    
    // Ticket modal close on outside click
    document.getElementById('ticket-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTicketModal();
        }
    });
}

// Load dashboard data
async function loadDashboard() {
    try {
        showLoadingState();
        const response = await fetch(`${API_BASE_URL}/fetch`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allTickets = data;
        filteredTickets = [...allTickets];
        
        displayTickets();
        updatePagination();
        createCharts();
        hideLoadingState();
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Error loading tickets. Please try again.', 'error');
        hideLoadingState();
    }
}

// Display tickets in table
function displayTickets() {
    const tbody = document.getElementById('tickets-tbody');
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    const pageTickets = filteredTickets.slice(startIndex, endIndex);
    
    if (pageTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">
                    No tickets found
                </td>
            </tr>
        `;
        return;
    }
    
    pageTickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="ticket-id-link" data-ticket-id="${ticket.id}">${ticket.id || 'N/A'}</span></td>
            <td>${truncateText(ticket.subject || 'N/A', 50)}</td>
            <td>${truncateText(ticket.body || 'N/A', 100)}</td>
            <td><span class="priority-badge priority-${ticket.priority?.toLowerCase() || 'unknown'}">${ticket.priority || 'N/A'}</span></td>
            <td>${ticket.topics || 'N/A'}</td>
            <td>${truncateText(ticket.keywords || 'N/A', 30)}</td>
            <td>${ticket.sentiment || 'N/A'}</td>
            <td>${formatDate(ticket.created_at) || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add click event listeners to ticket ID links
    tbody.querySelectorAll('.ticket-id-link').forEach(link => {
        link.addEventListener('click', function() {
            const ticketId = this.dataset.ticketId;
            const ticket = allTickets.find(t => t.id === ticketId);
            if (ticket) {
                showTicketDetails(ticket);
            }
        });
    });
}

// Apply filters
function applyFilters() {
    const priorityFilter = document.getElementById('priority-filter').value;
    const sentimentFilter = document.getElementById('sentiment-filter').value;
    const topicFilter = document.getElementById('topic-filter').value;
    const keywordFilter = document.getElementById('keyword-search').value.toLowerCase();
    
    filteredTickets = allTickets.filter(ticket => {
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesSentiment = !sentimentFilter || ticket.sentiment === sentimentFilter;
        const matchesTopic = !topicFilter || 
            (ticket.topics && ticket.topics.toLowerCase().includes(topicFilter.toLowerCase()));
        const matchesKeyword = !keywordFilter || 
            (ticket.keywords && ticket.keywords.toLowerCase().includes(keywordFilter)) ||
            (ticket.subject && ticket.subject.toLowerCase().includes(keywordFilter)) ||
            (ticket.body && ticket.body.toLowerCase().includes(keywordFilter));
        
        return matchesPriority && matchesSentiment && matchesTopic && matchesKeyword;
    });
    
    currentPage = 1;
    displayTickets();
    updatePagination();
    createCharts();
}

// Clear filters
function clearFilters() {
    document.getElementById('priority-filter').value = '';
    document.getElementById('sentiment-filter').value = '';
    document.getElementById('topic-filter').value = '';
    document.getElementById('keyword-search').value = '';
    
    filteredTickets = [...allTickets];
    currentPage = 1;
    displayTickets();
    updatePagination();
    createCharts();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Generate page numbers
    pageNumbers.innerHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbers.appendChild(pageBtn);
    }
}

// Navigation functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTickets();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayTickets();
        updatePagination();
    }
}

function goToPage(page) {
    currentPage = page;
    displayTickets();
    updatePagination();
}

// File upload functionality
function openUploadModal() {
    if (isUploading) {
        showNotification('Please wait for the current upload to complete.', 'error');
        return;
    }
    document.getElementById('upload-modal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
    resetUploadForm();
}

function resetUploadForm() {
    document.getElementById('file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('confirm-upload').disabled = true;
}

function handleFileSelect(event) {
    if (isUploading) {
        showNotification('Please wait for the current upload to complete.', 'error');
        event.target.value = '';
        return;
    }
    
    const file = event.target.files[0];
    if (file) {
        if (file.type === 'application/json') {
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = formatFileSize(file.size);
            document.getElementById('file-info').style.display = 'block';
            document.getElementById('confirm-upload').disabled = false;
        } else {
            showNotification('Please select a valid JSON file.', 'error');
            resetUploadForm();
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file first.', 'error');
        return;
    }
    
    if (isUploading) {
        showNotification('Please wait for the current upload to complete.', 'error');
        return;
    }
    
    try {
        const fileContent = await readFileAsText(file);
        const jsonData = JSON.parse(fileContent);
        
        if (!Array.isArray(jsonData)) {
            showNotification('JSON file must contain an array of objects.', 'error');
            return;
        }
        
        // Set uploading state
        isUploading = true;
        updateUploadButtonState();
        
        closeUploadModal();
        showProcessingPopup();
        
        const response = await fetch(`${API_BASE_URL}/input`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });
        
        hideProcessingPopup();
        
        if (response.status === 200) {
            showNotification('Tickets have been processed successfully!', 'success');
            // Reload dashboard to show new tickets
            setTimeout(() => {
                loadDashboard();
            }, 1000);
        } else if (response.status === 500) {
            showNotification('Some issue occurred in processing the files.', 'error');
        } else {
            showNotification('An unexpected error occurred.', 'error');
        }
        
    } catch (error) {
        hideProcessingPopup();
        console.error('Error uploading file:', error);
        showNotification('Error processing file. Please check the file format.', 'error');
    } finally {
        // Reset uploading state
        isUploading = false;
        updateUploadButtonState();
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

// Processing popup
function showProcessingPopup() {
    document.getElementById('processing-popup').classList.add('show');
}

function hideProcessingPopup() {
    document.getElementById('processing-popup').classList.remove('show');
}

// Update upload button state
function updateUploadButtonState() {
    const uploadBtn = document.getElementById('upload-btn');
    if (isUploading) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        uploadBtn.style.opacity = '0.6';
    } else {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-plus"></i> Upload JSON';
        uploadBtn.style.opacity = '1';
    }
}

// Ticket details modal functions
function showTicketDetails(ticket) {
    const modal = document.getElementById('ticket-modal');
    const body = document.getElementById('ticket-details-body');
    
    // Create keywords tags
    const keywords = ticket.keywords ? ticket.keywords.split(',').map(k => k.trim()) : [];
    const keywordsHtml = keywords.map(keyword => 
        `<span class="keyword-tag">${keyword}</span>`
    ).join('');
    
    // Create topics tags
    const topics = ticket.topics ? ticket.topics.split(',').map(t => t.trim()) : [];
    const topicsHtml = topics.map(topic => 
        `<span class="topic-tag">${topic}</span>`
    ).join('');
    
    // Get sentiment class
    const sentimentClass = ticket.sentiment ? `sentiment-${ticket.sentiment.toLowerCase()}` : '';
    
    body.innerHTML = `
        <div class="ticket-details">
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">ID</div>
                <div class="ticket-detail-value">${ticket.id || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Subject</div>
                <div class="ticket-detail-value">${ticket.subject || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Body</div>
                <div class="ticket-detail-value body">${ticket.body || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Priority</div>
                <div class="ticket-detail-value priority">
                    <span class="priority-badge priority-${ticket.priority?.toLowerCase() || 'unknown'}">${ticket.priority || 'N/A'}</span>
                </div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Topics</div>
                <div class="ticket-detail-value topics">${topicsHtml || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Keywords</div>
                <div class="ticket-detail-value keywords">${keywordsHtml || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Sentiment</div>
                <div class="ticket-detail-value sentiment ${sentimentClass}">${ticket.sentiment || 'N/A'}</div>
            </div>
            
            <div class="ticket-detail-item">
                <div class="ticket-detail-label">Created At</div>
                <div class="ticket-detail-value">${formatDate(ticket.created_at) || 'N/A'}</div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.remove('active');
}

// Chat functionality
function loadChat() {
    // Initialize chat if needed
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages.children.length === 1) {
        // Only the welcome message exists
        return;
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || isProcessing) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    isProcessing = true;
    updateSendButton();
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message,
                user_id: currentUserId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add bot response
        addMessageToChat(data.LLM_Response, 'bot');
        
        // Add cited URLs if any
        if (data.Cited_URLs && data.Cited_URLs.length > 0) {
            addUrlsToChat(data.Cited_URLs);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator(typingId);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
        isProcessing = false;
        updateSendButton();
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (sender === 'bot') {
        content.innerHTML = `
            <i class="fas fa-robot"></i>
            <p>${message}</p>
        `;
    } else {
        content.innerHTML = `<p>${message}</p>`;
    }
    
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUrlsToChat(urls) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const urlsHtml = urls.map(url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`).join('');
    
    content.innerHTML = `
        <i class="fas fa-link"></i>
        <div>
            <p><strong>Referenced URLs:</strong></p>
            <div class="message-urls">${urlsHtml}</div>
        </div>
    `;
    
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message typing-indicator';
    messageDiv.id = 'typing-' + Date.now();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
        <i class="fas fa-robot"></i>
        <p>AI is typing...</p>
    `;
    
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv.id;
}

function removeTypingIndicator(id) {
    const typingElement = document.getElementById(id);
    if (typingElement) {
        typingElement.remove();
    }
}

function updateSendButton() {
    const sendBtn = document.getElementById('send-btn');
    if (isProcessing) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
        return dateString;
    }
}

function showLoadingState() {
    // You can add a loading spinner here if needed
    console.log('Loading...');
}

function hideLoadingState() {
    // Hide loading spinner
    console.log('Loading complete');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.className = `notification ${type} show`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Handle page visibility change to maintain user session
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, maintain session
        console.log('Page hidden, maintaining session');
    } else {
        // Page is visible again
        console.log('Page visible, session active');
    }
});

// Handle beforeunload to clean up if needed
window.addEventListener('beforeunload', function() {
    // Clean up any ongoing processes if needed
    console.log('Page unloading, cleaning up...');
});

// Chart creation functions
function createCharts() {
    if (allTickets.length === 0) return;
    
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
    
    createPriorityChart();
    createSentimentChart();
    createTopicsChart();
    createTimelineChart();
    createMatrixChart();
}

function createPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    const priorityData = getPriorityDistribution();
    
    charts.priority = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(priorityData),
            datasets: [{
                data: Object.values(priorityData),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // P0 - Red with transparency
                    'rgba(245, 158, 11, 0.8)',  // P1 - Orange with transparency
                    'rgba(16, 185, 129, 0.8)'   // P2 - Green with transparency
                ],
                borderColor: [
                    '#ef4444', // P0 - Red
                    '#f59e0b', // P1 - Orange
                    '#10b981'  // P2 - Green
                ],
                borderWidth: 3,
                hoverBackgroundColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} tickets (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createSentimentChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    const sentimentData = getSentimentDistribution();
    
    charts.sentiment = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sentimentData),
            datasets: [{
                label: 'Tickets',
                data: Object.values(sentimentData),
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',   // Confused - Yellow
                    'rgba(59, 130, 246, 0.8)',   // Curious - Blue
                    'rgba(239, 68, 68, 0.8)',    // Anxious - Red
                    'rgba(34, 197, 94, 0.8)',    // Hopeful - Green
                    'rgba(239, 68, 68, 0.8)',    // Frustrated - Red
                    'rgba(220, 38, 38, 0.8)'     // Urgent - Dark Red
                ],
                borderColor: [
                    '#d97706', // Confused
                    '#1e40af', // Curious
                    '#dc2626', // Anxious
                    '#16a34a', // Hopeful
                    '#dc2626', // Frustrated
                    '#dc2626'  // Urgent
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: [
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(220, 38, 38, 1)'
                ],
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y} tickets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createTopicsChart() {
    try {
        const ctx = document.getElementById('topicsChart').getContext('2d');
        const topicsData = getTopicsDistribution();
        
        
        charts.topics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(topicsData),
            datasets: [{
                label: 'Tickets',
                data: Object.values(topicsData),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(129, 140, 248, 0.8)',
                    'rgba(165, 180, 252, 0.8)',
                    'rgba(196, 181, 253, 0.8)',
                    'rgba(221, 214, 254, 0.8)',
                    'rgba(245, 243, 255, 0.8)'
                ],
                borderColor: [
                    '#667eea',
                    '#4f46e5',
                    '#6366f1',
                    '#818cf8',
                    '#a5b4fc',
                    '#c4b5fd',
                    '#ddd6fe',
                    '#f5f3ff'
                ],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
                hoverBackgroundColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(79, 70, 229, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(129, 140, 248, 1)',
                    'rgba(165, 180, 252, 1)',
                    'rgba(196, 181, 253, 1)',
                    'rgba(221, 214, 254, 1)',
                    'rgba(245, 243, 255, 1)'
                ],
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.x} tickets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
    } catch (error) {
        console.error('Error creating topics chart:', error);
    }
}

function createTimelineChart() {
    try {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        const timelineData = getTimelineData();
        
        
        // Create gradient for the line chart
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.1)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

        charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.labels,
            datasets: [{
                label: 'Tickets Created',
                data: timelineData.data,
                borderColor: '#667eea',
                backgroundColor: gradient,
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#4f46e5',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 4,
                hoverBackgroundColor: 'rgba(102, 126, 234, 0.2)',
                hoverBorderWidth: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} tickets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    } catch (error) {
        console.error('Error creating timeline chart:', error);
    }
}

function createMatrixChart() {
    const ctx = document.getElementById('matrixChart').getContext('2d');
    const matrixData = getPrioritySentimentMatrix();
    
    charts.matrix = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['P0', 'P1', 'P2'],
            datasets: Object.keys(matrixData[0]).map((sentiment, index) => ({
                label: sentiment,
                data: matrixData.map(row => row[sentiment] || 0),
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',   // Confused - Yellow
                    'rgba(59, 130, 246, 0.8)',   // Curious - Blue
                    'rgba(239, 68, 68, 0.8)',    // Anxious - Red
                    'rgba(34, 197, 94, 0.8)',    // Hopeful - Green
                    'rgba(239, 68, 68, 0.8)',    // Frustrated - Red
                    'rgba(220, 38, 38, 0.8)'     // Urgent - Dark Red
                ][index % 6],
                borderColor: [
                    '#d97706', '#1e40af', '#dc2626', 
                    '#16a34a', '#dc2626', '#dc2626'
                ][index % 6],
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
                hoverBackgroundColor: [
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(220, 38, 38, 1)'
                ][index % 6],
                hoverBorderWidth: 3
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} tickets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Data processing functions
function getPriorityDistribution() {
    const distribution = { P0: 0, P1: 0, P2: 0 };
    filteredTickets.forEach(ticket => {
        const priority = ticket.priority || 'Unknown';
        distribution[priority] = (distribution[priority] || 0) + 1;
    });
    return distribution;
}

function getSentimentDistribution() {
    const distribution = {};
    filteredTickets.forEach(ticket => {
        const sentiment = ticket.sentiment || 'Unknown';
        distribution[sentiment] = (distribution[sentiment] || 0) + 1;
    });
    return distribution;
}

function getTopicsDistribution() {
    const distribution = {};
    
    filteredTickets.forEach(ticket => {
        if (ticket.topics) {
            // Handle both comma-separated and single topic formats
            const topics = ticket.topics.includes(',') 
                ? ticket.topics.split(',').map(t => t.trim())
                : [ticket.topics.trim()];
            
            topics.forEach(topic => {
                if (topic) {
                    distribution[topic] = (distribution[topic] || 0) + 1;
                }
            });
        }
    });
    
    // Sort by count and take top 8
    const result = Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
    
    return result;
}

function getTimelineData() {
    const timeline = {};
    
    filteredTickets.forEach(ticket => {
        if (ticket.created_at) {
            try {
                const date = new Date(ticket.created_at);
                if (!isNaN(date.getTime())) {
                    const dateStr = date.toISOString().split('T')[0];
                    timeline[dateStr] = (timeline[dateStr] || 0) + 1;
                }
            } catch (e) {
                console.warn('Invalid date format:', ticket.created_at);
            }
        }
    });
    
    const sortedDates = Object.keys(timeline).sort();
    const last7Days = sortedDates.slice(-7);
    
    // If we have no data, create some sample data for the last 7 days
    if (last7Days.length === 0) {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(dateStr);
            timeline[dateStr] = 0;
        }
    }
    
    const result = {
        labels: last7Days.map(date => new Date(date).toLocaleDateString()),
        data: last7Days.map(date => timeline[date] || 0)
    };
    
    return result;
}

function getPrioritySentimentMatrix() {
    const matrix = [
        { Confused: 0, Curious: 0, Anxious: 0, Hopeful: 0, Frustrated: 0, Urgent: 0 },
        { Confused: 0, Curious: 0, Anxious: 0, Hopeful: 0, Frustrated: 0, Urgent: 0 },
        { Confused: 0, Curious: 0, Anxious: 0, Hopeful: 0, Frustrated: 0, Urgent: 0 }
    ];
    
    filteredTickets.forEach(ticket => {
        const priority = ticket.priority;
        const sentiment = ticket.sentiment;
        
        if (priority && sentiment) {
            let priorityIndex;
            if (priority === 'P0') priorityIndex = 0;
            else if (priority === 'P1') priorityIndex = 1;
            else if (priority === 'P2') priorityIndex = 2;
            else return;
            
            if (matrix[priorityIndex][sentiment] !== undefined) {
                matrix[priorityIndex][sentiment]++;
            }
        }
    });
    
    return matrix;
}
