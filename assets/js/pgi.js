// ============================================================
// PGI - BUILDING ADMIN (migrado a módulo independiente)
// ============================================================

let pgiState = {
    users: [],
    parking: [],
    tickets: [],
    closedTickets: [],
    currentUser: null,
    currentTab: 'dashboard',
    nextTicketId: 1003,
    nextUserId: 10,
};

// ============================================================
// LOCALSTORAGE
// ============================================================
function saveToLocalStorage() {
    try {
        localStorage.setItem('pgi_admin_data_v4', JSON.stringify({
            users: pgiState.users,
            parking: pgiState.parking,
            tickets: pgiState.tickets,
            closedTickets: pgiState.closedTickets,
            nextTicketId: pgiState.nextTicketId,
            nextUserId: pgiState.nextUserId,
        }));
    } catch (e) { console.error('Error guardando:', e); }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('pgi_admin_data_v4');
        if (saved) {
            const data = JSON.parse(saved);
            pgiState.users = data.users || [];
            pgiState.parking = data.parking || [];
            pgiState.tickets = data.tickets || [];
            pgiState.closedTickets = data.closedTickets || [];
            pgiState.nextTicketId = data.nextTicketId || 1003;
            pgiState.nextUserId = data.nextUserId || 10;
            return true;
        }
    } catch (e) { console.error('Error cargando:', e); }
    return false;
}

function loadDefaultData() {
    pgiState.users = [
        { id:'u1', username:'admin', password:'admin123', name:'Administrador', role:'admin', building:'all', status:'active' },
        { id:'u2', username:'owner', password:'owner123', name:'Propietario', role:'owner', building:'all', status:'active' },
        { id:'u3', username:'jdoe', password:'jdoe123', name:'John Doe', role:'worker', building:'Torre A', status:'active' },
    ];
    pgiState.parking = [
        { id:'pv1', number:'V-01', status:'free', department:'', time:'', person:'', entryTime:'', exitTime:'' },
        { id:'pv2', number:'V-02', status:'free', department:'', time:'', person:'', entryTime:'', exitTime:'' },
        { id:'pv3', number:'V-03', status:'free', department:'', time:'', person:'', entryTime:'', exitTime:'' },
        { id:'pv4', number:'V-04', status:'free', department:'', time:'', person:'', entryTime:'', exitTime:'' },
        { id:'pv5', number:'V-05', status:'free', department:'', time:'', person:'', entryTime:'', exitTime:'' },
    ];
    pgiState.tickets = [
        { id:'T-1001', title:'Fuga de agua', status:'open', priority:'alta', sla_status:'warning', createdAt: new Date().toISOString() },
        { id:'T-1002', title:'Ascensor dañado', status:'open', priority:'alta', sla_status:'ok', createdAt: new Date().toISOString() },
    ];
    pgiState.closedTickets = [];
    saveToLocalStorage();
}

