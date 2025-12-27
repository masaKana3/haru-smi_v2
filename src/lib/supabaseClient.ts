import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Client creation aborted.");
  throw new Error("Supabase URL and Anon Key are not set. Please check your .env.local file and restart the server.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);