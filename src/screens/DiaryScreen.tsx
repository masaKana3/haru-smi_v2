import React, { useEffect, useMemo, useState } from "react";
import PostCard from "../components/PostCard";
import { CommunityPost } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type Visibility = "public" | "private";
type VisibilityFilter = "all" | Visibility;

type Props = {
  onBack: () => void;
  onOpenPostDetail: (postId: string) => void;
  onCreateDiary: () => void;
  currentUserId: string;
  onOpenProfile: (userId: string) => void;
};

export default function DiaryScreen({
  onBack,
  onOpenPostDetail,
  onCreateDiary,
  currentUserId,
  onOpenProfile,
}: Props) {
  const storage = useStorage();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const loadPosts = async () => {
    const data = await storage.loadDiaryPosts(currentUserId);
    setPosts(data);
    storage.isAdmin().then(setIsUserAdmin);
  };

  useEffect(() => {
    loadPosts();
  }, [currentUserId]);

  const handleLike = async (postId: string) => {
    console.log(`Like functionality not implemented for post ${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    const success = await storage.deletePost(postId);
    if (success) {
      loadPosts();
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (visibilityFilter === "all") return true;
        if (visibilityFilter === "public") return post.is_public !== false; // true or undefined
        if (visibilityFilter === "private") return post.is_public === false && post.user_id === currentUserId;
        return false;
      })
      .filter((post) => {
        if (!searchTerm.trim()) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          post.title?.toLowerCase().includes(lowercasedTerm) ||
          post.content.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [posts, searchTerm, visibilityFilter, currentUserId]);

  const filterOptions: { label: string; value: VisibilityFilter }[] = [
    { label: "すべて", value: "all" },
    { label: "公開のみ", value: "public" },
    { label: "自分の非公開", value: "private" },
  ];

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
          <div className="text-md font-semibold">日記</div>
          <div className="w-10" />
        </div>

        <div className="bg-white/60 border border-white/20 rounded-card p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold">日記の検索・絞り込み</div>
          <div className="pt-1 space-y-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="キーワードで検索..."
            />
            <div className="flex gap-2">
              {filterOptions.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setVisibilityFilter(value)}
                  className={`flex-1 py-2 rounded-button border text-xs ${
                    visibilityFilter === value
                      ? "bg-brandAccent text-white"
                      : "bg-brandInput text-brandText"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-semibold">
              検索結果 ({filteredPosts.length}件)
            </div>
            <button className="text-xs text-brandAccent underline" onClick={onCreateDiary}>
              新しく書く
            </button>
          </div>
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => onOpenPostDetail(post.id)}
              onLike={() => handleLike(post.id)}
              onOpenProfile={onOpenProfile}
              onDelete={handleDeletePost}
              currentUserId={currentUserId}
              isAdmin={isUserAdmin}
            />
          ))}
          {filteredPosts.length === 0 && (
            <div className="text-xs text-brandMuted text-center py-8">
              {posts.length > 0 ? "条件に合う日記がありません。" : "まだ日記がありません。"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