// ============================================================
// SUPABASE SYNC
// ============================================================
async function syncImmediate(entity, action, data) {
    try {
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        };

        switch(entity) {
            case 'user':
                if (action === 'create' || action === 'update') {
                    const userBody = JSON.stringify({
                        username: data.username,
                        password_hash: data.password,
                        full_name: data.name,
                        role: data.role,
                        building: data.building || 'all',
                        status: data.status || 'active'
                    });
                    try {
                        await fetch(`${SUPABASE_URL}/rest/v1/users`, { method: 'POST', headers, body: userBody });
                    } catch (e) {
                        await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${data.username}`, {
                            method: 'PATCH', headers,
                            body: JSON.stringify({ full_name: data.name, role: data.role, status: data.status })
                        });
                    }
                } else if (action === 'delete') {
                    await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${data.username}`, { method: 'DELETE', headers });
                }
                break;

            case 'ticket':
                const ticketBody = JSON.stringify({
                    ticket_number: data.id,
                    title: data.title,
                    building: 'Torre A',
                    status: data.status,
                    priority: data.priority,
                    assignee: 'John Doe',
                    sla_status: data.sla_status || 'ok'
                });
                if (action === 'create') {
                    try {
                        await fetch(`${SUPABASE_URL}/rest/v1/tickets`, { method: 'POST', headers, body: ticketBody });
                    } catch (e) {
                        await fetch(`${SUPABASE_URL}/rest/v1/tickets?ticket_number=eq.${data.id}`, { method: 'PATCH', headers, body: ticketBody });
                    }
                } else if (action === 'update') {
                    await fetch(`${SUPABASE_URL}/rest/v1/tickets?ticket_number=eq.${data.id}`, {
                        method: 'PATCH', headers,
                        body: JSON.stringify({ status: data.status, priority: data.priority })
                    });
                }
                break;

            case 'parking':
                const parkingBody = JSON.stringify({
                    spot_number: data.number,
                    building: 'Torre A',
                    status: data.status === 'free' ? 'available' : data.status,
                    current_resident: data.person || '',
                    department: data.department || '',
                    time_slot: data.time || '',
                    entry_time: data.entryTime || '',
                    exit_time: data.exitTime || ''
                });
                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/parking_spots`, { method: 'POST', headers, body: parkingBody });
                } catch (e) {
                    await fetch(`${SUPABASE_URL}/rest/v1/parking_spots?spot_number=eq.${data.number}`, { method: 'PATCH', headers, body: parkingBody });
                }
                break;
        }
        updateSupabaseStatus('online');
    } catch (error) {
        console.error('❌ Error en sync:', error);
        updateSupabaseStatus('offline');
    }
}

async function loadFromSupabase() {
    try {
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };

        const ur = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, { headers });
        if (ur.ok) {
            const du = await ur.json();
            if (du.length > 0) {
                pgiState.users = du.map(u => ({
                    id: u.id, username: u.username, password: u.password_hash || 'password',
                    name: u.full_name, role: u.role, building: u.building, status: u.status
                }));
            }
        }

        const tr = await fetch(`${SUPABASE_URL}/rest/v1/tickets?status=neq.closed&select=*`, { headers });
        if (tr.ok) {
            const dt = await tr.json();
            if (dt.length > 0) {
                pgiState.tickets = dt.map(t => ({
                    id: t.ticket_number, title: t.title, status: t.status,
                    priority: t.priority, sla_status: t.sla_status || 'ok', createdAt: t.created_at
                }));
            }
        }

        const cr = await fetch(`${SUPABASE_URL}/rest/v1/tickets?status=eq.closed&select=*`, { headers });
        if (cr.ok) {
            const dc = await cr.json();
            if (dc.length > 0) {
                pgiState.closedTickets = dc.map(t => ({
                    id: t.ticket_number, title: t.title, status: 'closed',
                    priority: t.priority, closedAt: t.updated_at
                }));
            }
        }

        const pr = await fetch(`${SUPABASE_URL}/rest/v1/parking_spots?select=*`, { headers });
        if (pr.ok) {
            const dp = await pr.json();
            if (dp.length > 0) {
                pgiState.parking = dp.map(p => ({
                    id: p.id || ('pv' + Math.random()),
                    number: p.spot_number,
                    status: p.status === 'available' ? 'free' : p.status,
                    department: p.department || '',
                    time: p.time_slot || '',
                    person: p.current_resident || '',
                    entryTime: p.entry_time || '',
                    exitTime: p.exit_time || ''
                }));
            }
        }
        saveToLocalStorage();
    } catch (e) { console.error('Error cargando:', e); }
}

async function testSupabaseConnection() {
    updateSupabaseStatus('testing');
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (r.ok) { updateSupabaseStatus('online'); }
        else { updateSupabaseStatus('offline'); }
    } catch (e) { updateSupabaseStatus('offline'); }
}

function updateSupabaseStatus(s) {
    document.querySelectorAll('.status-dot').forEach(d => d.className = 'status-dot ' + s);
    const msgs = { online: '🟢 Online', offline: '🔴 Offline', testing: '🟡 Verificando...' };
    document.querySelectorAll('[id$="-status-text"]').forEach(t => t.textContent = msgs[s] || '?');
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function handlePGILogin() {
    const u = document.getElementById('pgi-username').value.trim();
    const p = document.getElementById('pgi-password').value.trim();
    const user = pgiState.users.find(x => x.username === u && x.password === p);
    if (user) {
        pgiState.currentUser = user;
        document.getElementById('pgi-login').classList.add('hidden');
        document.getElementById('pgi-dashboard').style.display = 'block';
        document.getElementById('pgi-user-name').textContent = user.name;
        renderPGIAll();
    } else {
        alert('Credenciales inválidas');
    }
}

function logoutPGI() {
    pgiState.currentUser = null;
    document.getElementById('pgi-login').classList.remove('hidden');
    document.getElementById('pgi-dashboard').style.display = 'none';
}

// ============================================================
// RENDER
// ============================================================
function renderPGIAll() {
    renderPGIDashboard();
    renderPGIParking();
    renderPGITickets();
    renderPGIUsers();
    renderPGIKPIs();
}

function renderPGIDashboard() {
    const open = pgiState.tickets.filter(t => t.status === 'open').length;
    const free = pgiState.parking.filter(p => p.status === 'free').length;
    const res = pgiState.parking.filter(p => p.status === 'reserved').length;
    document.getElementById('pgi-dashboard-kpis').innerHTML = `
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;color:#0A192F;">${open}</div><div style="font-size:12px;color:#4A5568;">Tickets abiertos</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;color:#0A192F;">${free}/${pgiState.parking.length}</div><div style="font-size:12px;color:#4A5568;">Parking libre</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;color:#0A192F;">${res}</div><div style="font-size:12px;color:#4A5568;">Reservas activas</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;color:#0A192F;">${pgiState.users.length}</div><div style="font-size:12px;color:#4A5568;">Usuarios</div></div>
    `;
}

function renderPGIParking() {
    document.getElementById('pgi-parking-grid').innerHTML = pgiState.parking.map(s => {
        const st = s.status === 'free' ? 'Libre' : s.status === 'reserved' ? 'Reservado' : 'No disponible';
        const info = s.status === 'reserved' && s.person ?
            `<div class="spot-info"><strong>${s.department}</strong><br>${s.entryTime}-${s.exitTime}<br>${s.person}</div>` : '';
        return `<div class="parking-spot ${s.status}" onclick="showParkingInfo('${s.id}')"><div class="spot-number">${s.number}</div><div class="spot-status">${st}</div>${info}</div>`;
    }).join('');
}

function showParkingInfo(id) {
    const s = pgiState.parking.find(x => x.id === id);
    const p = document.getElementById('parking-info-panel');
    if (s.status === 'reserved' && s.person) {
        p.innerHTML = `<h4 style="color:#0A192F;">Puesto ${s.number}</h4>
            <div style="background:#FFF3E0;border-radius:8px;padding:16px;">
                <p><strong>Departamento:</strong> ${s.department}</p>
                <p><strong>Horario:</strong> ${s.entryTime} - ${s.exitTime}</p>
                <p><strong>Persona:</strong> ${s.person}</p>
            </div>
            <button onclick="releaseParkingSpot('${s.id}')" style="margin-top:12px;width:100%;background:#F44336;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;">Liberar</button>`;
    } else if (s.status === 'unavailable') {
        p.innerHTML = `<h4 style="color:#0A192F;">Puesto ${s.number}</h4><p>No disponible</p>`;
    } else {
        p.innerHTML = `<h4 style="color:#0A192F;">Puesto ${s.number}</h4>
            <p style="color:#4CAF50;">Libre</p>
            <button onclick="openParkingReservation('${s.id}')" style="margin-top:12px;width:100%;background:#0A192F;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;">Reservar</button>`;
    }
}

function releaseParkingSpot(id) {
    const s = pgiState.parking.find(x => x.id === id);
    if (s) {
        s.status = 'free'; s.department = ''; s.time = ''; s.person = ''; s.entryTime = ''; s.exitTime = '';
        saveToLocalStorage();
        syncImmediate('parking', 'update', s);
        renderPGIParking();
        renderPGIDashboard();
        showParkingInfo(id);
    }
}

function generateTimeSlots() {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            slots.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`);
        }
    }
    return slots;
}

