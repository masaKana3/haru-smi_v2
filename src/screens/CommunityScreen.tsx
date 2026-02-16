import React, { useEffect, useMemo, useState } from "react";
import PostCard from "../components/PostCard";
import { getTopics } from "../logic/communityLogic";
import { Post, Topic } from "../types/community";
import { useStorage } from "../hooks/useStorage";
import { UserProfile } from "../types/user";

type Props = {
  onBack: () => void;
  onCreatePost: (opts?: { topicId?: string; type?: "thread" | "diary" | "official" }) => void;
  onOpenThread: (topicId: string) => void;
  onOpenDiary: () => void;
  onOpenPostDetail: (postId: string) => void;
  currentUserId: string;
  onOpenProfile: (userId: string) => void;
};

export default function CommunityScreen({
  onBack,
  onCreatePost,
  onOpenThread,
  onOpenDiary,
  onOpenPostDetail,
  currentUserId,
  onOpenProfile,
}: Props) {
  const storage = useStorage();
  const topics = useMemo(() => getTopics(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authorProfiles, setAuthorProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const admin = await storage.isAdmin();
      setIsUserAdmin(admin);
    };
    checkAdminStatus();
  }, [storage]);

  const loadPosts = async () => {
    const data = await storage.listPosts({ isPublic: true });
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // 投稿一覧が更新されたら、未取得のプロフィール情報を取得してキャッシュする
  useEffect(() => {
    const loadProfiles = async () => {
      const uniqueAuthorIds = Array.from(new Set(posts.map((p) => p.authorId)));
      const newProfiles: { [key: string]: UserProfile } = {};
      let hasNew = false;

      for (const authorId of uniqueAuthorIds) {
        if (!authorProfiles[authorId]) {
          const profile = await storage.getUserProfile(authorId);
          if (profile) {
            newProfiles[authorId] = profile;
            hasNew = true;
          }
        }
      }

      if (hasNew) {
        setAuthorProfiles((prev) => ({ ...prev, ...newProfiles }));
      }
    };

    if (posts.length > 0) {
      loadProfiles();
    }
  }, [posts, storage]); // authorProfilesは依存配列に含めず、posts更新時のみチェック

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
                            className="border border-brandAccentAlt rounded-card p-3 space-y-1 bg-gray-50"
                          >                <div className="text-sm font-semibold">{topic.title}</div>
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
                  {isUserAdmin && (
                    <button
                      className="text-brandAccent underline"
                      onClick={() => onCreatePost({ topicId: topic.id, type: "official" })}
                    >
                      投稿する
                    </button>
                  )}
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
                authorProfile={authorProfiles[post.authorId]}
                onOpenProfile={onOpenProfile}
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
