import React, { useEffect, useState } from "react";
import { Post, Topic } from "../types/community";
import { toRelativeTime } from "../utils/dateUtils";
import { useStorage } from "../hooks/useStorage";

type Props = {
  post: Post;
  topic?: Topic;
  onOpen?: () => void;
  onOpenProfile?: (userId: string) => void;
  onLike?: () => void;
};

export default function PostCard({ post, topic, onOpen, onOpenProfile, onLike }: Props) {
  const storage = useStorage();
  const [authorName, setAuthorName] = useState("ユーザー");

  useEffect(() => {
    let isMounted = true;
    const loadAuthor = async () => {
      const profile = await storage.getUserProfile(post.authorId);
      if (isMounted && profile?.nickname) {
        setAuthorName(profile.nickname);
      }
    };
    loadAuthor();
    return () => { isMounted = false; };
  }, [storage, post.authorId]);

  const title = post.title || (post.type === "diary" ? "日記" : topic?.title || "スレッド");
  const visibilityLabel = post.visibility === "public" ? "公開" : "非公開";

  return (
    <div className="w-full bg-white rounded-card p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs text-brandMuted">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile?.(post.authorId);
          }}
          className="hover:underline"
        >
          {post.type === "diary" ? "日記" : "テーマ投稿"} • {authorName}
        </button>
        <span className="px-2 py-[2px] bg-brandAccentAlt/20 rounded-full text-[11px]">
          {visibilityLabel}
        </span>
      </div>
      <div className="text-base font-semibold text-brandText">{title}</div>
      <div className="text-sm text-brandText leading-relaxed whitespace-pre-line line-clamp-3">
        {post.content}
      </div>
      <div className="flex items-center justify-between text-xs text-brandMuted">
        <span>{toRelativeTime(post.createdAt)}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onLike}
            className="text-xs text-brandAccent hover:opacity-80 transition-opacity"
          >
            👍 {post.likes}
          </button>
          {onOpen && (
            <button
              onClick={onOpen}
              className="text-xs text-brandAccent underline hover:opacity-80 transition-opacity"
            >
              開く
            </button>
          )}
        </div>
      </div>
      {topic && (
        <div className="text-[11px] text-brandMuted">テーマ: {topic.title}</div>
      )}
    </div>
  );
}
