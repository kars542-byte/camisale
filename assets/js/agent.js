cat > assets/js/agent.js << 'EOF'
// ============================================================
// AGENTIC IA - LÓGICA DE LA TERMINAL
// ============================================================

// ⚙️ CONFIGURACIÓN: URL de tu API Flask
// Cuando tengas el Cloudflare Tunnel activo, pega aquí la URL
// Ej: 'https://api.camisale.work' o 'https://xxxx.trycloudflare.com'
const API_URL = '';  // ← dejar vacío hasta que tengas el tunnel

const screenEl = document.getElementById('screen');
const promptInput = document.getElementById('promptInput');
const runBtn = document.getElementById('runBtn');
const pushBtn = document.getElementById('pushBtn');
const clearBtn = document.getElementById('clearBtn');
const apiStatusText = document.getElementById('apiStatusText');
const apiDot = document.getElementById('apiDot');
const infoBox = document.getElementById('infoBox');

let lastPrompt = '';
let hasChanges = false;

// ============================================================
// HELPERS DE PANTALLA
// ============================================================
function addLine(text, type = 'info') {
    const div = document.createElement('div');
    div.className = `line ${type}`;
    div.textContent = text;

    const cursorLine = screenEl.querySelector('.line.prompt:last-child');
    if (cursorLine) {
        screenEl.insertBefore(div, cursorLine);
    } else {
        screenEl.appendChild(div);
    }
    screenEl.scrollTop = screenEl.scrollHeight;
}

function addPromptLine(text) {
    const oldCursor = screenEl.querySelector('.cursor');
    if (oldCursor) oldCursor.remove();

    const div = document.createElement('div');
    div.className = 'line prompt';
    div.innerHTML = text;
    screenEl.appendChild(div);

    const cursorDiv = document.createElement('div');
    cursorDiv.className = 'line prompt';
    cursorDiv.innerHTML = 'Esperando instrucción...<span class="cursor"></span>';
    screenEl.appendChild(cursorDiv);

    screenEl.scrollTop = screenEl.scrollHeight;
}

function clearScreen() {
    screenEl.innerHTML = `
        <div class="line system">╔══════════════════════════════════════════════╗</div>
        <div class="line system">║  AGENTIC_IA - Terminal de Comandos          ║</div>
        <div class="line system">║  camisale.work · Agentic Engine v1.0        ║</div>
        <div class="line system">╚══════════════════════════════════════════════╝</div>
        <div class="line">&nbsp;</div>
        <div class="line info">Pantalla limpiada. Listo para nueva instrucción.</div>
        <div class="line">&nbsp;</div>
        <div class="line prompt">Esperando instrucción...<span class="cursor"></span></div>
    `;
}

// ============================================================
// HEALTH CHECK
// ============================================================
async function checkAPIHealth() {
    if (!API_URL) {
        apiDot.className = 'dot offline';
        apiStatusText.textContent = 'API NO CONFIGURADA';
        apiStatusText.style.color = '#ffaa00';
        infoBox.textContent = '⚠️ API no configurada. Pega la URL en assets/js/agent.js';
        addLine('⚠️  API no configurada. Contacta al administrador.', 'warning');
        addLine('💡 Mientras tanto, la terminal es de solo lectura.', 'info');
        return false;
    }

    try {
        const r = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (r.ok) {
            apiDot.className = 'dot online';
            apiStatusText.textContent = 'ONLINE';
            apiStatusText.style.color = '#00ff41';
            infoBox.textContent = '✅ API conectada. Listo para recibir comandos.';
            return true;
        } else {
            throw new Error('Not OK');
        }
    } catch (e) {
        apiDot.className = 'dot offline';
        apiStatusText.textContent = 'OFFLINE';
        apiStatusText.style.color = '#ff0040';
        infoBox.textContent = '⚠️ API no conectada. Verifica que esté ejecutándose.';
        return false;
    }
}

