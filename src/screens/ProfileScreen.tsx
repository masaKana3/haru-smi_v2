import React, { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { Post } from "../types/community";
import { useStorage } from "../hooks/useStorage";
import { UserProfile } from "../types/user";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

type Props = {
  onBack: () => void;
  onOpenPostDetail: (postId: string) => void;
  currentUserId: string;
  viewingUserId: string;
  onEditProfile: () => void;
};

export default function ProfileScreen({
  onBack,
  onOpenPostDetail,
  currentUserId,
  viewingUserId,
  onEditProfile,
}: Props) {
  const storage = useStorage();
  const { user } = useSupabaseAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");

  const isMe = currentUserId === viewingUserId;

  const load = async () => {
    // 投稿を取得（自分なら非公開も含む、他人なら公開のみ）
    const myPostsData = await storage.listPosts({
      authorId: viewingUserId,
      isPublic: !isMe,
    });
    setMyPosts(myPostsData);

    const likedPostsData = await storage.listLikedPosts(viewingUserId);
    setLikedPosts(likedPostsData);

    // 獲得したいいね総数を計算
    const likes = myPosts.reduce((sum, post) => sum + post.likes, 0);
    setTotalLikes(likes);

    const userProfile = await storage.getUserProfile(viewingUserId);
    setProfile(userProfile);
  };

  useEffect(() => {
    load();
  }, [viewingUserId, isMe]);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId, currentUserId);
    load();
  };

  const displayPosts = activeTab === "posts" ? myPosts : likedPosts;

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            {isMe ? "設定へ" : "戻る"}
          </button>
          <div className="text-md font-semibold">プロフィール</div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-card p-6 shadow-sm text-center space-y-2">
          <div className="w-20 h-20 bg-brandAccentAlt/30 rounded-full mx-auto flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="font-semibold text-lg">
            {profile?.nickname ||
              (isMe && user?.user_metadata?.full_name) ||
              (isMe && user?.email?.split("@")[0]) ||
              "ユーザー"
            }
          </div>
          
          {profile?.bio && (
            <div className="text-sm text-brandText mt-2 whitespace-pre-wrap">
              {profile.bio}
            </div>
          )}

          {isMe && (
            <button onClick={onEditProfile} className="text-xs text-brandAccent underline mt-2 block mx-auto">
              プロフィールを編集
            </button>
          )}

          <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-brandAccentAlt/30">
            <div className="text-center">
              <div className="text-xl font-bold text-brandAccent">{myPosts.length}</div>
              <div className="text-xs text-brandMuted">投稿</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-brandAccent">{totalLikes}</div>
              <div className="text-xs text-brandMuted">獲得いいね</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex border-b border-brandAccentAlt/30 mb-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
                activeTab === "posts"
                  ? "text-brandAccent border-b-2 border-brandAccent"
                  : "text-brandMuted"
              }`}
            >
              {isMe ? "自分の投稿" : "投稿"}
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
                activeTab === "likes"
                  ? "text-brandAccent border-b-2 border-brandAccent"
                  : "text-brandMuted"
              }`}
            >
              いいねした投稿
            </button>
          </div>

          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => onOpenPostDetail(post.id)}
              onLike={() => handleLike(post.id)}
            />
          ))}
          {displayPosts.length === 0 && (
            <div className="text-xs text-brandMuted text-center py-4">
              {activeTab === "posts" ? "まだ投稿がありません。" : "まだ「いいね」した投稿がありません。"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}