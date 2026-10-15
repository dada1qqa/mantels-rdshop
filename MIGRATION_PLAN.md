# Plan de Migración: Supabase (PostgreSQL) → MySQL

## Resumen del Proyecto
- **Framework**: Next.js 16.3.8 + React 19 + TypeScript + Tailwind CSS v4
- **Base de datos actual**: Supabase (PostgreSQL) con RLS
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## Inventario de Funcionalidades

### 1. Autenticación y Usuarios
- **Supabase Auth** - Login, registro, reset password, email verification
- **Perfiles de usuario** (`profiles`) con:
  - Preferencias (tema, idioma, moneda, formatos)
  - Notificaciones email
  - Configuración de privacidad
- **Roles**: `owner`, `admin`, `staff`, `customer`

### 2. Catálogo y Productos
- **Productos** (`products`) - Catálogo público
- **Solicitudes de productos** (`requests`) - Pedidos de clientes
- **Estados de solicitud**: `recibida`, `aceptada`, `precio_confirmado`, `pago_solicitado`, `pago_recibido`, `compra_realizada`, `preparando`, `enviado`, `llegada_estimada`, `entrega_programada`, `entregada`, `fecha_cambiada`, `cancelada`, `rechazada`

### 3. Sistema de Pedidos y Tracking
- **Eventos de pedido** (`order_events`) - Timeline completo
- **Historial de estados** (`request_status_history`)
- **Mensajes** (`request_messages`) - Chat entre cliente y admin
- **Tracking**: número de guía, URL de tracking

### 3. Panel Administrativo
- **Dashboard** con estadísticas
- **Gestión de pedidos** - CRUD, cambio de estados, pricing
- **Gestión de solicitudes** - Aprobación, pricing, mensajes
- **Calendario administrativo** - Vista de eventos
- **Estadísticas** - Entregas hoy/mañana/semana, pagos pendientes, atrasados

### 4. Sistema de Usuario
- **Perfil** (`profiles`) - Nombre, teléfono, dirección, avatar
- **Preferencias** - Tema, idioma, moneda, formatos
- **Notificaciones** - Email (pedidos, pagos, envíos, promos, newsletter, seguridad)
- **Privacidad** - Visibilidad perfil, historial pedidos, analytics, marketing
- **Seguridad** - Cambio de contraseña
- **Zona de peligro** - Exportar datos, eliminar cuenta

### 4. Notificaciones
- **Sistema de notificaciones** (`notifications`) - Polling cada 30s
- **Tipos**: `request_received`, `request_accepted`, `price_confirmed`, `payment_requested`, `payment_received`, `purchase_made`, `preparing`, `shipped`, `estimated_arrival`, `delivery_scheduled`, `delivered`, `date_changed`, `cancelled`, `rejected`, `digital_delivery`, `message`
- **Logs de recordatorios** (`reminder_logs`)

### 5. Sistema de Menús Dinámicos
- **Menús** (`menu_items`) - Principal, footer, usuario, secundario
- **Visibilidad**: `all`, `authenticated`, `guest`, `admin`
- **Jerarquía** con `parent_id`

### 5. Personalización
- **Tema** (`theme_settings`) - Colores OKLCH, tipografía, border-radius, densidad
- **Identidad** - Logo, favicon, og_image, textos
- **Banners** promocionales con fechas
- **Historial de versiones** (`customization_versions`)

### 6. Panel Administrativo
- **Dashboard** con estadísticas
- **Gestión de productos** (CRUD)
- **Gestión de solicitudes** - Aprobación, pricing, mensajes
- **Calendario** - Vista de eventos
- **Estadísticas** - Entregas hoy/mañana/semana, pagos pendientes, atrasados

---

## Plan de Migración

### Fase 1: Configuración de MySQL
1. **Proveedor MySQL**: PlanetScale (recomendado para serverless/Vercel) o TiDB Cloud
2. **Configurar conexión** con SSL/TLS
3. **Pool de conexiones** para serverless (Vercel)

### Fase 2: Esquema MySQL
- Convertir esquema PostgreSQL → MySQL
- Mapear tipos: UUID→CHAR(36), JSONB→JSON, TIMESTAMPTZ→DATETIME(6), UUID→CHAR(36)
- Adaptar RLS → Lógica de aplicación + vistas/DB views
- Migrar funciones RPC → Stored Procedures / Application logic

### Fase 3: Autenticación
- **Opción A**: Mantener Supabase Auth (solo auth), migrar DB a MySQL
- **Opción B**: Migrar a NextAuth.js / Auth.js / Clerk
- **Recomendación**: Mantener Supabase Auth (solo auth), migrar DB

### Fase 3: Capa de Datos
- Crear cliente MySQL (mysql2 / drizzle-orm / prisma)
- Reemplazar `@supabase/supabase-js` y `@supabase/ssr`
- Implementar RLS en aplicación (middleware + server actions)

### Fase 3: Capa de Datos
- Crear cliente MySQL (drizzle-orm recomendado)
- Reemplazar `@supabase/supabase-js` y `@supabase/ssr`
- Implementar RLS en aplicación (middleware + server actions)