function openParkingReservation(id) {
    const slots = generateTimeSlots().map(t => `<option value="${t}">${t}</option>`).join('');
    const modal = document.getElementById('pgi-modal-overlay');
    const c = document.getElementById('pgi-modal-content');
    c.innerHTML = `
        <h3 style="margin-bottom:16px;color:#0A192F;">🅿️ Nueva Reserva</h3>
        <div style="margin-bottom:12px;"><label>Puesto</label><select id="parking-spot-select" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;">${pgiState.parking.filter(s=>s.status==='free').map(s=>`<option value="${s.id}" ${s.id===id?'selected':''}>${s.number}</option>`).join('')}</select></div>
        <div style="margin-bottom:12px;"><label>Departamento</label><input type="text" id="parking-department" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <div style="margin-bottom:12px;"><label>Hora Ingreso</label><select id="parking-entry-time" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;">${slots}</select></div>
        <div style="margin-bottom:12px;"><label>Hora Salida</label><select id="parking-exit-time" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;">${slots}</select></div>
        <div style="margin-bottom:12px;"><label>Persona</label><input type="text" id="parking-person" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <button onclick="createParkingReservation()" style="background:#0A192F;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Crear Reserva</button>
        <button onclick="closeModal()" style="background:white;color:#4A5568;border:1px solid #E2E8F0;padding:10px 20px;border-radius:6px;cursor:pointer;margin-left:8px;">Cancelar</button>
    `;
    modal.classList.add('show');
}

