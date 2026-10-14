-- ============================================================
-- MENÚ DINÁMICO Y CENTRO DE PERSONALIZACIÓN
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: menu_items (Elementos del menú de navegación)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    location TEXT NOT NULL DEFAULT 'main' CHECK (location IN ('main', 'secondary', 'footer', 'user')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    visibility_rule TEXT NOT NULL DEFAULT 'all' CHECK (visibility_rule IN ('all', 'authenticated', 'guest', 'admin')),
    open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_location ON public.menu_items(location);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON public.menu_items(location, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON public.menu_items(is_active) WHERE is_active = true;

-- ------------------------------------------------------------
-- 2. TABLA: site_settings (Configuración general del sitio)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. TABLA: theme_settings (Configuración de tema/apariencia)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identidad visual
    site_name TEXT NOT NULL DEFAULT 'MantelsioRDshop',
    site_tagline TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    og_image_url TEXT,
    footer_text TEXT,
    -- Colores (OKLCH format)
    color_primary TEXT DEFAULT 'oklch(68% 0.28 330)',
    color_secondary TEXT DEFAULT 'oklch(72% 0.20 195)',
    color_accent TEXT DEFAULT 'oklch(62% 0.22 150)',
    color_background TEXT DEFAULT 'oklch(4% 0.015 270)',
    color_card TEXT DEFAULT 'oklch(10% 0.02 270)',
    color_text_primary TEXT DEFAULT 'oklch(98.5% 0.002 270)',
    color_text_secondary TEXT DEFAULT 'oklch(65% 0.02 270)',
    color_border TEXT DEFAULT 'oklch(16% 0.025 270)',
    color_button_primary TEXT DEFAULT 'oklch(68% 0.28 330)',
    color_button_secondary TEXT DEFAULT 'oklch(72% 0.20 195)',
    color_link TEXT DEFAULT 'oklch(72% 0.20 195)',
    -- Apariencia
    theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
    border_radius TEXT DEFAULT '1rem',
    card_style TEXT DEFAULT 'double-bezel' CHECK (card_style IN ('double-bezel', 'simple', 'glass')),
    visual_density TEXT DEFAULT 'normal' CHECK (visual_density IN ('compact', 'normal', 'comfortable')),
    button_size TEXT DEFAULT 'normal' CHECK (button_size IN ('small', 'normal', 'large')),
    spacing_scale TEXT DEFAULT 'normal' CHECK (spacing_scale IN ('compact', 'normal', 'comfortable')),
    -- Tipografía
    font_primary TEXT DEFAULT 'Plus Jakarta Sans',
    font_base_size TEXT DEFAULT '1rem',
    font_heading_weight TEXT DEFAULT '700',
    font_heading_scale TEXT DEFAULT '1.2',
    -- Encabezado
    header_show_logo BOOLEAN NOT NULL DEFAULT true,
    header_logo_size TEXT DEFAULT 'normal' CHECK (header_logo_size IN ('small', 'normal', 'large')),
    header_alignment TEXT DEFAULT 'center' CHECK (header_alignment IN ('left', 'center', 'right')),
    header_background_style TEXT DEFAULT 'glass' CHECK (header_background_style IN ('solid', 'glass', 'gradient', 'transparent')),
    header_show_search BOOLEAN NOT NULL DEFAULT false,
    header_cta_text TEXT DEFAULT 'Solicitar artículo',
    header_cta_href TEXT DEFAULT '/solicitar',
    -- Pie de página
    footer_show_contact BOOLEAN NOT NULL DEFAULT true,
    footer_show_social BOOLEAN NOT NULL DEFAULT true,
    footer_show_policies BOOLEAN NOT NULL DEFAULT true,
    footer_columns_layout TEXT DEFAULT 'auto' CHECK (footer_columns_layout IN ('auto', '1', '2', '3', '4')),
    footer_contact_email TEXT,
    footer_contact_phone TEXT,
    footer_address TEXT,
    -- Estado de publicación
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. TABLA: banners (Banners promocionales)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    button_text TEXT,
    button_href TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    location TEXT NOT NULL DEFAULT 'home' CHECK (location IN ('home', 'catalog', 'cart', 'checkout', 'account')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_location ON public.banners(location);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(starts_at, ends_at);

-- ------------------------------------------------------------
-- 5. TABLA: customization_versions (Historial de versiones)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customization_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INTEGER NOT NULL,
    theme_settings JSONB NOT NULL,
    site_settings JSONB NOT NULL,
    menu_items JSONB NOT NULL,
    banners JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customization_versions_number ON public.customization_versions(version_number DESC);

-- ------------------------------------------------------------
-- 6. INSERTAR DATOS INICIALES
-- ------------------------------------------------------------

-- Menú principal por defecto
INSERT INTO public.menu_items (label, href, icon, parent_id, location, sort_order, is_active, visibility_rule) VALUES
    ('Catálogo', '/', '🏪', NULL, 'main', 1, true, 'all'),
    ('Productos Digitales', '/consultar?category=digital', '🎮', NULL, 'main', 2, true, 'all'),
    ('Solicitar Artículo', '/solicitar', '📝', NULL, 'main', 3, true, 'all'),
    ('Comprar en Otra Tienda', '/solicitar/otra-tienda', '🛍️', NULL, 'main', 4, true, 'all'),
    ('Solicitud Personalizada', '/solicitar/otro', '✨', NULL, 'main', 5, true, 'all'),
    ('Centro de Pedidos', '/mi-cuenta/pedidos', '📦', NULL, 'main', 6, true, 'authenticated'),
    ('Mi Calendario', '/mi-cuenta/calendario', '📅', NULL, 'main', 7, true, 'authenticated'),
    ('Contacto', '/contacto', '📞', NULL, 'main', 8, true, 'all'),
    ('Ayuda', '/contacto#ayuda', '❓', NULL, 'main', 9, true, 'all')
ON CONFLICT DO NOTHING;

-- Footer links
INSERT INTO public.menu_items (label, href, icon, parent_id, location, sort_order, is_active, visibility_rule) VALUES
    ('Catálogo', '/', '🏪', NULL, 'footer', 1, true, 'all'),
    ('Solicitar', '/solicitar', '📝', NULL, 'footer', 2, true, 'all'),
    ('Carrito', '/cart', '🛒', NULL, 'footer', 3, true, 'all'),
    ('Contacto', '/contacto', '📞', NULL, 'footer', 4, true, 'all'),
    ('Mis Pedidos', '/mi-cuenta/pedidos', '📦', NULL, 'footer', 5, true, 'authenticated'),
    ('Mi Calendario', '/mi-cuenta/calendario', '📅', NULL, 'footer', 6, true, 'authenticated'),
    ('Términos', '/contacto#terminos', '📄', NULL, 'footer', 7, true, 'all'),
    ('Privacidad', '/contacto#privacidad', '🔒', NULL, 'footer', 8, true, 'all')
ON CONFLICT DO NOTHING;

-- User menu items
INSERT INTO public.menu_items (label, href, icon, parent_id, location, sort_order, is_active, visibility_rule) VALUES
    ('Mi Perfil', '/mi-cuenta', '👤', NULL, 'user', 1, true, 'authenticated'),
    ('Mis Pedidos', '/mi-cuenta/pedidos', '📦', NULL, 'user', 2, true, 'authenticated'),
    ('Mi Calendario', '/mi-cuenta/calendario', '📅', NULL, 'user', 3, true, 'authenticated'),
    ('Configuración', '/mi-cuenta/configuracion', '⚙️', NULL, 'user', 4, true, 'authenticated'),
    ('Mis Solicitudes', '/mis-solicitudes', '📋', NULL, 'user', 5, true, 'authenticated'),
    ('Cerrar Sesión', '/logout', '🚪', NULL, 'user', 6, true, 'authenticated'),
    ('Entrar', '/login', '🔑', NULL, 'user', 1, true, 'guest'),
    ('Registrarse', '/login?register=true', '📝', NULL, 'user', 2, true, 'guest')
ON CONFLICT DO NOTHING;

-- Configuración inicial del tema
INSERT INTO public.theme_settings (
    site_name, site_tagline, footer_text,
    color_primary, color_secondary, color_accent,
    color_background, color_card, color_text_primary, color_text_secondary, color_border,
    color_button_primary, color_button_secondary, color_link,
    theme_mode, border_radius, card_style, visual_density, button_size, spacing_scale,
    font_primary, font_base_size, font_heading_weight, font_heading_scale,
    header_show_logo, header_logo_size, header_alignment, header_background_style,
    header_show_search, header_cta_text, header_cta_href,
    footer_show_contact, footer_show_social, footer_show_policies, footer_columns_layout,
    is_published, published_at, published_by
) VALUES (
    'MantelsioRDshop',
    'Tienda online en República Dominicana: calidad, buen precio y entrega.',
    '© 2026 MantelsioRDshop — República Dominicana',
    'oklch(68% 0.28 330)', 'oklch(72% 0.20 195)', 'oklch(62% 0.22 150)',
    'oklch(4% 0.015 270)', 'oklch(10% 0.02 270)', 'oklch(98.5% 0.002 270)', 'oklch(65% 0.02 270)', 'oklch(16% 0.025 270)',
    'oklch(68% 0.28 330)', 'oklch(72% 0.20 195)', 'oklch(72% 0.20 195)',
    'system', '1rem', 'double-bezel', 'normal', 'normal', 'normal',
    'Plus Jakarta Sans', '1rem', '700', '1.2',
    true, 'normal', 'center', 'glass',
    false, 'Solicitar artículo', '/solicitar',
    true, true, true, 'auto',
    true, now(), NULL
) ON CONFLICT DO NOTHING;

-- Configuración inicial del sitio
INSERT INTO public.site_settings (key, value, description, is_public) VALUES
    ('social_facebook', '"https://facebook.com/mantelsiordshop"', 'Facebook URL', true),
    ('social_instagram', '"https://instagram.com/mantelsiordshop"', 'Instagram URL', true),
    ('social_tiktok', '"https://tiktok.com/@mantelsiordshop"', 'TikTok URL', true),
    ('social_whatsapp', '"https://wa.me/18095550123"', 'WhatsApp URL', true),
    ('contact_email', '"contacto@mantelsiordshop.com"', 'Email de contacto', true),
    ('contact_phone', '"+1 809 555 0123"', 'Teléfono de contacto', true),
    ('address', '"Santo Domingo, República Dominicana"', 'Dirección física', true),
    ('currency', '"DOP"', 'Moneda por defecto', true),
    ('timezone', '"America/Santo_Domingo"', 'Zona horaria', true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 7. RLS POLICIES
-- ------------------------------------------------------------

-- menu_items: Público puede ver elementos activos
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active menu items" ON public.menu_items;
CREATE POLICY "Public can view active menu items"
    ON public.menu_items FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage menu items" ON public.menu_items;
CREATE POLICY "Admin can manage menu items"
    ON public.menu_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- site_settings: Público puede ver claves públicas
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public site settings" ON public.site_settings;
CREATE POLICY "Public can view public site settings"
    ON public.site_settings FOR SELECT
    USING (is_public = true);

DROP POLICY IF EXISTS "Admin can manage site settings" ON public.site_settings;
CREATE POLICY "Admin can manage site settings"
    ON public.site_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- theme_settings: Público puede ver configuración publicada
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published theme" ON public.theme_settings;
CREATE POLICY "Public can view published theme"
    ON public.theme_settings FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Admin can manage theme settings" ON public.theme_settings;
CREATE POLICY "Admin can manage theme settings"
    ON public.theme_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- banners: Público puede ver banners activos y en fecha
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners"
    ON public.banners FOR SELECT
    USING (
        is_active = true
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at >= now())
    );

DROP POLICY IF EXISTS "Admin can manage banners" ON public.banners;
CREATE POLICY "Admin can manage banners"
    ON public.banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- customization_versions: Solo admin
ALTER TABLE public.customization_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view versions" ON public.customization_versions;
CREATE POLICY "Admin can view versions"
    ON public.customization_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

DROP POLICY IF EXISTS "Admin can create versions" ON public.customization_versions;
CREATE POLICY "Admin can create versions"
    ON public.customization_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff')
        )
    );

-- ------------------------------------------------------------
-- 8. TRIGGERS PARA updated_at
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER update_theme_settings_updated_at
    BEFORE UPDATE ON public.theme_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 9. FUNCIONES RPC
-- ------------------------------------------------------------

-- Obtener menú para una ubicación y usuario
CREATE OR REPLACE FUNCTION public.get_menu_for_location(
    p_location TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    label TEXT,
    href TEXT,
    icon TEXT,
    parent_id UUID,
    location TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
    visibility_rule TEXT,
    open_in_new_tab BOOLEAN,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT mi.id, mi.label, mi.href, mi.icon, mi.parent_id, mi.location, mi.sort_order,
           mi.is_active, mi.visibility_rule, mi.open_in_new_tab, mi.description
    FROM public.menu_items mi
    WHERE mi.location = p_location
      AND mi.is_active = true
      AND (
          mi.visibility_rule = 'all'
          OR (mi.visibility_rule = 'authenticated' AND p_user_id IS NOT NULL)
          OR (mi.visibility_rule = 'guest' AND p_user_id IS NULL)
          OR (mi.visibility_rule = 'admin' AND EXISTS (
              SELECT 1 FROM public.profiles
              WHERE id = p_user_id AND role IN ('owner', 'admin', 'staff')
          ))
      )
    ORDER BY mi.sort_order ASC;
END $$;

-- Obtener tema publicado
CREATE OR REPLACE FUNCTION public.get_published_theme()
RETURNS TABLE (
    id UUID,
    site_name TEXT,
    site_tagline TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    og_image_url TEXT,
    footer_text TEXT,
    color_primary TEXT,
    color_secondary TEXT,
    color_accent TEXT,
    color_background TEXT,
    color_card TEXT,
    color_text_primary TEXT,
    color_text_secondary TEXT,
    color_border TEXT,
    color_button_primary TEXT,
    color_button_secondary TEXT,
    color_link TEXT,
    theme_mode TEXT,
    border_radius TEXT,
    card_style TEXT,
    visual_density TEXT,
    button_size TEXT,
    spacing_scale TEXT,
    font_primary TEXT,
    font_base_size TEXT,
    font_heading_weight TEXT,
    font_heading_scale TEXT,
    header_show_logo BOOLEAN,
    header_logo_size TEXT,
    header_alignment TEXT,
    header_background_style TEXT,
    header_show_search BOOLEAN,
    header_cta_text TEXT,
    header_cta_href TEXT,
    footer_show_contact BOOLEAN,
    footer_show_social BOOLEAN,
    footer_show_policies BOOLEAN,
    footer_columns_layout TEXT,
    footer_contact_email TEXT,
    footer_contact_phone TEXT,
    footer_address TEXT,
    is_published BOOLEAN,
    published_at TIMESTAMPTZ,
    published_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ts.*
    FROM public.theme_settings ts
    WHERE ts.is_published = true
    ORDER BY ts.updated_at DESC
    LIMIT 1;
END $$;

-- Obtener banners para una ubicación
CREATE OR REPLACE FUNCTION public.get_banners_for_location(p_location TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    image_alt TEXT,
    button_text TEXT,
    button_href TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    location TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT b.*
    FROM public.banners b
    WHERE b.location = p_location
      AND b.is_active = true
      AND (b.starts_at IS NULL OR b.starts_at <= now())
      AND (b.ends_at IS NULL OR b.ends_at >= now())
    ORDER BY b.sort_order ASC;
END $$;

-- Guardar nueva versión de personalización
CREATE OR REPLACE FUNCTION public.save_customization_version(
    p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version_number INTEGER;
    v_new_version_id UUID;
    v_theme_settings JSONB;
    v_site_settings JSONB;
    v_menu_items JSONB;
    v_banners JSONB;
BEGIN
    -- Obtener siguiente número de versión
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM public.customization_versions;

    -- Obtener configuración actual
    SELECT jsonb_agg(to_jsonb(ts)) INTO v_theme_settings
    FROM public.theme_settings ts;

    SELECT jsonb_agg(to_jsonb(ss)) INTO v_site_settings
    FROM public.site_settings ss;

    SELECT jsonb_agg(to_jsonb(mi)) INTO v_menu_items
    FROM public.menu_items mi;

    SELECT jsonb_agg(to_jsonb(b)) INTO v_banners
    FROM public.banners b;

    -- Insertar nueva versión
    INSERT INTO public.customization_versions (
        version_number, theme_settings, site_settings, menu_items, banners,
        change_summary, created_by
    ) VALUES (
        v_version_number, v_theme_settings, v_site_settings, v_menu_items, v_banners,
        p_change_summary, auth.uid()
    ) RETURNING id INTO v_new_version_id;

    RETURN v_new_version_id;
END $$;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================