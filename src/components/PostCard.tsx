import React from "react";
import { CommunityPost, CommunityTopic } from "../types/community";
import { ICONS, DEFAULT_ICON } from "../lib/constants";

type Props = {
  post: CommunityPost;
  topic?: CommunityTopic;
  onOpen: () => void;
  onLike: () => void;
  onOpenProfile?: (userId: string) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
};

export default function PostCard({
  post,
  topic,
  onOpen,
  onLike,
  onOpenProfile,
  onDelete,
  currentUserId,
  isAdmin,
}: Props) {
  const dateLabel = new Date(post.created_at).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const author = post.profiles;
  const displayName = author?.nickname || "ユーザー";
  const isAuthor = post.user_id === currentUserId;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenProfile && post.user_id) {
      onOpenProfile(post.user_id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm("この投稿を本当に削除しますか？")) {
      onDelete(post.id);
    }
  };
  
  const getAvatarSrc = () => {
    const avatarId = author?.avatarUrl;
    if (avatarId && ICONS[avatarId]) {
      return ICONS[avatarId];
    }
    return DEFAULT_ICON;
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
            <img
              src={getAvatarSrc()}
              alt={displayName}
              className="w-full h-full object-cover"
            />
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
        {(isAuthor || isAdmin) && onDelete && (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-xs p-1">
            🗑️
          </button>
        )}
      </div>

      <div className="text-sm text-brandText whitespace-pre-wrap line-clamp-3">
        {post.content}
      </div>
    </div>
  );
}
