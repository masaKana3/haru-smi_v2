import { loadPosts, savePosts } from "../api/communityStorage";
import { Comment, Post, Topic, Visibility } from "../types/community";

const topics: Topic[] = [
  { id: "t1", title: "毎日の小さな工夫", description: "生活リズムやセルフケアのアイデア共有" },
  { id: "t2", title: "体験談を聞かせて", description: "症状との向き合い方や乗り越え方" },
  { id: "t3", title: "質問・相談コーナー", description: "気になることを気軽に聞いてみましょう" },
];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function seedPosts() {
  const current = loadPosts();
  if (current.length > 0) return;
  const seeded: Post[] = [
    {
      id: uid("post"),
      type: "thread",
      title: "朝の冷え対策",
      content: "白湯をゆっくり飲んでストレッチしています。みなさんは？",
      authorId: "admin",
      visibility: "public",
      topicId: "t1",
      createdAt: Date.now() - 1000 * 60 * 60 * 4,
      likes: 2,
      comments: [],
    },
    {
      id: uid("post"),
      type: "diary",
      title: "ゆったり過ごした日",
      content: "今日は散歩だけにして、早めに湯船に浸かりました。",
      authorId: "admin",
      visibility: "public",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      likes: 1,
      comments: [],
    },
  ];
  savePosts(seeded);
}

export function getTopics(): Topic[] {
  return topics;
}

function getAllPosts(): Post[] {
  seedPosts();
  return loadPosts().sort((a, b) => b.createdAt - a.createdAt);
}

function persist(posts: Post[]): Post[] {
  savePosts(posts);
  return posts;
}

export function listPublicPosts(): Post[] {
  return getAllPosts().filter((p) => p.visibility === "public");
}

export function listPostsByTopic(topicId: string): Post[] {
  return getAllPosts().filter((p) => p.type === "thread" && p.topicId === topicId);
}

export function listPrivateDiariesByAuthor(authorId: string): Post[] {
  return getAllPosts().filter(
    (p) => p.type === "diary" && p.visibility === "private" && p.authorId === authorId
  );
}

export function getPostById(postId: string): Post | null {
  return getAllPosts().find((p) => p.id === postId) ?? null;
}

type CreatePostInput = {
  type: Post["type"];
  title?: string;
  content: string;
  authorId: string;
  visibility: Visibility;
  topicId?: string;
};

export function createPost(input: CreatePostInput): Post {
  const posts = getAllPosts();
  const newPost: Post = {
    id: uid("post"),
    type: input.type,
    title: input.title?.trim() || undefined,
    content: input.content.trim(),
    authorId: input.authorId,
    visibility: input.visibility,
    topicId: input.type === "thread" ? input.topicId : undefined,
    createdAt: Date.now(),
    likes: 0,
    comments: [],
  };

  persist([newPost, ...posts]);
  return newPost;
}

export function addComment(postId: string, content: string, authorId: string): Comment | null {
  const posts = getAllPosts();
  const target = posts.find((p) => p.id === postId);
  if (!target) return null;

  const newComment: Comment = {
    id: uid("cmt"),
    postId,
    content: content.trim(),
    authorId,
    createdAt: Date.now(),
    likes: 0,
  };

  target.comments = [newComment, ...target.comments];
  persist(posts);
  return newComment;
}

export function likePost(postId: string): void {
  const posts = getAllPosts();
  const target = posts.find((p) => p.id === postId);
  if (!target) return;
  target.likes += 1;
  persist(posts);
}

export function likeComment(postId: string, commentId: string): void {
  const posts = getAllPosts();
  const target = posts.find((p) => p.id === postId);
  if (!target) return;
  const comment = target.comments.find((c) => c.id === commentId);
  if (!comment) return;
  comment.likes += 1;
  persist(posts);
}
