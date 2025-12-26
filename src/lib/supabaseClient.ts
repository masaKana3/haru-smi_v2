import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// デバッグ用: 環境変数の読み込み状況を確認（確認後は削除可能です）
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Not Set");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Client creation aborted.");
  throw new Error("Supabase URL and Anon Key are not set. Please check your .env.local file and restart the server.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);