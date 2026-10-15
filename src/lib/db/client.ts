import { getDb } from './index';

/**
 * Cliente Drizzle centralizado para usar en Server Components, API Routes y Server Actions.
 * Reemplaza createClient() de @supabase/supabase-js
 */
export const db = getDb();

/**
 * Helper para transacciones
 */
export { withTransaction } from './index';