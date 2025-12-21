export type Visibility = "public" | "private";

export type Topic = {
  id: string;
  title: string;
  description: string;
};

export type Post = {
  id: string;
  type: "thread" | "diary";
  title?: string;
  content: string;
  authorId: string;
  createdAt: string;
  visibility: Visibility;
  topicId?: string;
  likes: number;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
  likes: number;
};

export type Report = {
  id: string;
  targetId: string; // postId or commentId
  targetType: "post" | "comment";
  reason: string;
  createdAt: string;
  reporterId: string;
};