// ============================================
// COMMON HELPER FUNCTIONS
// ============================================

// --- Security ------------------------------------
// Escape HTML to prevent XSS (wird für alle User-Input verwendet)
function esc(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// --- Date/Time -----------------------------------
// Formatiert Datum zu "DD.MM.YYYY" (z.B. "15.11.2025")
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
}

// Formatiert Datum zu "DD. MMMM YYYY" (z.B. "15. November 2025")
function formatLongDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// --- Status Mapping -------------------------------
// Konvertiert Status-Codes zu lesbaren Texten
const STATUS_MAP = {
    // Review-Status
    'pending': 'Ausstehend',
    'approved': 'Genehmigt',
    'rejected': 'Abgelehnt',
    'published': 'Veröffentlicht',
    // Job-Status
    'active': 'Aktiv',
    'inactive': 'Inaktiv',
    'expired': 'Abgelaufen',
    // Company-Status
    'verified': 'Verifiziert',
    'unverified': 'Nicht verifiziert'
};

function getStatusText(status) {
    return STATUS_MAP[status] || status;
}

// --- UI Helpers ----------------------------------
// Zeigt Lade-Spinner in einem Element an
function showLoading(element) {
    if (!element) return;
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '<div class="spinner"></div>';
    element.disabled = true;
    element.classList.add('loading');
}

// Entfernt Lade-Spinner
function hideLoading(element) {
    if (!element) return;
    element.innerHTML = element.dataset.originalContent || '';
    element.disabled = false;
    element.classList.remove('loading');
}

// Zeigt Benachrichtigung (Notification Toast)
function showNotification(message, type = 'info') {
    // Alte Benachrichtigungen entfernen
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${esc(message)}</span>
        <button class="notification-close" aria-label="Schließen">×</button>
    `;
    document.body.appendChild(notification);

    // Close-Button Handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Auto-Close nach 5 Sekunden
    setTimeout(() => {
        notification.classList.add('notification-fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// --- Text Utilities -------------------------------
// Kürzt Text auf maximale Länge + "..." (z.B. für Previews)
function truncate(text, maxLength) {
    if (!text) return '';
    return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Validation ---------------------------------
// Prüft, ob eine E-Mail gültig ist
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Prüft, ob ein Wert leer ist (null, undefined, empty string)
function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

// --- Debounce (für Suchfelder) ------------------
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Local Storage Helpers -----------------------
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('LocalStorage Error:', e);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('LocalStorage Error:', e);
        return defaultValue;
    }
}
