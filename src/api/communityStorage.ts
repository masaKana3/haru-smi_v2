import { Post } from "../types/community";

const STORAGE_KEY = "haru_posts_v1";

function safeParse(raw: string | null): Post[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Post[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function loadPosts(): Post[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParse(raw);
  } catch {
    return [];
  }
}

export function savePosts(posts: Post[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore storage errors
  }
}
