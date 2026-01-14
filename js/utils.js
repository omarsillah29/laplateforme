// Clé pour le stockage local
const SESSION_KEY = 'plateforme_presence_session';

/**
 * Sauvegarde les informations de session de l'utilisateur.
 * @param {object} user - L'objet utilisateur à sauvegarder.
 */
function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Récupère les informations de session de l'utilisateur.
 * @returns {object | null} L'utilisateur connecté ou null.
 */
function getSession() {
    const sessionString = localStorage.getItem(SESSION_KEY);
    return sessionString ? JSON.parse(sessionString) : null;
}

/**
 * Efface les informations de session (déconnexion).
 */
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Vérifie si un utilisateur est connecté.
 * Redirige vers la page de connexion si ce n'est pas le cas.
 * @param {Array<string>} [allowedRoles] - Optionnel. Liste des rôles autorisés pour la page.
 */
function protectPage(allowedRoles) {
    const user = getSession();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        window.location.href = 'dashboard.html'; // Redirige vers le dashboard si rôle non autorisé
    }
}
