-- ============================================================
-- CENTRO DE PEDIDOS - Migración de base de datos
-- Sistema completo de eventos, calendario, notificaciones y seguimiento
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: order_events (Eventos del timeline de pedidos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    -- Tipo de evento para categorización y filtrado
    event_type TEXT NOT NULL,
    -- Título visible para el usuario
    title TEXT NOT NULL,
    -- Descripción detallada
    description TEXT,
    -- Estado relacionado (opcional, para eventos de cambio de estado)
    status TEXT,
    -- Fecha del evento (fecha de calendario, no timestamp UTC para eventos de día completo)
    event_date DATE NOT NULL,
    -- Hora de inicio (opcional, para eventos con hora exacta)
    start_time TIME,
    -- Hora de fin (opcional)
    end_time TIME,
    -- Para rangos de fechas: fecha de fin
    end_date DATE,
    -- Es una fecha estimada (no confirmada)
    is_estimated BOOLEAN DEFAULT false,
    -- Es un rango de fechas (event_date a end_date)
    is_range BOOLEAN DEFAULT false,
    -- Tolerancia en días para fechas estimadas (± días)
    tolerance_days INTEGER,
    -- Visible para el cliente
    is_visible_to_customer BOOLEAN DEFAULT true,
    -- Creado por (user_id del admin o null si es sistema)
    created_by UUID REFERENCES auth.users(id),
    -- Metadatos adicionales (JSON flexible)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_order_events_request_id ON public.order_events(request_id);
CREATE INDEX IF NOT EXISTS idx_order_events_event_date ON public.order_events(event_date);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON public.order_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_events_visible ON public.order_events(is_visible_to_customer) WHERE is_visible_to_customer = true;

-- ------------------------------------------------------------
-- 2. TABLA: notifications (Notificaciones del sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    order_event_id UUID REFERENCES public.order_events(id) ON DELETE SET NULL,
    -- Tipo de notificación
    type TEXT NOT NULL,
    -- Título
    title TEXT NOT NULL,
    -- Mensaje
    body TEXT NOT NULL,
    -- Leída o no
    read BOOLEAN DEFAULT false,
    -- Acción asociada (URL relativa)
    action_url TEXT,
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ------------------------------------------------------------
-- 3. TABLA: reminder_logs (Log de recordatorios enviados)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    order_event_id UUID REFERENCES public.order_events(id) ON DELETE SET NULL,
    -- Tipo de recordatorio
    reminder_type TEXT NOT NULL,
    -- Canal: 'notification', 'email', 'whatsapp', etc.
    channel TEXT NOT NULL DEFAULT 'notification',
    -- Cuándo se envió
    sent_at TIMESTAMPTZ DEFAULT now(),
    -- Para evitar duplicados: clave única por request + tipo + fecha objetivo
    dedup_key TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_request_id ON public.reminder_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_dedup ON public.reminder_logs(dedup_key);

-- ------------------------------------------------------------
-- 4. AGREGAR CAMPOS A LA TABLA requests (si no existen)
-- ------------------------------------------------------------
-- Estos campos pueden ya existir, usamos IF NOT EXISTS via DO block
DO $$
BEGIN
    -- Fecha estimada de entrega (single date)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'estimated_delivery_date') THEN
        ALTER TABLE public.requests ADD COLUMN estimated_delivery_date DATE;
    END IF;
    -- Fecha fin de rango estimado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'estimated_delivery_end_date') THEN
        ALTER TABLE public.requests ADD COLUMN estimated_delivery_end_date DATE;
    END IF;
    -- Tolerancia en días
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'delivery_tolerance_days') THEN
        ALTER TABLE public.requests ADD COLUMN delivery_tolerance_days INTEGER;
    END IF;
    -- Hora de entrega estimada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'estimated_delivery_time') THEN
        ALTER TABLE public.requests ADD COLUMN estimated_delivery_time TIME;
    END IF;
    -- Rango horario fin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'estimated_delivery_end_time') THEN
        ALTER TABLE public.requests ADD COLUMN estimated_delivery_end_time TIME;
    END IF;
    -- Precio aceptado por el cliente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'price_accepted') THEN
        ALTER TABLE public.requests ADD COLUMN price_accepted BOOLEAN DEFAULT false;
    END IF;
    -- Fecha de aceptación de precio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'price_accepted_at') THEN
        ALTER TABLE public.requests ADD COLUMN price_accepted_at TIMESTAMPTZ;
    END IF;
    -- Fecha de pago
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'paid_at') THEN
        ALTER TABLE public.requests ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
    -- Fecha de compra real
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'purchased_at') THEN
        ALTER TABLE public.requests ADD COLUMN purchased_at TIMESTAMPTZ;
    END IF;
    -- Fecha de envío
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'shipped_at') THEN
        ALTER TABLE public.requests ADD COLUMN shipped_at TIMESTAMPTZ;
    END IF;
    -- Fecha de entrega real
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'delivered_at') THEN
        ALTER TABLE public.requests ADD COLUMN delivered_at TIMESTAMPTZ;
    END IF;
    -- Tracking number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'tracking_number') THEN
        ALTER TABLE public.requests ADD COLUMN tracking_number TEXT;
    END IF;
    -- Tracking URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'tracking_url') THEN
        ALTER TABLE public.requests ADD COLUMN tracking_url TEXT;
    END IF;
    -- Notas internas (solo admin)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.requests ADD COLUMN admin_notes TEXT;
    END IF;
    -- Prioridad para admin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'priority') THEN
        ALTER TABLE public.requests ADD COLUMN priority INTEGER DEFAULT 0;
    END IF;
