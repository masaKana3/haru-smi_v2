export interface UserProfile {
  nickname: string;
  bio: string;
  avatarUrl?: string;
}

export interface UserAuth {
  id: string;
  email: string;
  passwordHash: string;
}