function createParkingReservation() {
    const id = document.getElementById('parking-spot-select').value;
    const dep = document.getElementById('parking-department').value;
    const et = document.getElementById('parking-entry-time').value;
    const xt = document.getElementById('parking-exit-time').value;
    const per = document.getElementById('parking-person').value;
    if (!dep || !et || !xt || !per) return alert('Completa todos los campos');
    if (xt <= et) return alert('La salida debe ser posterior al ingreso');

    const s = pgiState.parking.find(x => x.id === id);
    if (s) {
        s.status = 'reserved'; s.department = dep; s.entryTime = et; s.exitTime = xt;
        s.time = `${et}-${xt}`; s.person = per;
        saveToLocalStorage();
        syncImmediate('parking', 'update', s);
        closeModal();
        renderPGIParking();
        renderPGIDashboard();
        showParkingInfo(id);
    }
}

function renderPGITickets() {
    document.getElementById('pgi-tickets-tbody').innerHTML = pgiState.tickets.map(t => `
        <tr style="border-bottom:1px solid #F1F5F9;">
            <td style="padding:12px;">${t.id}</td>
            <td style="padding:12px;">${t.title}</td>
            <td style="padding:12px;"><span style="padding:3px 10px;border-radius:10px;font-size:11px;background:${t.priority==='alta'?'#FFEBEE':t.priority==='media'?'#FFF3E0':'#E8F5E9'};color:${t.priority==='alta'?'#F44336':t.priority==='media'?'#FF9800':'#4CAF50'};">${t.priority}</span></td>
            <td style="padding:12px;">${t.status}</td>
            <td style="padding:12px;"><button onclick="closeTicket('${t.id}')" style="background:#4CAF50;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Cerrar</button></td>
        </tr>
    `).join('');
}

function closeTicket(id) {
    const t = pgiState.tickets.find(x => x.id === id);
    if (t) {
        t.status = 'closed'; t.closedAt = new Date().toISOString();
        pgiState.closedTickets.push(t);
        pgiState.tickets = pgiState.tickets.filter(x => x.id !== id);
        saveToLocalStorage();
        syncImmediate('ticket', 'update', t);
        renderPGITickets();
        renderPGIDashboard();
    }
}

function showClosedTickets() {
    const modal = document.getElementById('pgi-modal-overlay');
    const c = document.getElementById('pgi-modal-content');
    c.innerHTML = `<h3 style="margin-bottom:16px;">📁 Tickets Cerrados (${pgiState.closedTickets.length})</h3>
        ${pgiState.closedTickets.length ? pgiState.closedTickets.map(t=>`
            <div style="padding:10px;border-bottom:1px solid #F1F5F9;">
                <strong>${t.id}</strong> - ${t.title}<br>
                <span style="font-size:11px;">${t.priority} | ${new Date(t.closedAt).toLocaleDateString()}</span>
            </div>`).join('') : '<p>No hay cerrados</p>'}
        <button onclick="closeModal()" style="margin-top:16px;padding:10px 20px;background:#0A192F;color:white;border:none;border-radius:6px;cursor:pointer;">Cerrar</button>`;
    modal.classList.add('show');
}

function openPGITicketModal() {
    const c = document.getElementById('pgi-modal-content');
    c.innerHTML = `<h3 style="margin-bottom:16px;">🎫 Nuevo Ticket</h3>
        <div style="margin-bottom:12px;"><label>Título</label><input type="text" id="pgi-ticket-title" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <div style="margin-bottom:12px;"><label>Criticidad</label><select id="pgi-ticket-priority" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select></div>
        <button onclick="submitPGITicket()" style="background:#0A192F;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Crear</button>
        <button onclick="closeModal()" style="background:white;color:#4A5568;border:1px solid #E2E8F0;padding:10px 20px;border-radius:6px;cursor:pointer;margin-left:8px;">Cancelar</button>`;
    document.getElementById('pgi-modal-overlay').classList.add('show');
}

