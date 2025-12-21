import React, { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { Post } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onBack: () => void;
  onOpenPostDetail: (postId: string) => void;
  currentUserId: string;
};

export default function ProfileScreen({ onBack, onOpenPostDetail, currentUserId }: Props) {
  const storage = useStorage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);

  const load = async () => {
    // 自分の投稿を全て取得（公開・非公開問わず）
    const myPosts = await storage.listPosts({ authorId: currentUserId });
    setPosts(myPosts);

    // 獲得したいいね総数を計算
    const likes = myPosts.reduce((sum, post) => sum + post.likes, 0);
    setTotalLikes(likes);
  };

  useEffect(() => {
    load();
  }, [currentUserId]);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId);
    load();
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-md font-semibold">プロフィール</div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-card p-6 shadow-sm text-center space-y-2">
          <div className="w-20 h-20 bg-brandAccentAlt/30 rounded-full mx-auto flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="font-semibold text-lg">ユーザー</div>
          <div className="text-sm text-brandMuted">ID: {currentUserId}</div>
          
          <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-brandAccentAlt/30">
            <div className="text-center">
              <div className="text-xl font-bold text-brandAccent">{posts.length}</div>
              <div className="text-xs text-brandMuted">投稿</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-brandAccent">{totalLikes}</div>
              <div className="text-xs text-brandMuted">獲得いいね</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold ml-1">投稿履歴</div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => onOpenPostDetail(post.id)}
              onLike={() => handleLike(post.id)}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-xs text-brandMuted text-center py-4">まだ投稿がありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}