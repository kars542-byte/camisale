📋 SPEC – Camisale.work con módulo Building Admin (PGI)
🎯 Objetivo General

Plataforma web que combina:

    Página principal Camisale.work – sitio corporativo de ingeniería y consultoría para minería y telecomunicaciones.

    Módulo Building Admin para Prime Gestión Inmobiliaria (PGI) – dashboard de administración de edificios con gestión de estacionamientos, tickets, usuarios y KPIs.

Ambos conviven en un solo index.html. Al hacer click en el proyecto "Prime Gestión Inmobiliaria" dentro del hub de proyectos, se oculta la página de Camisale y se muestra el login/dashboard de PGI. El regreso se realiza mediante el botón "Salir".
🎨 Paleta de Colores
Camisale.work (página principal)

    Dorado principal: #D4AF37

    Dorado claro: #FFD700

    Dorado oscuro: #B8960F

    Crema: #FFF8E1

    Blanco: #FFFFFF

    Negro suave (texto/fondos oscuros): #1A1A1A

    Gris: #4A5568

Prime Gestión Inmobiliaria (Building Admin)

    Azul marino profundo: #0A192F

    Azul marino claro: #1a365d

    Gris: #4A5568

    Blanco: #FFFFFF

    Acento rojo: #E11D48

    Verde (éxito): #4CAF50

    Naranja (reservado): #FF9800

    Rojo (no disponible): #F44336

📁 Estructura de Archivos
text

raíz/
├── index.html               → Todo el código (Camisale + PGI)
├── camisale.jpg             → Logo Camisale (alto mínimo 110px)
└── buildadmin/
    └── PGI-300x124.png      → Logo Prime Gestión Inmobiliaria (alto 45px)

    Nota: Los logos deben estar en esas rutas exactas. Si no cargan, se muestra un fallback de texto.

🧩 Módulos y Funcionalidades
A. Página Principal Camisale.work

    Header con logo grande, navegación, botón "Solicitar Propuesta".

    Hero con mensaje de ingeniería y consultoría.

    Servicios (3 cards: Instalaciones Industriales, Project Management, Operación 24/7).

    Sección "¿Por qué Camisale?" con estadísticas.

    Proyectos Hub con al menos 6 proyectos; el primero es "Prime Gestión Inmobiliaria" que enlaza al admin.

    Contacto con teléfono, email y WhatsApp.

    Footer con copyright.

B. Login PGI

    Acceso con credenciales (demo: admin / admin123).

    Se muestra logo PGI y nota "Powered by camisale.work".

    Indicador de conexión con Supabase (🟢/🔴).

C. Dashboard PGI

    Tarjetas KPI: tickets abiertos, parking libre, reservas activas, usuarios totales.

    Se actualizan al cambiar datos en otros módulos.

D. Módulo de Estacionamiento (Parking)

    5 puestos fijos de visitante (V-01 a V-05).

    Tres estados visuales:

        🟢 Libre (free)

        🟠 Reservado (reserved)

        🔴 No disponible (unavailable)

    Cada puesto es clickeable → muestra información en panel lateral.

    Botón "+ Nueva Reserva" abre formulario con:

        Selección de puesto (solo libres)

        Departamento (texto libre)

        Hora de ingreso (selector de 30 min)

        Hora de salida (selector de 30 min)

        Nombre de la persona que reserva

    Validación: salida > ingreso, todos los campos obligatorios.

    Al confirmar, el puesto cambia a naranja mostrando los datos.

    Botón "Liberar Reserva" para volver a verde.

    Sincronización inmediata con Supabase al reservar/liberar.

E. Módulo de Tickets

    Lista de tickets abiertos con:

        ID (ej: T-1001)

        Título

        Criticidad: Baja (verde), Media (naranja), Alta (roja)

        Estado (abierto)

        Botón "Cerrar" que mueve el ticket a "cerrados"

    Botón "+ Nuevo Ticket" con formulario (título y criticidad).

    Botón "📁 Tickets Cerrados" muestra modal con historial de cerrados.

    Sincronización inmediata con Supabase al crear/cerrar.

F. Módulo de Usuarios

    Lista de usuarios con username, nombre, rol, botón eliminar.

    Botón "+ Agregar Usuario" con formulario (usuario, contraseña, nombre, rol).

    Roles: admin, owner, worker.

    Botón "📥 Exportar CSV" descarga usuarios desde Supabase.

    Sincronización inmediata al crear/eliminar.

G. Módulo de KPIs

    Tarjetas con: tickets abiertos, tickets cerrados, parking libre, reservas activas.

🔄 Persistencia y Sincronización

    localStorage guarda automáticamente todos los cambios locales (clave pgi_admin_data_v4).

    Supabase es la fuente de verdad externa. Al cargar la página, se intenta cargar datos desde Supabase para sobrescribir el estado local.

    Sincronización inmediata: cada vez que se crea, actualiza o elimina un usuario, ticket o reserva de parking, se hace una petición a Supabase al instante (sin esperar intervalos).

    El indicador de conexión refleja el estado de la última operación.

Tablas Supabase requeridas
sql

users (username, password_hash, full_name, role, building, status)
tickets (ticket_number, title, building, status, priority, assignee, sla_status)
parking_spots (spot_number, building, status, current_resident, department, time_slot, entry_time, exit_time)
area_reservations (opcional)

✅ Reglas de Negocio

    Solo usuarios con rol admin pueden crear/eliminar usuarios (aunque en esta versión demo no se restringe por interfaz, se asume que el acceso al módulo de usuarios es restringido en producción).

    Un puesto de estacionamiento reservado no puede ser seleccionado para una nueva reserva.

    La hora de salida debe ser estrictamente mayor a la de ingreso.

    Los tickets cerrados no aparecen en la lista principal, solo en el modal "Tickets Cerrados".

    La página de Camisale usa colores dorados; el dashboard PGI usa azul marino/gris.

🚀 Estado Actual (al 2026-08-31)

    ✅ Página principal Camisale con hub de proyectos.

    ✅ Login PGI y navegación entre ambas vistas.

    ✅ Dashboard con KPIs.

    ✅ Parking con sistema de reserva y horas cada 30 min.

    ✅ Tickets con criticidad, cierre y visualización de cerrados.

    ✅ Usuarios con CRUD y exportación CSV.

    ✅ Sync inmediato con Supabase.

    ✅ Indicador de conexión Supabase.

    ✅ Logos con fallback de texto.

Pendiente:

    Ajustar tamaño exacto de logo Camisale (se usa height:110px).

    Confirmar que el logo PGI cargue correctamente en buildadmin/PGI-300x124.png.

    Probar con credenciales reales de Supabase.
