import { mysqlTable, char, varchar, text, boolean, timestamp, datetime, int, json, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ============================================================
// TABLA: profiles (Perfiles de usuario)
// ============================================================
export const profiles = mysqlTable('profiles', {
  id: char('id', { length: 36 }).primaryKey(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('República Dominicana'),
  role: varchar('role', { length: 20 }).default('customer').notNull(), // 'owner', 'admin', 'staff', 'customer'
  notificationPrefs: json('notification_prefs').$type<{
    orderUpdates: boolean;
    paymentReminders: boolean;
    deliveryUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
  }>().default(sql`JSON_OBJECT(
    'orderUpdates', true,
    'paymentReminders', true,
    'deliveryUpdates', true,
    'promotions', false,
    'newsletter', false,
    'securityAlerts', true
  )`),
  preferences: json('preferences').$type<{
    theme: 'light' | 'dark' | 'system';
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  }>().default(sql`JSON_OBJECT(
    'theme', 'system',
    'language', 'es-DO',
    'currency', 'DOP',
    'dateFormat', 'DD/MM/YYYY',
    'timeFormat', '24h'
  )`),
  emailNotifications: json('email_notifications').$type<{
    orderUpdates: boolean;
    paymentReminders: boolean;
    deliveryUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
  }>().default(sql`JSON_OBJECT(
    'orderUpdates', true,
    'paymentReminders', true,
    'deliveryUpdates', true,
    'promotions', false,
    'newsletter', false,
    'securityAlerts', true
  )`),
  privacySettings: json('privacy_settings').$type<{
    profileVisibility: 'public' | 'private' | 'friends';
    showOrderHistory: boolean;
    analyticsConsent: boolean;
    marketingConsent: boolean;
  }>().default(sql`JSON_OBJECT(
    'profileVisibility', 'private',
    'showOrderHistory', false,
    'analyticsConsent', true,
    'marketingConsent', false
  )`),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxRole: index('idx_profiles_role').on(table.role),
}));

// ============================================================
// TABLA: requests (Solicitudes/Pedidos de clientes)
// ============================================================
export const requests = mysqlTable('requests', {
  id: char('id', { length: 36 }).primaryKey(),
  requestCode: varchar('request_code', { length: 50 }).notNull().unique(),
  userId: char('user_id', { length: 36 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'producto', 'digital', 'otra_tienda', 'otro'
  productName: varchar('product_name', { length: 255 }).notNull(),
  productUrl: varchar('product_url', { length: 1000 }),
  productImage: varchar('product_image', { length: 500 }),
  quantity: int('quantity').default(1),
  estimatedPrice: int('estimated_price'), // en centavos
  finalPrice: int('final_price'), // en centavos
  currency: varchar('currency', { length: 3 }).default('DOP'),
  status: varchar('status', { length: 50 }).default('recibida').notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingCountry: varchar('shipping_country', { length: 100 }).default('República Dominicana'),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  estimatedDeliveryDate: datetime('estimated_delivery_date', { mode: 'date' }),
  estimatedDeliveryEndDate: datetime('estimated_delivery_end_date', { mode: 'date' }),
  estimatedDeliveryTime: datetime('estimated_delivery_time', { mode: 'date' }),
  estimatedDeliveryEndTime: datetime('estimated_delivery_end_time', { mode: 'date' }),
  deliveryToleranceDays: int('delivery_tolerance_days'),
  priceAccepted: boolean('price_accepted').default(false),
  priceAcceptedAt: datetime('price_accepted_at', { mode: 'date', fsp: 6 }),
  paidAt: datetime('paid_at', { mode: 'date', fsp: 6 }),
  purchasedAt: datetime('purchased_at', { mode: 'date', fsp: 6 }),
  shippedAt: datetime('shipped_at', { mode: 'date', fsp: 6 }),
  deliveredAt: datetime('delivered_at', { mode: 'date', fsp: 6 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  priority: int('priority').default(0),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxUserId: index('idx_requests_user_id').on(table.userId),
  idxStatus: index('idx_requests_status').on(table.status),
  idxRequestCode: index('idx_requests_request_code').on(table.requestCode),
  idxCreatedAt: index('idx_requests_created_at').on(table.createdAt),
}));

// ============================================================
// TABLA: order_events (Eventos del timeline de pedidos)
// ============================================================
export const orderEvents = mysqlTable('order_events', {
  id: char('id', { length: 36 }).primaryKey(),
  requestId: char('request_id', { length: 36 }).notNull().references(() => requests.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }),
  eventDate: datetime('event_date', { mode: 'date' }).notNull(),
  startTime: datetime('start_time', { mode: 'date' }),
  endTime: datetime('end_time', { mode: 'date' }),
  endDate: datetime('end_date', { mode: 'date' }),
  isEstimated: boolean('is_estimated').default(false),
  isRange: boolean('is_range').default(false),
  toleranceDays: int('tolerance_days'),
  isVisibleToCustomer: boolean('is_visible_to_customer').default(true),
  createdBy: char('created_by', { length: 36 }).references(() => users.id),
  metadata: json('metadata').default(sql`JSON_OBJECT()`),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxRequestId: index('idx_order_events_request_id').on(table.requestId),
  idxEventDate: index('idx_order_events_event_date').on(table.eventDate),
  idxEventType: index('idx_order_events_event_type').on(table.eventType),
  idxVisible: index('idx_order_events_visible').on(table.isVisibleToCustomer),
}));

// ============================================================
// TABLA: notifications
// ============================================================
export const notifications = mysqlTable('notifications', {
  id: char('id', { length: 36 }).primaryKey(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestId: char('request_id', { length: 36 }).references(() => requests.id, { onDelete: 'set null' }),
  orderEventId: char('order_event_id', { length: 36 }).references(() => orderEvents.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  read: boolean('read').default(false),
  actionUrl: varchar('action_url', { length: 500 }),
  metadata: json('metadata').default(sql`JSON_OBJECT()`),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  readAt: datetime('read_at', { mode: 'date', fsp: 6 }),
}, (table) => ({
  idxUserId: index('idx_notifications_user_id').on(table.userId),
  idxUserRead: index('idx_notifications_user_read').on(table.userId, table.read),
  idxCreatedAt: index('idx_notifications_created_at').on(table.createdAt),
}));

// ============================================================
// TABLA: reminder_logs
// ============================================================
export const reminderLogs = mysqlTable('reminder_logs', {
  id: char('id', { length: 36 }).primaryKey(),
  requestId: char('request_id', { length: 36 }).notNull().references(() => requests.id, { onDelete: 'cascade' }),
  orderEventId: char('order_event_id', { length: 36 }).references(() => orderEvents.id, { onDelete: 'set null' }),
  reminderType: varchar('reminder_type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 50 }).default('notification'),
  sentAt: timestamp('sent_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  dedupKey: varchar('dedup_key', { length: 100 }).notNull().unique(),
}, (table) => ({
  idxRequestId: index('idx_reminder_logs_request_id').on(table.requestId),
  idxDedup: index('idx_reminder_logs_dedup').on(table.dedupKey),
}));

// ============================================================
// TABLA: menu_items (Menú dinámico)
// ============================================================
export const menuItems = mysqlTable('menu_items', {
  id: char('id', { length: 36 }).primaryKey(),
  label: varchar('label', { length: 100 }).notNull(),
  href: varchar('href', { length: 500 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  parentId: char('parent_id', { length: 36 }),
  location: varchar('location', { length: 20 }).notNull().default('main'), // 'main', 'secondary', 'footer', 'user'
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  visibilityRule: varchar('visibility_rule', { length: 20 }).default('all').notNull(), // 'all', 'authenticated', 'guest', 'admin'
  openInNewTab: boolean('open_in_new_tab').default(false),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxParentId: index('idx_menu_items_parent_id').on(table.parentId),
  idxLocation: index('idx_menu_items_location').on(table.location),
  idxSortOrder: index('idx_menu_items_sort_order').on(table.location, table.sortOrder),
  idxActive: index('idx_menu_items_active').on(table.isActive),
}));

// ============================================================
// TABLA: site_settings
// ============================================================
export const siteSettings = mysqlTable('site_settings', {
  id: char('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: json('value').default(sql`JSON_OBJECT()`).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
});

// ============================================================
// TABLA: theme_settings
// ============================================================
export const themeSettings = mysqlTable('theme_settings', {
  id: char('id', { length: 36 }).primaryKey(),
  siteName: varchar('site_name', { length: 100 }).default('MantelsioRDshop').notNull(),
  siteTagline: varchar('site_tagline', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  logoDarkUrl: varchar('logo_dark_url', { length: 500 }),
  faviconUrl: varchar('favicon_url', { length: 500 }),
  ogImageUrl: varchar('og_image_url', { length: 500 }),
  footerText: varchar('footer_text', { length: 255 }),
  colorPrimary: varchar('color_primary', { length: 50 }).default('oklch(68% 0.28 330)'),
  colorSecondary: varchar('color_secondary', { length: 50 }).default('oklch(72% 0.20 195)'),
  colorAccent: varchar('color_accent', { length: 50 }).default('oklch(62% 0.22 150)'),
  colorBackground: varchar('color_background', { length: 50 }).default('oklch(4% 0.015 270)'),
  colorCard: varchar('color_card', { length: 50 }).default('oklch(10% 0.02 270)'),
  colorTextPrimary: varchar('color_text_primary', { length: 50 }).default('oklch(98.5% 0.002 270)'),
  colorTextSecondary: varchar('color_text_secondary', { length: 50 }).default('oklch(65% 0.02 270)'),
  colorBorder: varchar('color_border', { length: 50 }).default('oklch(16% 0.025 270)'),
  colorButtonPrimary: varchar('color_button_primary', { length: 50 }).default('oklch(68% 0.28 330)'),
  colorButtonSecondary: varchar('color_button_secondary', { length: 50 }).default('oklch(72% 0.20 195)'),
  colorLink: varchar('color_link', { length: 50 }).default('oklch(72% 0.20 195)'),
  themeMode: varchar('theme_mode', { length: 20 }).default('system').notNull(),
  borderRadius: varchar('border_radius', { length: 20 }).default('1rem'),
  cardStyle: varchar('card_style', { length: 20 }).default('double-bezel'),
  visualDensity: varchar('visual_density', { length: 20 }).default('normal'),
  buttonSize: varchar('button_size', { length: 20 }).default('normal'),
  spacingScale: varchar('spacing_scale', { length: 20 }).default('normal'),
  fontPrimary: varchar('font_primary', { length: 100 }).default('Plus Jakarta Sans'),
  fontBaseSize: varchar('font_base_size', { length: 20 }).default('1rem'),
  fontHeadingWeight: varchar('font_heading_weight', { length: 10 }).default('700'),
  fontHeadingScale: varchar('font_heading_scale', { length: 20 }).default('1.2'),
  headerShowLogo: boolean('header_show_logo').default(true),
  headerLogoSize: varchar('header_logo_size', { length: 20 }).default('normal'),
  headerAlignment: varchar('header_alignment', { length: 20 }).default('center'),
  headerBackgroundStyle: varchar('header_background_style', { length: 20 }).default('glass'),
  headerShowSearch: boolean('header_show_search').default(false),
  headerCtaText: varchar('header_cta_text', { length: 100 }).default('Solicitar artículo'),
  headerCtaHref: varchar('header_cta_href', { length: 255 }).default('/solicitar'),
  footerShowContact: boolean('footer_show_contact').default(true),
  footerShowSocial: boolean('footer_show_social').default(true),
  footerShowPolicies: boolean('footer_show_policies').default(true),
  footerColumnsLayout: varchar('footer_columns_layout', { length: 10 }).default('auto'),
  footerContactEmail: varchar('footer_contact_email', { length: 255 }),
  footerContactPhone: varchar('footer_contact_phone', { length: 50 }),
  footerAddress: text('footer_address'),
  isPublished: boolean('is_published').default(true),
  publishedAt: datetime('published_at', { mode: 'date', fsp: 6 }),
  publishedBy: char('published_by', { length: 36 }),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
});

// ============================================================
// TABLA: banners
// ============================================================
export const banners = mysqlTable('banners', {
  id: char('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  imageAlt: varchar('image_alt', { length: 255 }),
  buttonText: varchar('button_text', { length: 100 }),
  buttonHref: varchar('button_href', { length: 500 }),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  startsAt: datetime('starts_at', { mode: 'date', fsp: 6 }),
  endsAt: datetime('ends_at', { mode: 'date', fsp: 6 }),
  location: varchar('location', { length: 20 }).default('home').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxLocation: index('idx_banners_location').on(table.location),
  idxActive: index('idx_banners_active').on(table.isActive),
  idxDates: index('idx_banners_dates').on(table.startsAt, table.endsAt),
}));

// ============================================================
// TABLA: customization_versions
// ============================================================
export const customizationVersions = mysqlTable('customization_versions', {
  id: char('id', { length: 36 }).primaryKey(),
  versionNumber: int('version_number').notNull(),
  themeSettings: json('theme_settings').notNull(),
  siteSettings: json('site_settings').notNull(),
  menuItems: json('menu_items').notNull(),
  banners: json('banners').notNull(),
  changeSummary: text('change_summary'),
  createdBy: char('created_by', { length: 36 }),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxVersionNumber: index('idx_customization_versions_number').on(table.versionNumber),
}));

// ============================================================
// TABLA: users (para auth propia si se migra)
// ============================================================
export const users = mysqlTable('users', {
  id: char('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: varchar('password_hash', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: varchar('role', { length: 20 }).default('customer').notNull(),
  lastLoginAt: datetime('last_login_at', { mode: 'date', fsp: 6 }),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxEmail: index('idx_users_email').on(table.email),
}));

// ============================================================
// TABLA: sessions (para auth propia)
// ============================================================
export const sessions = mysqlTable('sessions', {
  id: char('id', { length: 36 }).primaryKey(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: datetime('expires_at', { mode: 'date', fsp: 6 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxUserId: index('idx_sessions_user_id').on(table.userId),
  idxExpiresAt: index('idx_sessions_expires_at').on(table.expiresAt),
}));

// ============================================================
// TABLA: products (Catálogo de productos)
// ============================================================
export const products = mysqlTable('products', {
  id: char('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: int('price').notNull(),
  category: varchar('category', { length: 100 }),
  tag: varchar('tag', { length: 50 }),
  imageUrl: varchar('image_url', { length: 500 }),
  stock: int('stock').default(1),
  source: varchar('source', { length: 100 }),
  sourceUrl: varchar('source_url', { length: 500 }),
  originalPrice: int('original_price'),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxCategory: index('idx_products_category').on(table.category),
  idxCreatedAt: index('idx_products_created_at').on(table.createdAt),
}));

// ============================================================
// TABLA: orders
// ============================================================
export const orders = mysqlTable('orders', {
  id: char('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: char('user_id', { length: 36 }),
  customerId: char('customer_id', { length: 36 }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingCost: int('shipping_cost').default(0),
  subtotal: int('subtotal').notNull(),
  total: int('total').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).default('cod'),
  notes: text('notes'),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
  status: varchar('status', { length: 50 }).default('nuevo').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxCustomerId: index('idx_orders_customer_id').on(table.customerId),
  idxStatus: index('idx_orders_status').on(table.status),
  idxOrderNumber: index('idx_orders_order_number').on(table.orderNumber),
  idxCreatedAt: index('idx_orders_created_at').on(table.createdAt),
  idxIdempotencyKey: index('idx_orders_idempotency_key').on(table.idempotencyKey),
}));

// ============================================================
// TABLA: order_items
// ============================================================
export const orderItems = mysqlTable('order_items', {
  id: char('id', { length: 36 }).primaryKey(),
  orderId: char('order_id', { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: char('product_id', { length: 36 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: int('quantity').notNull(),
  price: int('price').notNull(),
}, (table) => ({
  idxOrderId: index('idx_order_items_order_id').on(table.orderId),
  idxProductId: index('idx_order_items_product_id').on(table.productId),
}));

// ============================================================
// TABLA: customers (para upsert_customer)
// ============================================================
export const customers = mysqlTable('customers', {
  id: char('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
  updatedAt: timestamp('updated_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxPhone: index('idx_customers_phone').on(table.phone),
}));

// ============================================================
// TABLA: verificationTokens (para auth propia)
// ============================================================
export const verificationTokens = mysqlTable('verification_tokens', {
  id: char('id', { length: 36 }).primaryKey(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // 'email_verification', 'password_reset'
  expiresAt: datetime('expires_at', { mode: 'date', fsp: 6 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`),
}, (table) => ({
  idxUserId: index('idx_verification_tokens_user_id').on(table.userId),
  idxToken: index('idx_verification_tokens_token').on(table.token),
}));

// Export all tables
export const schema = {
  profiles,
  requests,
  orderEvents,
  notifications,
  reminderLogs,
  menuItems,
  siteSettings,
  themeSettings,
  banners,
  customizationVersions,
  users,
  sessions,
  verificationTokens,
  orders,
  orderItems,
  customers,
};