export interface UserProfile {
  nickname: string;
  bio: string;
}

export interface UserAuth {
  id: string;
  email: string;
  passwordHash: string;
}