import React from "react";
import { Comment } from "../types/community";
import { toRelativeTime } from "../utils/dateUtils";
import { ICONS, DEFAULT_ICON } from "../lib/constants";

type Props = {
  comment: Comment & { content?: string };
  onLike?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onOpenProfile?: (userId: string) => void;
  currentUserId?: string;
};

export default function CommentCard({
  comment,
  onLike,
  onDelete,
  onReport,
  onOpenProfile,
  currentUserId,
}: Props) {
  const author = comment.profiles;
  const authorName = author?.nickname || "ユーザー";
  const isOwnComment = comment.user_id === currentUserId;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenProfile && comment.user_id && !isOwnComment) {
      onOpenProfile(comment.user_id);
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
    <div className="w-full bg-brandPanel rounded-card px-3 py-3 space-y-2 flex gap-3">
      {/* Avatar */}
      <div
        onClick={handleProfileClick}
        className={`w-9 h-9 rounded-full bg-brandAccentAlt/30 flex items-center justify-center overflow-hidden flex-shrink-0 text-lg ${!isOwnComment ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
      >
        <img
          src={getAvatarSrc()}
          alt={authorName}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <span
            onClick={handleProfileClick}
            className={`text-sm font-semibold text-brandText ${!isOwnComment ? 'cursor-pointer hover:underline' : ''}`}
          >
            {isOwnComment ? "あなた" : authorName}
          </span>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button onClick={onDelete} className="text-xs text-red-500 underline">
                削除
              </button>
            )}
            {onReport && !isOwnComment && (
              <button onClick={onReport} className="text-xs text-brandMuted underline">
                通報
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-brandText whitespace-pre-line leading-relaxed pt-1">
          {comment.content || comment.text}
        </div>
        <div className="flex items-center justify-between text-xs text-brandMuted pt-1">
          <span>{toRelativeTime(comment.created_at)}</span>
          <button
            onClick={onLike}
            className={`text-xs hover:opacity-80 transition-opacity ${comment.userHasLiked ? 'text-brandAccent font-bold' : 'text-brandMuted'}`}
          >
            ❤️ {comment.likes_count || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
