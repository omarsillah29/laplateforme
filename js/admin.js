document.addEventListener('DOMContentLoaded', () => {
    // Protège la page, autorise uniquement les modérateurs et les administrateurs
    protectPage(['moderator', 'admin']);

    const user = getSession();
    if (!user) return; // Sécurité supplémentaire

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

    // La section de gestion des utilisateurs n'est visible que par les administrateurs
    if (user.role === 'admin') {
        document.getElementById('user-management-section').style.display = 'block';
        displayUsers();
    }

    displayAllRequests();
});

async function getRequests() {
    const resp = await fetch('api/data.php?type=requests');
    return await resp.json();
}
async function getUsers() {
    const resp = await fetch('api/data.php?type=users');
    return await resp.json();
}
async function updateRequestStatusAPI(requestId, newStatus) {
    await fetch('api/data.php?type=requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id: requestId, status: newStatus})
    });
}
async function updateUserRoleAPI(userEmail, newRole) {
    await fetch('api/data.php?type=users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({email: userEmail, role: newRole})
    });
}
async function deleteUserAPI(userEmail) {
    await fetch('api/data.php?type=users', {
        method: 'DELETE',
        body: `email=${encodeURIComponent(userEmail)}&cascade=1`
    });
}

/**
 * Affiche toutes les demandes de présence dans le tableau.
 */
async function displayAllRequests() {
    const requests = await getRequests();
    const tbody = document.getElementById('all-requests-tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(requests) || requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Aucune demande de présence à traiter.</td></tr>';
        return;
    }

    requests.sort((a,b) => new Date(b.date) - new Date(a.date));

    requests.forEach(request => {
        const tr = document.createElement('tr');
        const statusBadge = getStatusBadge(request.status);

        tr.innerHTML = `
            <td>${request.user}</td>
            <td>${new Date(request.date).toLocaleDateString('fr-FR')}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="updateRequestStatus(${request.id}, 'acceptée')" ${request.status !== 'en attente' ? 'disabled' : ''}>Accept</button>
                <button class="btn btn-danger btn-sm" onclick="updateRequestStatus(${request.id}, 'refusée')" ${request.status !== 'en attente' ? 'disabled' : ''}>Deny</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateRequestStatus = async function(requestId, newStatus) {
    await updateRequestStatusAPI(requestId, newStatus);
    await displayAllRequests();
}

/**
 * Affiche tous les utilisateurs dans le tableau d'administration.
 */
async function displayUsers() {
    const usersObj = await getUsers();
    const users = Object.values(usersObj);
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.email}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateUserRole('${user.email}', this.value)">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Modérateur</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                </select>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.email}')">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateUserRole = async function(userEmail, newRole) {
    await updateUserRoleAPI(userEmail, newRole);
    await displayUsers();
}

window.deleteUser = async function(userEmail) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
        const currentUser = getSession();
        if (currentUser.email === userEmail) {
            alert("Vous ne pouvez pas supprimer votre propre compte.");
            return;
        }
        await deleteUserAPI(userEmail);
        await displayUsers();
        await displayAllRequests();
    }
}

// Fonction utilitaire pour les badges de statut (peut être partagée)
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