END $$;

-- ------------------------------------------------------------
-- 5. TABLA: order_status_history (ya existe, verificar estructura)
-- ------------------------------------------------------------
-- La tabla request_status_history ya existe y se usa para historial de estados
-- Verificar que tenga los campos necesarios
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_status_history' AND column_name = 'changed_by') THEN
        ALTER TABLE public.request_status_history ADD COLUMN changed_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_status_history' AND column_name = 'note') THEN
        ALTER TABLE public.request_status_history ADD COLUMN note TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------
-- 6. FUNCIONES RPC PARA EL SISTEMA
-- ------------------------------------------------------------

-- Función para crear evento de pedido (para uso del admin)
CREATE OR REPLACE FUNCTION public.create_order_event(
    p_request_id UUID,
    p_event_type TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_event_date DATE,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_is_estimated BOOLEAN DEFAULT false,
    p_is_range BOOLEAN DEFAULT false,
    p_tolerance_days INTEGER DEFAULT NULL,
    p_is_visible_to_customer BOOLEAN DEFAULT true,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.order_events (
        request_id, event_type, title, description, status,
        event_date, start_time, end_time, end_date,
        is_estimated, is_range, tolerance_days, is_visible_to_customer,
        metadata, created_by
    ) VALUES (
        p_request_id, p_event_type, p_title, p_description, p_status,
        p_event_date, p_start_time, p_end_time, p_end_date,
        p_is_estimated, p_is_range, p_tolerance_days, p_is_visible_to_customer,
        p_metadata, auth.uid()
    ) RETURNING id INTO v_event_id;

    -- Crear notificación para el cliente si es visible
    IF p_is_visible_to_customer THEN
        INSERT INTO public.notifications (user_id, request_id, order_event_id, type, title, body, action_url)
        SELECT r.user_id, p_request_id, v_event_id, p_event_type, p_title, p_description, '/mi-cuenta/pedidos/' || r.id
        FROM public.requests r
        WHERE r.id = p_request_id AND r.user_id IS NOT NULL;
    END IF;

    RETURN v_event_id;
END $$;

-- Función para obtener eventos de un pedido
CREATE OR REPLACE FUNCTION public.get_request_events(p_request_id UUID)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    end_date DATE,
    is_estimated BOOLEAN,
    is_range BOOLEAN,
    tolerance_days INTEGER,
    is_visible_to_customer BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT oe.id, oe.event_type, oe.title, oe.description, oe.status,
           oe.event_date, oe.start_time, oe.end_time, oe.end_date,
           oe.is_estimated, oe.is_range, oe.tolerance_days, oe.is_visible_to_customer,
           oe.metadata, oe.created_at, oe.created_by
    FROM public.order_events oe
    WHERE oe.request_id = p_request_id
    ORDER BY oe.event_date ASC, oe.start_time ASC NULLS FIRST, oe.created_at ASC;
END $$;

-- Función para obtener calendario del usuario (eventos de sus pedidos)
CREATE OR REPLACE FUNCTION public.get_user_calendar(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    request_id UUID,
    request_code TEXT,
    product_name TEXT,
    type TEXT,
    event_type TEXT,
    title TEXT,
    description TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    end_date DATE,
    is_estimated BOOLEAN,
    is_range BOOLEAN,
    tolerance_days INTEGER,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT oe.id, r.id as request_id, r.request_code, r.product_name, r.type,
           oe.event_type, oe.title, oe.description,
           oe.event_date, oe.start_time, oe.end_time, oe.end_date,
           oe.is_estimated, oe.is_range, oe.tolerance_days, r.status
    FROM public.order_events oe
    JOIN public.requests r ON r.id = oe.request_id
    WHERE r.user_id = p_user_id
      AND oe.is_visible_to_customer = true
      AND oe.event_date <= p_end_date
      AND (oe.end_date IS NULL OR oe.end_date >= p_start_date)
    ORDER BY oe.event_date ASC, oe.start_time ASC NULLS FIRST;
END $$;

-- Función para obtener próxima actividad del usuario
CREATE OR REPLACE FUNCTION public.get_user_next_activity(p_user_id UUID)
RETURNS TABLE (
    request_id UUID,
    request_code TEXT,
    product_name TEXT,
    type TEXT,
    event_type TEXT,
    title TEXT,
    description TEXT,
    event_date DATE,
    start_time TIME,
    end_date DATE,
    is_estimated BOOLEAN,
    is_range BOOLEAN,
    days_until INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id as request_id, r.request_code, r.product_name, r.type,
           oe.event_type, oe.title, oe.description,
           oe.event_date, oe.start_time, oe.end_date,
           oe.is_estimated, oe.is_range,
           (oe.event_date - CURRENT_DATE) as days_until
    FROM public.order_events oe
    JOIN public.requests r ON r.id = oe.request_id
    WHERE r.user_id = p_user_id
      AND oe.is_visible_to_customer = true
      AND oe.event_date >= CURRENT_DATE
      AND r.status NOT IN ('entregada', 'rechazada', 'cancelada')
    ORDER BY oe.event_date ASC, oe.start_time ASC NULLS FIRST
    LIMIT 1;
END $$;

-- Función para obtener actividad reciente del usuario
CREATE OR REPLACE FUNCTION public.get_user_recent_activity(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    request_id UUID,
    request_code TEXT,
    product_name TEXT,
    type TEXT,
    event_type TEXT,
    title TEXT,
    description TEXT,
    event_date DATE,
    created_at TIMESTAMPTZ,
    sender_role TEXT,
    body TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eventos del timeline
    RETURN QUERY
    SELECT oe.id, r.id as request_id, r.request_code, r.product_name, r.type,
           oe.event_type, oe.title, oe.description,
           oe.event_date, oe.created_at,
           'system'::TEXT as sender_role,
           NULL::TEXT as body
    FROM public.order_events oe
    JOIN public.requests r ON r.id = oe.request_id
    WHERE r.user_id = p_user_id
      AND oe.is_visible_to_customer = true
      AND oe.created_at >= (CURRENT_DATE - INTERVAL '90 days')

    UNION ALL

    -- Mensajes
    SELECT rm.id, r.id as request_id, r.request_code, r.product_name, r.type,
           'message' as event_type, 'Mensaje' as title, rm.body as description,
           rm.created_at::DATE as event_date, rm.created_at,
           rm.sender_role, rm.body
    FROM public.request_messages rm
    JOIN public.requests r ON r.id = rm.request_id
    WHERE r.user_id = p_user_id
      AND rm.created_at >= (CURRENT_DATE - INTERVAL '90 days')

    ORDER BY created_at DESC
    LIMIT p_limit;
END $$;

-- Función para detectar pedidos atrasados (admin)
CREATE OR REPLACE FUNCTION public.get_overdue_requests()
RETURNS TABLE (
    id UUID,
    request_code TEXT,
    product_name TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT,
    estimated_delivery_date DATE,
    estimated_delivery_end_date DATE,
    days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.request_code, r.product_name, r.customer_name, r.customer_phone,
           r.status, r.estimated_delivery_date, r.estimated_delivery_end_date,
           (CURRENT_DATE - COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date)) as days_overdue
    FROM public.requests r
    WHERE r.status IN ('en_transito', 'procesando', 'producto_comprado', 'pagada', 'esperando_pago')
      AND (r.estimated_delivery_date IS NOT NULL OR r.estimated_delivery_end_date IS NOT NULL)
      AND COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date) < CURRENT_DATE
    ORDER BY days_overdue DESC;
END $$;

-- Función para estadísticas del dashboard admin
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
    entregas_hoy INTEGER,
    entregas_manana INTEGER,
    entregas_semana INTEGER,
    pagos_pendientes INTEGER,
    pedidos_atrasados INTEGER,
    en_transito INTEGER,
    sin_fecha_estimada INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date) = CURRENT_DATE) as entregas_hoy,
        COUNT(*) FILTER (WHERE COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date) = CURRENT_DATE + 1) as entregas_manana,
        COUNT(*) FILTER (WHERE COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date) BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) as entregas_semana,
        COUNT(*) FILTER (WHERE r.status = 'esperando_pago') as pagos_pendientes,
        COUNT(*) FILTER (WHERE r.status IN ('en_transito', 'procesando', 'producto_comprado', 'pagada', 'esperando_pago')
            AND COALESCE(r.estimated_delivery_end_date, r.estimated_delivery_date) < CURRENT_DATE) as pedidos_atrasados,
        COUNT(*) FILTER (WHERE r.status = 'en_transito') as en_transito,
        COUNT(*) FILTER (WHERE r.status IN ('en_transito', 'procesando', 'producto_comprado', 'pagada', 'esperando_pago')
            AND r.estimated_delivery_date IS NULL AND r.estimated_delivery_end_date IS NULL) as sin_fecha_estimada
    FROM public.requests r
    WHERE r.status NOT IN ('entregada', 'rechazada', 'cancelada');
