import React, { useEffect, useState, useCallback } from "react";
import PostCard from "../components/PostCard";
import { CommunityPost, CommunityTopic } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Props = {
  topicId: string;
  onBack: () => void;
  onCreatePost: (topicId: string) => void;
  onOpenPostDetail: (postId: string) => void;
  onOpenProfile: (userId: string) => void; // onOpenProfileをpropsに追加
  currentUserId: string;
};

export default function ThreadScreen({
  topicId,
  onBack,
  onCreatePost,
  onOpenPostDetail,
  onOpenProfile, // propsから受け取る
  currentUserId,
}: Props) {
  const storage = useStorage();
  const [topic, setTopic] = useState<CommunityTopic | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Fetch admin status, topic details and posts
    const [isAdminStatus, allTopics, postData] = await Promise.all([
      storage.isAdmin(),
      storage.listCommunityTopics(),
      storage.listCommunityPosts(topicId),
    ]);
    
    setIsUserAdmin(isAdminStatus);
    const currentTopic = allTopics.find(t => t.id === topicId);
    setTopic(currentTopic || null);
    setPosts(postData);
    setLoading(false);
  }, [storage, topicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLike = async (postId: string) => {
    console.log("Like functionality is not yet implemented for postId:", postId);
  };

  const handleDeletePost = async (postId: string) => {
    const success = await storage.deletePost(postId);
    if (success) {
      loadData();
    }
  };

  if (loading) {
    return (
       <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm pt-20 text-center">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white/60 border border-white/20 rounded-card p-6 shadow-sm space-y-4">
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
    <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
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

        <div className="bg-white/60 border border-white/20 rounded-card p-4 shadow-sm space-y-2">
          <div className="text-sm font-semibold">テーマ</div>
          <div className="text-xs text-brandMuted leading-relaxed">{topic.title}</div>
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
              onOpenProfile={onOpenProfile}
              onDelete={handleDeletePost}
              currentUserId={currentUserId}
              isAdmin={isUserAdmin}
            />
          ))}
          {posts.length === 0 && (
            <div className="text-xs text-brandMuted p-4 text-center">まだ投稿がありません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
