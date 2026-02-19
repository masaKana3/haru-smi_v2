import { UserProfile } from "./user";

// community_topics テーブルの型
export type CommunityTopic = {
  id: string;
  created_at: string;
  title: string;
};

// community_posts テーブルの型
export type CommunityPost = {
  id: string;
  created_at: string;
  topic_id: string;
  user_id: string;
  content: string;
  title?: string; // Add title for diary entries
  is_public?: boolean; // Add visibility for diary entries
  type?: 'diary' | 'thread' | 'official'; // Add type for post
  likes_count?: number;
  comments_count?: number;
  // `profiles`テーブルからJOINで取得するユーザー情報
  profiles?: Pick<UserProfile, 'nickname' | 'avatarUrl'>;
  community_topics?: { title: string } | null;
};

// comments テーブルの型
export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  likes_count?: number;
  userHasLiked?: boolean;
  // `profiles`テーブルからJOINで取得するユーザー情報
  profiles?: Pick<UserProfile, 'nickname' | 'avatarUrl'>;
};