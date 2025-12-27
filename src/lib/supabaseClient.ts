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

// 1. 接続テスト（Health Check）
export const testSupabaseConnection = async () => {
  try {
    // 存在しないテーブルからデータを1件取得しようと試みる
    // これが 'relation "public.health_check" does not exist' のようなAPIエラーになれば、Supabaseとの通信は成功している
    // 型定義がまだ空のため、一時的に any として扱う
    // supabase クライアント自体を any にキャストして型チェックを回避
    const { error } = await (supabase as any).from("health_check").select("*").limit(1);

    // エラーがあっても、それが「テーブルが存在しない」という内容であれば、
    // Supabaseサーバーまでは到達できているため「接続成功」とみなす
    const isTableMissing = error && (error.code === "42P01" || error.message.includes("Could not find the table"));

    if (error && !isTableMissing) {
      throw error;
    }
    console.log("✅ Supabase connection successful.");
  } catch (error: any) {
    console.error("❌ Supabase connection failed:", error.message);
  }
};