import React, { useEffect, useMemo, useState } from "react";
import PostCard from "../components/PostCard";
import { getTopics } from "../logic/communityLogic";
import { Post, Topic } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onBack: () => void;
  onCreatePost: (opts?: { topicId?: string; type?: "thread" | "diary" }) => void;
  onOpenThread: (topicId: string) => void;
  onOpenDiary: () => void;
  onOpenPostDetail: (postId: string) => void;
  currentUserId: string;
};

export default function CommunityScreen({
  onBack,
  onCreatePost,
  onOpenThread,
  onOpenDiary,
  onOpenPostDetail,
  currentUserId,
}: Props) {
  const storage = useStorage();
  const topics = useMemo(() => getTopics(), []);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const data = await storage.listPosts({ isPublic: true });
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId, currentUserId);
    loadPosts();
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandMuted hover:opacity-80 transition-opacity"
          >
            戻る
          </button>
          <div className="text-md font-semibold">コミュニティ</div>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">日記を書く</div>
            <button
              className="text-xs text-brandAccent underline"
              onClick={() => onCreatePost({ type: "diary" })}
            >
              作成
            </button>
          </div>
          <p className="text-xs text-brandMuted leading-relaxed">
            今日感じたことを日記に書いて残しましょう。非公開にすると自分だけの記録になります。
          </p>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold">運営テーマ</div>
          <div className="space-y-2">
            {topics.map((topic: Topic) => (
              <div
                key={topic.id}
                className="border border-brandAccentAlt rounded-card p-3 space-y-1 bg-brandBg"
              >
                <div className="text-sm font-semibold">{topic.title}</div>
                <div className="text-xs text-brandMuted leading-relaxed">
                  {topic.description}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    className="text-brandAccent underline"
                    onClick={() => onOpenThread(topic.id)}
                  >
                    スレッドを見る
                  </button>
                  <button
                    className="text-brandAccent underline"
                    onClick={() => onCreatePost({ topicId: topic.id, type: "thread" })}
                  >
                    投稿する
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">公開タイムライン</div>
            <button
              className="text-xs text-brandAccent underline"
              onClick={onOpenDiary}
            >
              日記一覧へ
            </button>
          </div>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                topic={topics.find((t) => t.id === post.topicId)}
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
    </div>
  );
}
