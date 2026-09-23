// ============================================================
// SUPABASE CLIENT - COMPARTIDO
// ============================================================

const SUPABASE_URL = 'https://jvngqoqfregogrqojep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bmdxb3FmcmVnb3FncnFvamVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODYxNDYsImV4cCI6MjEwMzQ2MjE0Nn0.fO7yDpC3pJrs6NSYGNqdN4oT_0IHiggTVTLudNkrqsc';

const SB_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
};

const SB_HEADERS_JSON = {
    ...SB_HEADERS,
    'Prefer': 'return=representation'
};

// Helper genérico de fetch
async function sbFetch(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1${path}`;
    const res = await fetch(url, {
        ...options,
        headers: { ...SB_HEADERS_JSON, ...(options.headers || {}) }
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase error ${res.status}: ${err}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ============================================================
// HEALTH CHECK
// ============================================================
async function checkDBStatus() {
    const badge = document.getElementById('dbStatusBadge');
    const dot = document.getElementById('dbStatusDot');
    const txt = document.getElementById('dbStatusText');
    if (!badge) return;

    badge.className = 'db-status-badge testing';
    dot.className = 'db-status-dot testing';
    txt.textContent = 'Verificando...';

    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/ayllu_clientes?select=id&limit=1`, {
            headers: SB_HEADERS
        });
        if (r.ok) {
            badge.className = 'db-status-badge online';
            dot.className = 'db-status-dot online';
            txt.textContent = '🟢 DB Online';
        } else {
            throw new Error('Not OK');
        }
    } catch (e) {
        badge.className = 'db-status-badge offline';
        dot.className = 'db-status-dot offline';
        txt.textContent = '🔴 DB Offline';
    }
}

// Inicializar chequeo automático
document.addEventListener('DOMContentLoaded', () => {
    checkDBStatus();
    setInterval(checkDBStatus, 60000);
});
