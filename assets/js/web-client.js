cat > assets/js/web-clients.js << 'EOF'
// ============================================================
// WEB CLIENTS - LÓGICA
// ============================================================

async function addWebCliente() {
    const nombre = document.getElementById('web-cliente-nombre').value.trim();
    const contacto = document.getElementById('web-cliente-contacto').value.trim();
    const tipo = document.getElementById('web-cliente-tipo').value;
    const estado = document.getElementById('web-cliente-estado').value;
    const monto = parseFloat(document.getElementById('web-cliente-monto').value) || 0;
    const notas = document.getElementById('web-cliente-notas').value.trim();
    const msg = document.getElementById('web-cliente-msg');
    const btn = document.getElementById('btn-add-web-cliente');

    if (!nombre) {
        msg.style.color = '#F44336';
        msg.textContent = '⚠️ El nombre es obligatorio';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Guardando...';

    try {
        await sbFetch('/web_clientes', {
            method: 'POST',
            body: JSON.stringify({ nombre, contacto, tipo, estado, monto, notas })
        });

        msg.style.color = '#065F46';
        msg.textContent = `✅ Cliente "${nombre}" guardado`;
        ['web-cliente-nombre','web-cliente-contacto','web-cliente-notas'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('web-cliente-monto').value = 0;

        await cargarWebClientes();
    } catch (e) {
        msg.style.color = '#F44336';
        msg.textContent = `❌ Error: ${e.message}`;
    }

    btn.disabled = false;
    btn.textContent = '➕ Guardar Cliente';
}

async function cargarWebClientes() {
    const tbody = document.getElementById('web-clientes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Cargando...</td></tr>';

    try {
        const clientes = await sbFetch('/web_clientes?select=*&order=created_at.desc');
        const lista = clientes || [];

        if (!lista.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">No hay clientes registrados</td></tr>';
        } else {
            tbody.innerHTML = lista.map(c => `
                <tr>
                    <td><strong>${c.nombre}</strong></td>
                    <td>${c.contacto || '-'}</td>
                    <td>${c.tipo || '-'}</td>
                    <td><span class="web-badge ${c.estado}">${c.estado}</span></td>
                    <td>S/ ${(c.monto || 0).toFixed(0)}</td>
                    <td>
                        <button onclick="deleteWebCliente(${c.id}, '${c.nombre}')" 
                                style="background:#F44336;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">
                            ✕
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar stats
        const total = lista.length;
        const activos = lista.filter(c => c.estado === 'activo').length;
        const prospectos = lista.filter(c => c.estado === 'prospecto').length;
        const mrr = lista.filter(c => c.estado === 'activo').reduce((s, c) => s + (c.monto || 0), 0);

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-activos').textContent = activos;
        document.getElementById('stat-prospectos').textContent = prospectos;
        document.getElementById('stat-mrr').textContent = `S/ ${mrr.toFixed(0)}`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#F44336;">❌ Error: ${e.message}</td></tr>`;
    }
}

async function deleteWebCliente(id, nombre) {
    if (!confirm(`¿Eliminar al cliente "${nombre}"?`)) return;

    try {
        await sbFetch(`/web_clientes?id=eq.${id}`, { method: 'DELETE' });
        await cargarWebClientes();
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('web-clientes-tbody')) {
        cargarWebClientes();
    }
});
