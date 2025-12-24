import React, { useEffect, useMemo, useState } from "react";
import PostCard from "../components/PostCard";
import { Post, Visibility } from "../types/community";
import { useStorage } from "../hooks/useStorage";

type VisibilityFilter = "all" | Visibility;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const loadPosts = async () => {
    const data = await storage.listPosts({
      authorId: currentUserId,
      type: "diary",
    });
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, [currentUserId]);

  const handleLike = async (postId: string) => {
    await storage.likePost(postId, currentUserId);
    loadPosts();
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (visibilityFilter === "all") return true;
        return post.visibility === visibilityFilter;
      })
      .filter((post) => {
        if (!searchTerm.trim()) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          post.title?.toLowerCase().includes(lowercasedTerm) ||
          post.content.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [posts, searchTerm, visibilityFilter]);

  const filterOptions: { label: string; value: VisibilityFilter }[] = [
    { label: "すべて", value: "all" },
    { label: "公開のみ", value: "public" },
    { label: "非公開のみ", value: "private" },
  ];

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

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
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
