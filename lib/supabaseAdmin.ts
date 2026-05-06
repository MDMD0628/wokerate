import "server-only";
import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string) {
  const rawValue = process.env[name];

  if (typeof rawValue !== "string") {
    throw new Error(`${name} is not configured.`);
  }

  const value = rawValue
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\r\n]/g, "");

  if (!value || value === "undefined" || value === "null") {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
