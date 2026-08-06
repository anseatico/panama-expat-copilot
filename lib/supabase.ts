import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para el navegador
export const createClientSupabase = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente genérico
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
