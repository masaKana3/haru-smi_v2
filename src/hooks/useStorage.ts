import { useCallback, useMemo } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { SMIConvertedAnswer, SMIRecord } from "../types/smi";
import { Post, Comment, Visibility, Report } from "../types/community";
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

  // === Community Posts ===

  const listPosts = useCallback(
    async (query?: {
      authorId?: string;
      topicId?: string;
      visibility?: Visibility;
      isPublic?: boolean;
      type?: "thread" | "diary" | "official";
    }): Promise<Post[]> => {
      const raw = localStorage.getItem(POSTS_KEY);
      let posts: Post[] = raw ? JSON.parse(raw) : [];

      if (query?.authorId) {
        posts = posts.filter((p) => p.authorId === query.authorId);
      }
      if (query?.topicId) {
        posts = posts.filter((p) => p.topicId === query.topicId);
      }
      if (query?.visibility) {
        posts = posts.filter((p) => p.visibility === query.visibility);
      }
      if (query?.isPublic) {
        posts = posts.filter((p) => p.visibility === "public");
      }
      if (query?.type) {
        posts = posts.filter((p) => p.type === query.type);
      }

      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    []
  );

  const getPostById = useCallback(async (id: string): Promise<Post | null> => {
    const raw = localStorage.getItem(POSTS_KEY);
    const posts: Post[] = raw ? JSON.parse(raw) : [];
    const post = posts.find((p) => p.id === id);
    return post || null;
  }, []);

  const savePost = useCallback(
    async (
      postData: Omit<Post, "id" | "createdAt" | "likes"> & { id?: string }
    ): Promise<Post> => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      
      const raw = localStorage.getItem(POSTS_KEY);
      const posts: Post[] = raw ? JSON.parse(raw) : [];

      if (postData.id) {
        const index = posts.findIndex((p) => p.id === postData.id);
        if (index !== -1) {
          const updatedPost = { ...posts[index], ...postData } as Post;
          posts[index] = updatedPost;
          localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
          return updatedPost;
        }
      }
      
      const newPost: Post = {
        likes: 0,
        ...postData,
        authorId: user?.id || postData.authorId,
        id: postData.id || `p_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(POSTS_KEY, JSON.stringify([newPost, ...posts]));
      return newPost;
    },
    []
  );

  const deletePost = useCallback(async (id: string): Promise<void> => {
    const rawPosts = localStorage.getItem(POSTS_KEY);
    let posts: Post[] = rawPosts ? JSON.parse(rawPosts) : [];
    posts = posts.filter((p) => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));

    const rawComments = localStorage.getItem(COMMENTS_KEY);
    let comments: Comment[] = rawComments ? JSON.parse(rawComments) : [];
    comments = comments.filter((c) => c.postId !== id);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }, []);

  const likePost = useCallback(async (id: string, userId: string): Promise<Post | null> => {
    const rawLikes = localStorage.getItem(LIKES_KEY);
    const likes: { userId: string; postId: string }[] = rawLikes ? JSON.parse(rawLikes) : [];
    
    const existingIndex = likes.findIndex((l) => l.userId === userId && l.postId === id);
    let isAdding = true;

    if (existingIndex !== -1) {
      likes.splice(existingIndex, 1);
      isAdding = false;
    } else {
      likes.push({ userId, postId: id });
      isAdding = true;
    }
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));

    const raw = localStorage.getItem(POSTS_KEY);
    const posts: Post[] = raw ? JSON.parse(raw) : [];
    const index = posts.findIndex((p) => p.id === id);
    if (index !== -1) {
      posts[index].likes = isAdding ? posts[index].likes + 1 : Math.max(0, posts[index].likes - 1);
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      return posts[index];
    }
    return null;
  }, []);

  const listLikedPosts = useCallback(async (userId: string): Promise<Post[]> => {
    const rawLikes = localStorage.getItem(LIKES_KEY);
    const likes: { userId: string; postId: string }[] = rawLikes ? JSON.parse(rawLikes) : [];
    const myLikedPostIds = likes.filter((l) => l.userId === userId).map((l) => l.postId);

    const rawPosts = localStorage.getItem(POSTS_KEY);
    const posts: Post[] = rawPosts ? JSON.parse(rawPosts) : [];
    
    const result = posts.filter((p) => myLikedPostIds.includes(p.id));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  // === Community Comments ===

  const loadCommentsByPostId = useCallback(async (postId: string): Promise<Comment[]> => {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const allComments: Comment[] = raw ? JSON.parse(raw) : [];
    const postComments = allComments.filter((c) => c.postId === postId);
    return postComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  const saveComment = useCallback(async (commentData: Omit<Comment, "id" | "createdAt" | "likes">): Promise<Comment> => {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const allComments: Comment[] = raw ? JSON.parse(raw) : [];
    const newComment: Comment = {
      ...commentData,
      id: `c_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([newComment, ...allComments]));
    return newComment;
  }, []);

  const likeComment = useCallback(async (id: string): Promise<Comment | null> => {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const comments: Comment[] = raw ? JSON.parse(raw) : [];
    const index = comments.findIndex((c) => c.id === id);
    if (index !== -1) {
      comments[index].likes += 1;
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
      return comments[index];
    }
    return null;
  }, []);

  const deleteComment = useCallback(async (id: string): Promise<void> => {
    const raw = localStorage.getItem(COMMENTS_KEY);
    let comments: Comment[] = raw ? JSON.parse(raw) : [];
    comments = comments.filter((c) => c.id !== id);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }, []);

  // === Community Reports ===

  const saveReport = useCallback(async (reportData: Omit<Report, "id" | "createdAt">): Promise<void> => {
    const raw = localStorage.getItem(REPORTS_KEY);
    const reports: Report[] = raw ? JSON.parse(raw) : [];
    const newReport: Report = {
      ...reportData,
      id: `r_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(REPORTS_KEY, JSON.stringify([newReport, ...reports]));
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
    listPosts,
    getPostById,
    savePost,
    deletePost,
    likePost,
    listLikedPosts,
    loadCommentsByPostId,
    saveComment,
    likeComment,
    deleteComment,
    saveReport,
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
    listPosts,
    getPostById,
    savePost,
    deletePost,
    likePost,
    listLikedPosts,
    loadCommentsByPostId,
    saveComment,
    likeComment,
    deleteComment,
    saveReport,
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