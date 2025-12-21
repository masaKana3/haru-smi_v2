import { useCallback } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { SMIConvertedAnswer } from "../types/smi";
import { Post, Comment, Visibility, Report } from "../types/community";

const POSTS_KEY = "haru_posts";
const COMMENTS_KEY = "haru_comments";
const REPORTS_KEY = "haru_reports";

export function useStorage() {
  // SMIデータの保存
  const saveSMIResult = useCallback(async (total: number, answers: SMIConvertedAnswer[]) => {
    return new Promise<void>((resolve) => {
      localStorage.setItem("haru_smi_total", String(total));
      localStorage.setItem("haru_smi_answers", JSON.stringify(answers));
      localStorage.setItem("haru_smi_done", "true");
      resolve();
    });
  }, []);

  // SMIデータの読み込み
  const loadSMIResult = useCallback(async () => {
    return new Promise<{ done: boolean; total: number | null; answers: SMIConvertedAnswer[] | null }>((resolve) => {
      const done = localStorage.getItem("haru_smi_done") === "true";
      const totalStr = localStorage.getItem("haru_smi_total");
      const answersStr = localStorage.getItem("haru_smi_answers");

      const total = totalStr ? Number(totalStr) : null;
      let answers: SMIConvertedAnswer[] | null = null;
      if (answersStr) {
        try {
          answers = JSON.parse(answersStr) as SMIConvertedAnswer[];
        } catch (e) {
          console.error("Failed to parse SMI answers", e);
        }
      }
      resolve({ done, total, answers });
    });
  }, []);

  // 日々の記録の保存
  const saveDailyRecord = useCallback(async (data: DailyRecord) => {
    return new Promise<void>((resolve) => {
      const key = `haru_daily_${data.date}`;
      localStorage.setItem(key, JSON.stringify(data));
      resolve();
    });
  }, []);

  // 日々の記録の読み込み（単日）
  const loadDailyRecord = useCallback(async (date: string): Promise<DailyRecord | null> => {
    return new Promise((resolve) => {
      const key = `haru_daily_${date}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw) as DailyRecord);
      } catch (e) {
        console.error(`Failed to parse daily record for ${date}`, e);
        resolve(null);
      }
    });
  }, []);

  // 日々の記録の読み込み（全履歴）
  const loadAllDailyRecords = useCallback(async (): Promise<DailyRecord[]> => {
    return new Promise((resolve) => {
      const records = Object.keys(localStorage)
        .filter((key) => key.startsWith("haru_daily_"))
        .map((key) => {
          const value = localStorage.getItem(key);
          if (!value) return null;
          try {
            return JSON.parse(value) as DailyRecord;
          } catch {
            return null;
          }
        })
        .filter((record): record is DailyRecord => record !== null)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      resolve(records);
    });
  }, []);

  // 生理記録の読み込み（最新）
  const getLatestPeriod = useCallback(async (): Promise<PeriodRecord | null> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem("haru_periods");
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        const list = JSON.parse(raw) as PeriodRecord[];
        if (list.length === 0) {
          resolve(null);
          return;
        }
        list.sort((a, b) => (a.start < b.start ? 1 : -1));
        resolve(list[0]);
      } catch {
        resolve(null);
      }
    });
  }, []);

  // === Community Posts ===

  const listPosts = useCallback(
    async (query?: {
      authorId?: string;
      topicId?: string;
      visibility?: Visibility;
      isPublic?: boolean;
      type?: "thread" | "diary";
    }): Promise<Post[]> => {
      return new Promise((resolve) => {
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

        resolve(posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });
    },
    []
  );

  const getPostById = useCallback(async (id: string): Promise<Post | null> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(POSTS_KEY);
      const posts: Post[] = raw ? JSON.parse(raw) : [];
      const post = posts.find((p) => p.id === id);
      resolve(post || null);
    });
  }, []);

  const savePost = useCallback(
    async (
      postData: Omit<Post, "id" | "createdAt" | "likes"> & { id?: string }
    ): Promise<Post> => {
      return new Promise((resolve) => {
        const raw = localStorage.getItem(POSTS_KEY);
        const posts: Post[] = raw ? JSON.parse(raw) : [];

        if (postData.id) {
          // Update
          const index = posts.findIndex((p) => p.id === postData.id);
          if (index !== -1) {
            const updatedPost = { ...posts[index], ...postData } as Post;
            posts[index] = updatedPost;
            localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
            resolve(updatedPost);
          } else {
            // Fallback to create if ID not found
            const newPost: Post = {
              likes: 0,
              ...postData,
              id: `p_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem(POSTS_KEY, JSON.stringify([newPost, ...posts]));
            resolve(newPost);
          }
        } else {
          // Create
          const newPost: Post = {
            likes: 0,
            ...postData,
            id: `p_${Math.random().toString(36).slice(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(POSTS_KEY, JSON.stringify([newPost, ...posts]));
          resolve(newPost);
        }
      });
    },
    []
  );

  const deletePost = useCallback(async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      const rawPosts = localStorage.getItem(POSTS_KEY);
      let posts: Post[] = rawPosts ? JSON.parse(rawPosts) : [];
      posts = posts.filter((p) => p.id !== id);
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));

      const rawComments = localStorage.getItem(COMMENTS_KEY);
      let comments: Comment[] = rawComments ? JSON.parse(rawComments) : [];
      comments = comments.filter((c) => c.postId !== id);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));

      resolve();
    });
  }, []);

  const likePost = useCallback(async (id: string): Promise<Post | null> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(POSTS_KEY);
      const posts: Post[] = raw ? JSON.parse(raw) : [];
      const index = posts.findIndex((p) => p.id === id);
      if (index !== -1) {
        posts[index].likes += 1;
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
        resolve(posts[index]);
      } else {
        resolve(null);
      }
    });
  }, []);

  // === Community Comments ===

  const loadCommentsByPostId = useCallback(async (postId: string): Promise<Comment[]> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(COMMENTS_KEY);
      const allComments: Comment[] = raw ? JSON.parse(raw) : [];
      const postComments = allComments.filter((c) => c.postId === postId);
      resolve(postComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
  }, []);

  const saveComment = useCallback(async (commentData: Omit<Comment, "id" | "createdAt" | "likes">): Promise<Comment> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(COMMENTS_KEY);
      const allComments: Comment[] = raw ? JSON.parse(raw) : [];
      const newComment: Comment = {
        ...commentData,
        id: `c_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      localStorage.setItem(COMMENTS_KEY, JSON.stringify([newComment, ...allComments]));
      resolve(newComment);
    });
  }, []);

  const likeComment = useCallback(async (id: string): Promise<Comment | null> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(COMMENTS_KEY);
      const comments: Comment[] = raw ? JSON.parse(raw) : [];
      const index = comments.findIndex((c) => c.id === id);
      if (index !== -1) {
        comments[index].likes += 1;
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
        resolve(comments[index]);
      } else {
        resolve(null);
      }
    });
  }, []);

  const deleteComment = useCallback(async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(COMMENTS_KEY);
      let comments: Comment[] = raw ? JSON.parse(raw) : [];
      comments = comments.filter((c) => c.id !== id);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
      resolve();
    });
  }, []);

  // === Community Reports ===

  const saveReport = useCallback(async (reportData: Omit<Report, "id" | "createdAt">): Promise<void> => {
    return new Promise((resolve) => {
      const raw = localStorage.getItem(REPORTS_KEY);
      const reports: Report[] = raw ? JSON.parse(raw) : [];
      const newReport: Report = {
        ...reportData,
        id: `r_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(REPORTS_KEY, JSON.stringify([newReport, ...reports]));
      resolve();
    });
  }, []);

  return {
    saveSMIResult,
    loadSMIResult,
    saveDailyRecord,
    loadDailyRecord,
    loadAllDailyRecords,
    getLatestPeriod,
    listPosts,
    getPostById,
    savePost,
    deletePost,
    likePost,
    loadCommentsByPostId,
    saveComment,
    likeComment,
    deleteComment,
    saveReport,
  };
}