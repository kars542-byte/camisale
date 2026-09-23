// ============================================================
// AYLLU PERU - LÓGICA
// ============================================================

async function addCliente() {
    const nombre = document.getElementById('ayllu-cliente-nombre').value.trim();
    const dpto = document.getElementById('ayllu-cliente-dpto').value.trim();
    const distrito = document.getElementById('ayllu-cliente-distrito').value.trim();
    const msg = document.getElementById('cliente-msg');
    const btn = document.getElementById('btn-add-cliente');

    if (!nombre) {
        msg.style.color = '#F44336';
        msg.textContent = '⚠️ El nombre es obligatorio';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Guardando...';

    try {
        await sbFetch('/ayllu_clientes', {
            method: 'POST',
            body: JSON.stringify({ nombre, departamento: dpto, distrito })
        });

        msg.style.color = '#2E7D32';
        msg.textContent = `✅ Cliente "${nombre}" guardado`;
        document.getElementById('ayllu-cliente-nombre').value = '';
        document.getElementById('ayllu-cliente-dpto').value = '';
        document.getElementById('ayllu-cliente-distrito').value = '';

        await cargarClientesEnSelect();
    } catch (e) {
        msg.style.color = '#F44336';
        msg.textContent = `❌ Error: ${e.message}`;
    }

    btn.disabled = false;
    btn.textContent = '➕ Guardar Cliente';
}

async function cargarClientesEnSelect() {
    const select = document.getElementById('ayllu-venta-cliente');
    if (!select) return;
    select.innerHTML = '<option value="">Cargando...</option>';

    try {
        const clientes = await sbFetch('/ayllu_clientes?select=id,nombre,distrito&order=nombre.asc');
        select.innerHTML = '<option value="">-- Seleccionar cliente --</option>';
        (clientes || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre + (c.distrito ? ` (${c.distrito})` : '');
            select.appendChild(opt);
        });
    } catch (e) {
        select.innerHTML = '<option value="">Error cargando clientes</option>';
    }
}

async function addVenta() {
    const cliente_id = document.getElementById('ayllu-venta-cliente').value;
    const cantidad = parseInt(document.getElementById('ayllu-venta-cantidad').value);
    const fecha = document.getElementById('ayllu-venta-fecha').value;
    const msg = document.getElementById('venta-msg');
    const btn = document.getElementById('btn-add-venta');

    if (!cliente_id) {
        msg.style.color = '#F44336';
        msg.textContent = '⚠️ Selecciona un cliente';
        return;
    }
    if (!cantidad || cantidad < 1) {
        msg.style.color = '#F44336';
        msg.textContent = '⚠️ Cantidad inválida';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Registrando...';

    try {
        const body = { cliente_id: parseInt(cliente_id), cantidad };
        if (fecha) body.fecha = fecha;

        await sbFetch('/ayllu_ventas', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        msg.style.color = '#2E7D32';
        msg.textContent = `✅ Venta de ${cantidad} plato(s) registrada`;
        document.getElementById('ayllu-venta-cantidad').value = 1;

        await cargarVentasHoy();
    } catch (e) {
        msg.style.color = '#F44336';
        msg.textContent = `❌ Error: ${e.message}`;
    }

    btn.disabled = false;
    btn.textContent = '➕ Registrar Venta';
}

async function cargarVentasHoy() {
    const list = document.getElementById('ventas-list');
    const counter = document.getElementById('ventas-counter');
    if (!list) return;
    const hoy = new Date().toISOString().split('T')[0];

    list.innerHTML = '<div class="empty-state">⏳ Cargando ventas del día...</div>';

    try {
        const ventas = await sbFetch(
            `/ayllu_ventas?select=id,cantidad,fecha,cliente_id,ayllu_clientes(nombre,distrito)&fecha=eq.${hoy}&order=created_at.desc`
        );

        if (!ventas || !ventas.length) {
            list.innerHTML = '<div class="empty-state">📭 No hay ventas registradas hoy</div>';
            counter.textContent = '';
            return;
        }

        const totalPlatos = ventas.reduce((s, v) => s + v.cantidad, 0);
        counter.textContent = `${ventas.length} registros · ${totalPlatos} platos`;

        let html = `<div class="header-line">> VENTAS DEL DÍA ${hoy}</div>`;

        ventas.forEach((v, i) => {
            const c = v.ayllu_clientes || {};
            const cliente = c.nombre || 'Cliente #' + v.cliente_id;
            const distrito = c.distrito ? ` (${c.distrito})` : '';
            html += `
                <div class="venta-line">
                    <span class="cliente">${String(i+1).padStart(2,'0')}. ${cliente}${distrito}</span>
                    <span><span class="cantidad">${v.cantidad} plato(s)</span> <span class="fecha">[${v.fecha}]</span></span>
                </div>
            `;
        });

        html += `<div class="total-line">> TOTAL DEL DÍA: ${totalPlatos} platos en ${ventas.length} venta(s)</div>`;
        html += `<div style="margin-top:10px;color:#8a9aa8;">> Actualizado: ${new Date().toLocaleTimeString()}</div>`;

        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = `<div class="empty-state" style="color:#F44336;">❌ Error: ${e.message}</div>`;
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const fechaInput = document.getElementById('ayllu-venta-fecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    // Solo cargar si estamos en la página de ayllu (existe el select)
    if (document.getElementById('ayllu-venta-cliente')) {
        cargarClientesEnSelect();
        cargarVentasHoy();
    }
});