END $$;

-- ------------------------------------------------------------
-- 7. TRIGGERS PARA ACTUALIZAR updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS update_order_events_updated_at ON public.order_events;
CREATE TRIGGER update_order_events_updated_at
    BEFORE UPDATE ON public.order_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 8. RLS (Row Level Security) POLICIES
-- ------------------------------------------------------------

-- order_events: Cliente ve solo eventos visibles de sus pedidos
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can view own order events" ON public.order_events;
CREATE POLICY "Customer can view own order events"
    ON public.order_events FOR SELECT
    USING (
        is_visible_to_customer = true
        AND request_id IN (SELECT id FROM public.requests WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admin can manage all order events" ON public.order_events;
CREATE POLICY "Admin can manage all order events"
    ON public.order_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- notifications: Usuario ve solo sus notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own notifications" ON public.notifications;
CREATE POLICY "User can view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can update own notifications" ON public.notifications;
CREATE POLICY "User can update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage all notifications" ON public.notifications;
CREATE POLICY "Admin can manage all notifications"
    ON public.notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- reminder_logs: Solo admin
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage reminder logs" ON public.reminder_logs;
CREATE POLICY "Admin can manage reminder logs"
    ON public.reminder_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- ------------------------------------------------------------
-- 9. TIPOS DE EVENTOS ESTÁNDAR (para consistencia)
-- ------------------------------------------------------------
-- Estos son los tipos de eventos que el sistema reconoce:
-- 'request_received'        - Solicitud recibida
-- 'request_accepted'        - Solicitud aceptada
-- 'price_confirmed'         - Precio confirmado
-- 'payment_requested'       - Pago solicitado
-- 'payment_received'        - Pago recibido
-- 'purchase_made'           - Compra realizada
-- 'preparing'               - Preparando
-- 'shipped'                 - Enviado
-- 'estimated_arrival'       - Llegada estimada
-- 'delivery_scheduled'      - Entrega programada
-- 'delivered'               - Entregado
-- 'date_changed'            - Fecha modificada
-- 'cancelled'               - Cancelado
-- 'rejected'                - Rechazado
-- 'custom'                  - Evento personalizado (admin)
-- 'digital_delivery'        - Entrega digital
-- 'external_purchase'       - Compra externa
-- 'external_shipped'        - Enviado por tienda externa
-- 'arrived_carrier'         - Llegada al transportista
-- 'arrived_country'         - Llegada al país

-- ------------------------------------------------------------
-- 10. VISTA PARA CALENDARIO ADMINISTRATIVO
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_calendar_view AS
SELECT 
    oe.id,
    oe.request_id,
    r.request_code,
    r.product_name,
    r.type,
    r.customer_name,
    r.customer_phone,
    r.status,
    oe.event_type,
    oe.title,
    oe.description,
    oe.event_date,
    oe.start_time,
    oe.end_time,
    oe.end_date,
    oe.is_estimated,
    oe.is_range,
    oe.tolerance_days,
    oe.created_by,
    oe.created_at
FROM public.order_events oe
JOIN public.requests r ON r.id = oe.request_id
WHERE r.status NOT IN ('entregada', 'rechazada', 'cancelada')
ORDER BY oe.event_date ASC, oe.start_time ASC NULLS FIRST;

-- Grant permissions
GRANT SELECT ON public.admin_calendar_view TO authenticated;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================