function submitPGITicket() {
    const title = document.getElementById('pgi-ticket-title').value;
    const priority = document.getElementById('pgi-ticket-priority').value;
    if (!title) return alert('Título requerido');
    const newTicket = {
        id: 'T-' + (pgiState.nextTicketId++),
        title, status: 'open', priority,
        sla_status: priority === 'alta' ? 'warning' : 'ok',
        createdAt: new Date().toISOString()
    };
    pgiState.tickets.push(newTicket);
    saveToLocalStorage();
    syncImmediate('ticket', 'create', newTicket);
    closeModal();
    renderPGITickets();
    renderPGIDashboard();
}

function renderPGIUsers() {
    document.getElementById('pgi-users-tbody').innerHTML = pgiState.users.map(u => `
        <tr style="border-bottom:1px solid #F1F5F9;">
            <td style="padding:12px;">${u.username}</td>
            <td style="padding:12px;">${u.name}</td>
            <td style="padding:12px;">${u.role}</td>
            <td style="padding:12px;"><button onclick="deletePGIUser('${u.id}')" style="background:#F44336;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">✕</button></td>
        </tr>
    `).join('');
}

function openPGIUserModal() {
    const c = document.getElementById('pgi-modal-content');
    c.innerHTML = `<h3 style="margin-bottom:16px;">👥 Nuevo Usuario</h3>
        <div style="margin-bottom:12px;"><label>Usuario</label><input type="text" id="pgi-new-username" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <div style="margin-bottom:12px;"><label>Contraseña</label><input type="password" id="pgi-new-password" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <div style="margin-bottom:12px;"><label>Nombre</label><input type="text" id="pgi-new-name" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"></div>
        <div style="margin-bottom:12px;"><label>Rol</label><select id="pgi-new-role" style="width:100%;padding:10px;border:2px solid #E2E8F0;border-radius:6px;"><option value="worker">Trabajador</option><option value="owner">Propietario</option><option value="admin">Administrador</option></select></div>
        <button onclick="submitPGIUser()" style="background:#0A192F;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Crear</button>
        <button onclick="closeModal()" style="background:white;color:#4A5568;border:1px solid #E2E8F0;padding:10px 20px;border-radius:6px;cursor:pointer;margin-left:8px;">Cancelar</button>`;
    document.getElementById('pgi-modal-overlay').classList.add('show');
}

function submitPGIUser() {
    const username = document.getElementById('pgi-new-username').value;
    const password = document.getElementById('pgi-new-password').value;
    const name = document.getElementById('pgi-new-name').value;
    const role = document.getElementById('pgi-new-role').value;
    const newUser = { id: 'u' + (pgiState.nextUserId++), username, password, name, role, building: 'all', status: 'active' };
    pgiState.users.push(newUser);
    saveToLocalStorage();
    syncImmediate('user', 'create', newUser);
    closeModal();
    renderPGIUsers();
}

function deletePGIUser(id) {
    const user = pgiState.users.find(u => u.id === id);
    if (user) {
        pgiState.users = pgiState.users.filter(u => u.id !== id);
        saveToLocalStorage();
        syncImmediate('user', 'delete', user);
        renderPGIUsers();
    }
}

function renderPGIKPIs() {
    const free = pgiState.parking.filter(p => p.status === 'free').length;
    const res = pgiState.parking.filter(p => p.status === 'reserved').length;
    document.getElementById('pgi-owner-kpis').innerHTML = `
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;">${pgiState.tickets.length}</div><div>Tickets abiertos</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;">${pgiState.closedTickets.length}</div><div>Cerrados</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;">${free}</div><div>Parking libre</div></div>
        <div style="background:white;border-radius:10px;padding:20px;"><div style="font-size:28px;font-weight:700;">${res}</div><div>Reservas</div></div>
    `;
}

// ============================================================
// TABS / MODAL / EXPORT
// ============================================================
function switchPGITab(tab, event) {
    document.querySelectorAll('.pgi-tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.pgi-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pgi-tab-' + tab).classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

function closeModal() {
    document.getElementById('pgi-modal-overlay').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('pgi-modal-overlay');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('show');
        });
    }
});

async function exportCSV() {
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const users = await r.json();
        let csv = 'Username,Nombre,Rol\n';
        users.forEach(u => csv += `${u.username},${u.full_name},${u.role}\n`);
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'usuarios.csv';
        a.click();
    } catch(e) { alert('Error exportando'); }
}

// ============================================================
// INIT
// ============================================================
async function initializePGI() {
    const hasLocal = loadFromLocalStorage();
    if (!hasLocal) loadDefaultData();
    await loadFromSupabase();
    renderPGIAll();
    testSupabaseConnection();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pgi-login')) {
        initializePGI();
    }
});
