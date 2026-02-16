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
  // `profiles`テーブルからJOINで取得するユーザー情報
  profiles?: Pick<UserProfile, 'nickname' | 'avatarUrl'>;
};