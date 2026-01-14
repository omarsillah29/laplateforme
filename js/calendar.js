document.addEventListener('DOMContentLoaded', () => {
    protectPage(); // Sécurise la page

    const user = getSession();
    if (!user) return; // Si pas d'utilisateur, protectPage redirigera

    // Affiche le lien admin si l'utilisateur est admin ou modérateur
    const adminLinkContainer = document.getElementById('admin-link-container');
    if (user.role === 'admin' || user.role === 'moderator') {
        adminLinkContainer.style.display = 'block';
    }

    // Gestion de la déconnexion
    document.getElementById('logout-btn').addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
    });

    document.getElementById('welcome-message').textContent = `Bienvenue, ${user.email}`;

    initializeCalendar();
    displayMyRequests();
});

let currentDate = new Date();
let selectedDates = [];

function initializeCalendar() {
    document.getElementById('prev-month-btn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month-btn').addEventListener('click', () => changeMonth(1));
    document.getElementById('request-presence-btn').addEventListener('click', submitPresenceRequest);
    renderCalendar();
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('current-month-year').textContent = `${currentDate.toLocaleString('fr-FR', { month: 'long' })} ${year}`;

    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';

    // Jours de la semaine
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    daysOfWeek.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day header';
        dayEl.textContent = day;
        calendarGrid.appendChild(dayEl);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'calendar-day not-in-month';
        calendarGrid.appendChild(emptyEl);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;

        const date = new Date(year, month, i);
        date.setHours(0, 0, 0, 0);
        const dateString = date.toISOString().split('T')[0];

        if (date < today) {
            dayEl.classList.add('past');
        } else {
            dayEl.addEventListener('click', () => toggleDateSelection(dayEl, dateString));
        }

        calendarGrid.appendChild(dayEl);
    }
}

function toggleDateSelection(dayEl, dateString) {
    const index = selectedDates.indexOf(dateString);
    if (index > -1) {
        selectedDates.splice(index, 1);
        dayEl.classList.remove('selected');
    } else {
        selectedDates.push(dateString);
        dayEl.classList.add('selected');
    }
}

// Instead of getDatabase, always fetch requests from api/data.php

async function getRequests() {
    const resp = await fetch('api/data.php?type=requests');
    return await resp.json();
}

async function addPresenceRequests(requestsToAdd) {
    for (const single of requestsToAdd) {
        await fetch('api/data.php?type=requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(single)
        });
    }
}

async function deleteRequest(requestId) {
    await fetch('api/data.php?type=requests', {
        method: 'DELETE',
        body: `id=${encodeURIComponent(requestId)}`
    });
}

// In submitPresenceRequest, use addPresenceRequests and getRequests
async function submitPresenceRequest() {
    if (selectedDates.length === 0) {
        showNotification('Veuillez sélectionner au moins une date.', 'danger');
        return;
    }

    const user = getSession();
    const allRequests = await getRequests();
    const requestsToAdd = [];
    selectedDates.forEach(date => {
        const existing = allRequests.find(r => r.user === user.email && r.date === date);
        if (!existing) {
            requestsToAdd.push({ user: user.email, date, status: 'en attente' });
        }
    });
    await addPresenceRequests(requestsToAdd);
    selectedDates = [];
    renderCalendar();
    await displayMyRequests();
    showNotification('Vos demandes de présence ont été envoyées.', 'success');
}

async function displayMyRequests() {
    const user = getSession();
    const allRequests = await getRequests();
    const tbody = document.getElementById('my-requests-tbody');
    tbody.innerHTML = '';
    const myRequests = allRequests.filter(r => r.user === user.email).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (myRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucune demande pour le moment.</td></tr>';
        return;
    }
    myRequests.forEach(request => {
        const tr = document.createElement('tr');
        const statusBadge = getStatusBadge(request.status);
        tr.innerHTML = `\n            <td>${new Date(request.date).toLocaleDateString('fr-FR')}</td>\n            <td>${statusBadge}</td>\n            <td>\n                <button class="btn btn-danger btn-sm" onclick="cancelRequest(${request.id})" ${new Date(request.date) < new Date() || request.status !== 'en attente' ? 'disabled' : ''}>Annuler</button>\n            </td>\n        `;
        tbody.appendChild(tr);
    });
}

window.cancelRequest = async function (requestId) {
    await deleteRequest(requestId);
    await displayMyRequests();
    showNotification('La demande a été annulée.', 'success');
}


function getStatusBadge(status) {
    switch (status) {
        case 'acceptée':
            return `<span class="badge bg-success">Acceptée</span>`;
        case 'refusée':
            return `<span class="badge bg-danger">Refusée</span>`;
        case 'en attente':
        default:
            return `<span class="badge bg-warning text-dark">En attente</span>`;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
