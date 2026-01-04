import React from "react";
import { Post, Topic } from "../types/community";
import { UserProfile } from "../types/user";

type Props = {
  post: Post;
  topic?: Topic;
  onOpen: () => void;
  onLike: () => void;
  authorProfile?: UserProfile;
  onOpenProfile?: (userId: string) => void;
};

export default function PostCard({
  post,
  topic,
  onOpen,
  onLike,
  authorProfile,
  onOpenProfile,
}: Props) {
  const dateLabel = new Date(post.createdAt).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ニックネームのフォールバック: プロフィール名 -> "ユーザー"
  const displayName = authorProfile?.nickname || "ユーザー";

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenProfile) {
      onOpenProfile(post.authorId);
    }
  };

  return (
    <div
      onClick={onOpen}
      className="bg-white border border-brandAccentAlt/30 rounded-card p-4 shadow-sm space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* アバター表示 */}
          <div
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-full bg-brandAccentAlt/30 flex items-center justify-center overflow-hidden flex-shrink-0 text-lg cursor-pointer hover:opacity-80 transition-opacity"
          >
            {authorProfile?.avatarUrl ? (
              <img
                src={authorProfile.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={handleProfileClick}
                className="text-sm font-bold text-brandText cursor-pointer hover:underline"
              >
                {displayName}
              </span>
              {topic && (
                <span className="text-[10px] px-2 py-0.5 bg-brandBg border border-brandAccentAlt rounded-full text-brandMuted">
                  {topic.title}
                </span>
              )}
            </div>
            <div className="text-xs text-brandMuted">{dateLabel}</div>
          </div>
        </div>
      </div>

      <div className="text-sm text-brandText whitespace-pre-wrap line-clamp-3">
        {post.content}
      </div>

      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className="flex items-center gap-1 text-xs text-brandAccent hover:opacity-80 transition-opacity"
        >
          <span>❤️</span>
          <span>{post.likes}</span>
        </button>
      </div>
    </div>
  );
}
