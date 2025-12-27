import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 初期化時に現在のセッションを取得
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Session init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. ログイン・ログアウト等の状態変化をリアルタイムで監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // クリーンアップ
    return () => subscription.unsubscribe();
  }, []);

  // 新規登録（サインアップ）
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // ログアウト
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    loading,
    signUp,
    signOut,
  };
}