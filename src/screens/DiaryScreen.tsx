import React, { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { Post } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onBack: () => void;
  onOpenPostDetail: (postId: string) => void;
  onCreateDiary: () => void;
  currentUserId: string;
};

export default function DiaryScreen({
  onBack,
  onOpenPostDetail,
  onCreateDiary,
  currentUserId,
}: Props) {
  const storage = useStorage();
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const data = await storage.listPosts({
      authorId: currentUserId,
      visibility: "private",
      type: "diary",
    });
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, [currentUserId]);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId);
    loadPosts();
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-md font-semibold">マイ日記</div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">非公開の日記</div>
            <button
              className="text-xs text-brandAccent underline"
              onClick={onCreateDiary}
            >
              新しく書く
            </button>
          </div>
          <div className="text-xs text-brandMuted leading-relaxed">
            自分だけの記録として保存されます。
          </div>
        </div>

        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => onOpenPostDetail(post.id)}
              onLike={() => handleLike(post.id)}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-xs text-brandMuted">まだ日記がありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