### Fase 4: Migrar Componentes
1. `PreferencesProvider` → MySQL
2. `NotificationBell` → MySQL
3. `SettingsClient` → MySQL
4. Admin pages → MySQL
3. API Routes → MySQL
4. Middleware → Custom auth
4. Auth → NextAuth.js / Clerk / Mantener Supabase Auth solo para auth

### Fase 5: Autenticación
- **Opción A**: Mantener Supabase Auth (recomendado - solo auth)
- **Opción B**: Migrar a NextAuth.js / Clerk

### Fase 5: Archivos
- Supabase Storage → S3/R2/Cloudflare R2 / Vercel Blob

---

## Mapeo de Tipos PostgreSQL → MySQL

| PostgreSQL | MySQL | Notas |
|------------|-------|-------|
| `UUID` | `CHAR(36)` | Generar UUID en app |
| `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `CHAR(36) PRIMARY KEY` | Generar UUID en app |
| `UUID REFERENCES` | `CHAR(36)` + FK | |
| `TEXT` | `TEXT` / `LONGTEXT` | |
| `VARCHAR(n)` | `VARCHAR(n)` | |
| `TEXT` | `TEXT` / `LONGTEXT` | |
| `JSONB` | `JSON` | MySQL 5.7+ |
| `TIMESTAMPTZ` | `DATETIME(6)` | UTC en app |
| `TIMESTAMP` | `DATETIME(6)` | |
| `DATE` | `DATE` | |
| `TIME` | `TIME(6)` | |
| `BOOLEAN` | `TINYINT(1)` / `BOOLEAN` | |
| `UUID` | `CHAR(36)` | Generar en app |
| `SERIAL` | `BIGINT AUTO_INCREMENT` | |
| `BIGSERIAL` | `BIGINT AUTO_INCREMENT` | |
| `JSONB` | `JSON` | |
| `TIMESTAMPTZ` | `DATETIME(6)` | UTC |
| `TIMESTAMP` | `DATETIME(6)` | |
| `INTERVAL` | No nativo | Usar segundos/enteros |
| `UUID DEFAULT gen_random_uuid()` | `CHAR(36)` + UUID en app | |
| `RETURNING` | `RETURNING` (MySQL 8.0+) | |
| `ON CONFLICT` | `ON DUPLICATE KEY UPDATE` | |
| `ILIKE` | `LOWER(col) LIKE LOWER()` | |
| `JSONB` operators | `JSON_EXTRACT`, `->>` | |
| `UUID` | `CHAR(36)` | Generar en app |
| `RETURNING` | `RETURNING` (MySQL 8.0+) | |
| `ON CONFLICT` | `ON DUPLICATE KEY UPDATE` | |
| `ILIKE` | `LOWER() LIKE` | |
| `JSONB` operators | `JSON_EXTRACT`, `->>` | |
| `now()` | `NOW()` / `CURRENT_TIMESTAMP(6)` | |
| `gen_random_uuid()` | `UUID()` (MySQL 8.0+) / App | |
| `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP(6)` | |

---

## Dependencias a Cambiar

### Eliminar:
- `@supabase/ssr`
- `@supabase/supabase-js`

### Agregar:
- `mysql2` (driver)
- `drizzle-orm` (ORM recomendado) + `drizzle-kit`
- `drizzle-kit` (migraciones)
- `bcryptjs` / `argon2` (password hashing si migramos auth)
- `jose` / `jose` (JWT para auth propia)
- `next-auth` / `auth` (si migramos auth)

---

## Estructura de Migración Propuesta

```
/lib
  /db
    index.ts          # Cliente MySQL (singleton)
    schema/
      index.ts        # Esquema Drizzle
      profiles.ts
      requests.ts
      orders.ts
      notifications.ts
      menu-items.ts
      theme.ts
      banners.ts
      site-settings.ts
      menu-items.ts
      users.ts
    queries/
      profiles.ts
      requests.ts
      orders.ts
      notifications.ts
      menu.ts
      theme.ts
      banners.ts
    migrations/
      0001_initial.sql
      ...
/middleware.ts          # Auth check + session refresh
/lib/auth.ts            # Auth helpers (si migramos auth)
/lib/db.ts              # Cliente DB singleton
```

---

## Próximos Pasos

1. **Configurar MySQL** (PlanetScale recomendado)
2. **Crear esquemas Drizzle** basados en esquema actual
3. **Crear migraciones SQL** para MySQL
3. **Crear cliente DB** singleton
4. **Reescribir providers/contextos** (PreferencesProvider, etc.)
5. **Migrar API routes** una por una
6. **Migrar componentes** uno por uno
7. **Migrar middleware** (auth check)
8. **Configurar Auth** (mantener Supabase Auth o migrar)
9. **Testing exhaustivo**
10. **Deploy a Vercel Preview**

---

## Próximo Paso Inmediato

¿Quieres que empiece por:
1. **Configurar Drizzle ORM + esquema** basado en el schema actual?
2. **Crear migraciones SQL** para MySQL?
3. **Reescribir `PreferencesProvider`** para usar MySQL directo?
4. **Configurar cliente MySQL** (drizzle + mysql2)?

Dime por dónde empezar y lo implemento paso a paso.