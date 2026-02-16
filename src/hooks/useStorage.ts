import { useCallback, useMemo } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { SMIConvertedAnswer, SMIRecord } from "../types/smi";
import { CommunityPost, CommunityTopic } from "../types/community";
import { UserProfile, UserAuth } from "../types/user";
import { supabase } from "../lib/supabaseClient";
import { Json } from "../types/supabase";

const POSTS_KEY = "haru_posts";
const COMMENTS_KEY = "haru_comments";
const REPORTS_KEY = "haru_reports";
const LIKES_KEY = "haru_likes";

// UUID形式（ハイフンを含む）かどうかを判定する補助関数
const isUUID = (id: string | null | undefined): id is string => {
  return typeof id === 'string' && id.includes('-');
};

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useStorage() {
  const isAdmin = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === 'admin@test.jp';
  }, []);

  // SMIデータの保存 (Cache only) - この関数はSupabaseに移行したため処理を空にする
  const saveSMIResult = useCallback(async (total: number, answers: SMIConvertedAnswer[]) => {
    // localStorage.setItem("haru_smi_total", String(total));
    // localStorage.setItem("haru_smi_answers", JSON.stringify(answers));
    // localStorage.setItem("haru_smi_done", "true");
  }, []);

  // SMIデータの読み込み
  const loadSMIResult = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data, error } = await (supabase.from("smi_results") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const row = data as any;
        return {
          done: true,
          total: row.total_score ?? null,
          answers: (row.answers as unknown) as SMIConvertedAnswer[],
        };
      }
    }
    
    // ユーザーに紐づくデータがない場合はデフォルト値を返す
    return { done: false, total: null, answers: null };
  }, []);

  // SMI履歴の保存
  const saveSMIHistory = useCallback(async (total: number, answers: SMIConvertedAnswer[]) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { error } = await (supabase.from("smi_results") as any).insert({
        user_id: user.id,
        total_score: total,
        answers: (answers as unknown) as Json,
      });
      if (error) console.error("Failed to save SMI history to Supabase:", error);
    }
  }, []);

  // SMI履歴の読み込み
  const loadSMIHistory = useCallback(async (): Promise<SMIRecord[]> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data } = await (supabase.from("smi_results") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) {
        return (data as any[]).map((d) => ({
          date: d.created_at!,
          total: d.total_score ?? 0,
          answers: (d.answers as unknown) as SMIConvertedAnswer[],
        }));
      }
    }

    return [];
  }, []);

  // 日々の記録の保存
  const saveDailyRecord = useCallback(async (data: DailyRecord) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { error } = await (supabase.from("daily_checks") as any)
        .upsert({
          user_id: user.id,
          date: data.date,
          answers: (data.answers as unknown) as Json,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,date' });
      
      if (error) console.error("Failed to save daily record to Supabase:", error);
    }
  }, []);

  // 日々の記録の読み込み（単日）
  const loadDailyRecord = useCallback(async (date: string): Promise<DailyRecord | null> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data, error } = await (supabase.from("daily_checks") as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();
      
      if (!error && data) {
        const row = data as any;
        return {
          date: row.date,
          answers: (row.answers as unknown) as DailyRecord['answers'],
          // items はdaily_checksテーブルにないので、ここで返すのはやめる
          // items: row.items
        };
      }
    }
    return null;
  }, []);

  // 日々の記録の読み込み（全履歴）
  const loadAllDailyRecords = useCallback(async (): Promise<DailyRecord[]> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data } = await (supabase.from("daily_checks") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (data) {
        return (data as any[]).map((d) => ({
          date: d.date,
          answers: (d.answers as unknown) as DailyRecord['answers'],
        }));
      }
    }
    return [];
  }, []);

  // 生理記録の読み込み（全件）
  const loadAllPeriods = useCallback(async (): Promise<PeriodRecord[]> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return [];
    
    const { data, error } = await supabase
      .from("periods")
      .select("start, end")
      .eq("user_id", user.id)
      .order("start", { ascending: false });

    if (error) {
      console.error("Failed to load periods from Supabase:", error);
      return [];
    }
    return (data || []) as PeriodRecord[];
  }, []);

  // 生理記録の保存
  const savePeriods = useCallback(async (periods: PeriodRecord[]) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    // 既存のデータをすべて削除
    const { error: deleteError } = await supabase
      .from("periods")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete old periods from Supabase:", deleteError);
      return;
    }

    // 新しいデータを挿入
    if (periods.length > 0) {
      const dataToInsert = periods.map(p => ({
        user_id: user.id,
        start: p.start,
        end: p.end,
      }));
      const { error: insertError } = await supabase.from("periods").insert(dataToInsert);
      if (insertError) {
        console.error("Failed to save periods to Supabase:", insertError);
      }
    }
  }, []);

  // 生理記録の読み込み（最新）
  const getLatestPeriod = useCallback(async (): Promise<PeriodRecord | null> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("periods")
      .select("start, end")
      .eq("user_id", user.id)
      .order("start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Failed to load latest period from Supabase:", error);
      return null;
    }
    return data as PeriodRecord | null;
  }, []);

  // === Community Board (Supabase) ===

  // トピック（お題）の一覧を取得
  const listCommunityTopics = useCallback(async (): Promise<CommunityTopic[]> => {
    const { data, error } = await supabase
      .from("community_topics")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching community topics:", error);
      return [];
    }
    return data || [];
  }, []);

  // 管理者がトピック（お題）を作成
  const createCommunityTopic = useCallback(async (title: string): Promise<CommunityTopic | null> => {
    const { data, error } = await supabase
      .from("community_topics")
      .insert({ title })
      .select()
      .single();
    if (error) {
      console.error("Error creating community topic:", error);
      if (error.code === '42501') {
        alert('トピック作成の権限がありません。');
      }
      return null;
    }
    return data;
  }, []);

  // 特定のトピックに紐づく投稿の一覧を取得
  const listCommunityPosts = useCallback(async (topicId: string): Promise<CommunityPost[]> => {
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        profiles (
          nickname,
          avatar_url
        )
      `)
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching community posts:", error);
      return [];
    }
    
    // 取得したデータをCommunityPost型に整形
    return (data || []).map(post => {
      const profileData = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
      return {
        ...post,
        // rename avatar_url to avatarUrl to match UserProfile type
        profiles: profileData ? {
          nickname: profileData.nickname,
          avatarUrl: profileData.avatar_url,
        } : undefined,
      };
    });
  }, []);

  // ユーザーが投稿を作成
  const createCommunityPost = useCallback(async (topicId: string, content: string): Promise<CommunityPost | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not logged in");
      alert("ログインが必要です。");
      return null;
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({ topic_id: topicId, user_id: user.id, content })
      .select()
      .single();

    if (error) {
      console.error("Error creating community post:", error);
      return null;
    }
    return data;
  }, []);

  // === User Profile ===

  const saveProfile = useCallback(async (profile: UserProfile, userId?: string) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    const targetId = userId || user?.id || localStorage.getItem("haru_current_user_id");
    if (!targetId) return;

    const key = `haru_profile_${targetId}`;
    localStorage.setItem(key, JSON.stringify(profile));

    if (user && user.id === targetId) {
      const { error } = await (supabase.from("profiles") as any).upsert({
        id: targetId,
        nickname: profile.nickname,
        bio: profile.bio,
        avatar_url: profile.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("Failed to save profile to Supabase:", error);
    }
  }, []);

  const loadProfile = useCallback(async (userId?: string): Promise<UserProfile | null> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    let targetId = userId || user?.id || localStorage.getItem("haru_current_user_id");
    
    // Supabaseリクエスト前のUUIDチェック
    if (isUUID(targetId)) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();
        
        if (!error && data) {
          const row = data as any;
          return {
            nickname: row.nickname || "",
            bio: row.bio || "",
            avatarUrl: row.avatar_url || undefined,
          } as UserProfile;
        }
      }
    }

    if (targetId) {
      const key = `haru_profile_${targetId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const localProfile = JSON.parse(raw) as any;
          return {
            nickname: localProfile.nickname || "",
            bio: localProfile.bio || "",
            avatarUrl: localProfile.avatarUrl || localProfile.avatar_url || undefined,
          } as UserProfile;
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    return loadProfile(userId);
  }, [loadProfile]);

  // === Authentication (Legacy LocalStorage) ===

  const registerUser = useCallback(async (email: string, password: string): Promise<string> => {
    const hashedPassword = await hashPassword(password);
    const raw = localStorage.getItem("haru_users");
    const users: UserAuth[] = raw ? JSON.parse(raw) : [];

    if (users.some((u) => u.email === email)) {
      throw new Error("このメールアドレスは既に使用されています。");
    }

    const newUser: UserAuth = {
      id: `u_${Math.random().toString(36).slice(2, 9)}`,
      email,
      passwordHash: hashedPassword,
    };

    localStorage.setItem("haru_users", JSON.stringify([...users, newUser]));
    return newUser.id;
  }, []);

  const loginUser = useCallback(async (email: string, password: string): Promise<string | null> => {
    const hashedPassword = await hashPassword(password);
    const raw = localStorage.getItem("haru_users");
    const users: UserAuth[] = raw ? JSON.parse(raw) : [];
    const user = users.find((u) => u.email === email && u.passwordHash === hashedPassword);
    return user ? user.id : null;
  }, []);

  const checkEmailExists = useCallback(async (email: string): Promise<boolean> => {
    const raw = localStorage.getItem("haru_users");
    const users: UserAuth[] = raw ? JSON.parse(raw) : [];
    return users.some((u) => u.email === email);
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string): Promise<void> => {
    const hashedPassword = await hashPassword(newPassword);
    const raw = localStorage.getItem("haru_users");
    const users: UserAuth[] = raw ? JSON.parse(raw) : [];
    const index = users.findIndex((u) => u.email === email);

    if (index === -1) {
      throw new Error("ユーザーが見つかりません。");
    }

    users[index].passwordHash = hashedPassword;
    localStorage.setItem("haru_users", JSON.stringify(users));
  }, []);

  return useMemo(() => ({
    saveSMIResult,
    loadSMIResult,
    saveSMIHistory,
    loadSMIHistory,
    saveDailyRecord,
    loadDailyRecord,
    loadAllDailyRecords,
    loadAllPeriods,
    savePeriods,
    getLatestPeriod,
    listCommunityTopics,
    createCommunityTopic,
    listCommunityPosts,
    createCommunityPost,
    saveProfile,
    loadProfile,
    getUserProfile,
    registerUser,
    loginUser,
    checkEmailExists,
    resetPassword,
    isAdmin,
  }), [
    saveSMIResult,
    loadSMIResult,
    saveSMIHistory,
    loadSMIHistory,
    saveDailyRecord,
    loadDailyRecord,
    loadAllDailyRecords,
    loadAllPeriods,
    savePeriods,
    getLatestPeriod,
    listCommunityTopics,
    createCommunityTopic,
    listCommunityPosts,
    createCommunityPost,
    saveProfile,
    loadProfile,
    getUserProfile,
    registerUser,
    loginUser,
    checkEmailExists,
    resetPassword,
    isAdmin,
  ]);
}