// ============================================================
// EJECUTAR AGENTE
// ============================================================
async function runAgent() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        addLine('⚠️ ERROR: Debes escribir un comando.', 'error');
        return;
    }

    if (!API_URL) {
        addLine('❌ API no configurada. No se puede ejecutar.', 'error');
        return;
    }

    runBtn.disabled = true;
    runBtn.textContent = '⏳...';
    pushBtn.disabled = true;
    infoBox.textContent = '⏳ Procesando comando...';

    addLine(`> ${prompt}`, 'info');
    addLine('⏳ Conectando con la IA...', 'system');

    try {
        const response = await fetch(`${API_URL}/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
            signal: AbortSignal.timeout(90000)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            addLine('✅ EJECUCIÓN COMPLETADA', 'success');
            const outputLines = (data.output || 'Sin salida').split('\n');
            outputLines.forEach(line => {
                if (line.trim()) addLine(line, 'success');
            });

            if (data.error) {
                addLine(`⚠️ ${data.error}`, 'warning');
            }

            lastPrompt = prompt;
            hasChanges = true;
            pushBtn.disabled = false;
            pushBtn.textContent = '📤 PUSH a GitHub';
            infoBox.textContent = '✅ Cambios listos. Presiona PUSH para publicar.';
        } else {
            addLine(`❌ ERROR: ${data.error || 'Error desconocido'}`, 'error');
            infoBox.textContent = '❌ Error en la ejecución.';
        }

    } catch (error) {
        addLine(`❌ ERROR DE CONEXIÓN: ${error.message}`, 'error');
        addLine('💡 Verifica que la API Flask esté ejecutándose', 'warning');
        infoBox.textContent = '❌ Error de conexión con la API.';
    }

    runBtn.disabled = false;
    runBtn.textContent = '▶ Run';
    promptInput.value = '';
    promptInput.focus();
}

// ============================================================
// PUSH A GITHUB
// ============================================================
async function pushToGitHub() {
    if (!hasChanges) {
        addLine('⚠️ No hay cambios para publicar.', 'warning');
        return;
    }

    if (!API_URL) {
        addLine('❌ API no configurada.', 'error');
        return;
    }

    if (!confirm('¿Publicar los cambios en GitHub?')) return;

    pushBtn.disabled = true;
    pushBtn.textContent = '⏳ Publicando...';
    infoBox.textContent = '📤 Publicando en GitHub...';

    addLine('📤 Iniciando push a GitHub...', 'system');

    try {
        const response = await fetch(`${API_URL}/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: lastPrompt,
                message: `Agentic update: ${lastPrompt.substring(0, 50)}`
            }),
            signal: AbortSignal.timeout(60000)
        });

        const data = await response.json();

        if (data.success) {
            addLine('✅ PUSH COMPLETADO', 'success');
            addLine(`🔗 ${data.repo_url || 'GitHub actualizado'}`, 'success');
            addLine('⏳ GitHub Pages se actualizará en 1-2 minutos.', 'info');

            hasChanges = false;
            pushBtn.textContent = '✅ Publicado';
            infoBox.textContent = '✅ Cambios publicados. Se reflejarán en 1-2 minutos.';

            setTimeout(() => {
                pushBtn.textContent = '📤 PUSH a GitHub';
                pushBtn.disabled = true;
            }, 5000);
        } else {
            addLine(`❌ ERROR EN PUSH: ${data.error}`, 'error');
            infoBox.textContent = '❌ Error al publicar.';
            pushBtn.disabled = false;
            pushBtn.textContent = '📤 Reintentar PUSH';
        }

    } catch (error) {
        addLine(`❌ ERROR DE CONEXIÓN: ${error.message}`, 'error');
        infoBox.textContent = '❌ Error de conexión al publicar.';
        pushBtn.disabled = false;
        pushBtn.textContent = '📤 Reintentar PUSH';
    }
}

// ============================================================
// EVENTOS
// ============================================================
runBtn.addEventListener('click', runAgent);
pushBtn.addEventListener('click', pushToGitHub);
clearBtn.addEventListener('click', clearScreen);
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        runAgent();
    }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    setInterval(checkAPIHealth, 30000);
    promptInput.focus();

    console.log('🎮 Agentic IA - Terminal cargada');
    console.log(`📡 API: ${API_URL || '(no configurada)'}`);
});
EOF
