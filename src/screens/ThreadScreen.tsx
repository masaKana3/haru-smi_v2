import React, { useEffect, useMemo, useState } from "react";
import PostCard from "../components/PostCard";
import { getTopics } from "../logic/communityLogic";
import { Post, Topic } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Props = {
  topicId: string;
  onBack: () => void;
  onCreatePost: (topicId: string) => void;
  onOpenPostDetail: (postId: string) => void;
};

export default function ThreadScreen({
  topicId,
  onBack,
  onCreatePost,
  onOpenPostDetail,
}: Props) {
  const storage = useStorage();
  const topics = useMemo(() => getTopics(), []);
  const topic = topics.find((t) => t.id === topicId);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const data = await storage.listPosts({ topicId });
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, [topicId]);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId);
    loadPosts();
  };

  if (!topic) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-sm text-brandMuted">テーマが見つかりませんでした。</div>
        </div>
      </div>
    );
  }

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
          <div className="text-md font-semibold">{topic.title}</div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-2">
          <div className="text-sm font-semibold">テーマ概要</div>
          <div className="text-xs text-brandMuted leading-relaxed">{topic.description}</div>
          <button
            className="text-xs text-brandAccent underline"
            onClick={() => onCreatePost(topic.id)}
          >
            このテーマに投稿する
          </button>
        </div>

        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              topic={topic}
              onOpen={() => onOpenPostDetail(post.id)}
              onLike={() => handleLike(post.id)}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-xs text-brandMuted">まだ投稿がありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
