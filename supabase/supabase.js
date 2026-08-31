// ============ CONFIGURACIÓN SUPABASE ============
const SUPABASE_URL = 'https://jvngqoqfregoqgrqojep.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bmdxb3FmcmVnb3FncnFvamVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODYxNDYsImV4cCI6MjEwMzQ2MjE0Nn0.fO7yDpC3pJrs6NSYGNqdN4oT_0IHiggTVTLudNkrqsc';

// ... (todo el código de la clase SupabaseSync)

<!-- Al final del body, después del script actual -->
<script>
    // ============ CONFIGURACIÓN SUPABASE ============
    // Reemplaza con tus datos reales de Supabase
    const SUPABASE_URL = 'https://jvngqoqfregoqgrqojep.supabase.co/rest/v1/';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bmdxb3FmcmVnb3FncnFvamVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODYxNDYsImV4cCI6MjEwMzQ2MjE0Nn0.fO7yDpC3pJrs6NSYGNqdN4oT_0IHiggTVTLudNkrqsc';
    
    // Clase para manejar Supabase
    class SupabaseSync {
        constructor() {
            this.baseUrl = SUPABASE_URL;
            this.anonKey = SUPABASE_ANON_KEY;
        }
        
        getHeaders() {
            return {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };
        }
        
        // ============ USUARIOS ============
        async fetchUsers() {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/users?select=*`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }
        }
        
        async createUser(userData) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/users`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(userData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating user:', error);
                return null;
            }
        }
        
        async updateUser(userId, userData) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify(userData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error updating user:', error);
                return null;
            }
        }
        
        async deleteUser(userId) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/users?id=eq.${userId}`, {
                    method: 'DELETE',
                    headers: this.getHeaders()
                });
                return response.ok;
            } catch (error) {
                console.error('Error deleting user:', error);
                return false;
            }
        }
        
        // ============ TICKETS ============
        async fetchTickets() {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/tickets?select=*`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Error fetching tickets:', error);
                return [];
            }
        }
        
        async createTicket(ticketData) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/tickets`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(ticketData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating ticket:', error);
                return null;
            }
        }
        
        // ============ PARKING ============
        async fetchParkingSpots() {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/parking_spots?select=*`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Error fetching parking:', error);
                return [];
            }
        }
        
        async updateParkingSpot(spotNumber, data) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/parking_spots?spot_number=eq.${spotNumber}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Error updating parking:', error);
                return null;
            }
        }
        
        // ============ RESERVAS ============
        async fetchReservations() {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/area_reservations?select=*`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Error fetching reservations:', error);
                return [];
            }
        }
        
        async createReservation(reservationData) {
            try {
                const response = await fetch(`${this.baseUrl}/rest/v1/area_reservations`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(reservationData)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating reservation:', error);
                return null;
            }
        }
        
        // ============ SINCRONIZACIÓN ============
        async syncAllData() {
            console.log('🔄 Iniciando sincronización con Supabase...');
            
            // Sincronizar usuarios locales a Supabase
            const localUsers = state.users;
            for (const user of localUsers) {
                await this.createUser({
                    username: user.username,
                    password_hash: user.password,
                    full_name: user.name,
                    role: user.role,
                    building: user.building,
                    status: user.status || 'active'
                });
            }
            console.log('✅ Usuarios sincronizados');
            
            // Sincronizar tickets
            const localTickets = state.tickets;
            for (const ticket of localTickets) {
                await this.createTicket({
                    ticket_number: ticket.id,
                    title: ticket.title,
                    building: ticket.building,
                    status: ticket.status,
                    priority: ticket.priority,
                    assignee: ticket.assignee,
                    sla_status: ticket.sla_status || 'ok'
                });
            }
            console.log('✅ Tickets sincronizados');
            
            // Sincronizar parking
            const localParking = state.parking;
            for (const spot of localParking) {
                await this.updateParkingSpot(spot.number, {
                    building: spot.building,
                    status: spot.status,
                    current_resident: spot.resident || ''
                });
            }
            console.log('✅ Parking sincronizado');
            
            return true;
        }
        
        // ============ EXPORTAR CSV ============
        async exportUsersToCSV() {
            try {
                const users = await this.fetchUsers();
                let csv = 'Username,Nombre,Rol,Edificio,Estado\n';
                users.forEach(u => {
                    csv += `${u.username},${u.full_name},${u.role},${u.building},${u.status}\n`;
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'usuarios_supabase.csv';
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error exporting:', error);
            }
        }
        
        // ============ TEST CONEXIÓN ============
        async testConnection() {
            try {
                const users = await this.fetchUsers();
                console.log(`✅ Conexión exitosa. ${users.length} usuarios encontrados.`);
                return true;
            } catch (error) {
                console.error('❌ Error de conexión:', error);
                return false;
            }
        }
    }
    
    // Inicializar Supabase
    const supabase = new SupabaseSync();
    
    // Probar conexión al cargar
    document.addEventListener('DOMContentLoaded', async () => {
        await supabase.testConnection();
    });
</script>
