// ===== HILFSFUNKTIONEN (für alle Dateien) =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Aktiv',
        'inactive': 'Inaktiv',
        'pending': 'Ausstehend'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===== SUPABASE KONFIG (für alle Dateien) =====
window.SUPABASE_URL = 'https://wotwmwcgbihlhlcwlvbm.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHdtd2NnYmlobGhsY3dsdmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzc4MDcsImV4cCI6MjA4NjA1MzgwN30.Zwt-clrOnntZQZ_NvpKJVB5xBCZTl_PgzrC9F_7F-uU';
