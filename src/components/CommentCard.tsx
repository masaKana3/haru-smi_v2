import React from "react";
import { Comment } from "../types/community";
import { toRelativeTime } from "../utils/dateUtils";

type Props = {
  comment: Comment;
  onLike?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  liked?: boolean;
};

export default function CommentCard({ comment, onLike, onDelete, onReport, liked }: Props) {
  return (
    <div className="w-full bg-brandBg rounded-card px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-brandText">ユーザー</div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button onClick={onDelete} className="text-xs text-red-500 underline">
              削除
            </button>
          )}
          {onReport && (
            <button onClick={onReport} className="text-xs text-brandMuted underline">
              通報
            </button>
          )}
        </div>
      </div>
      <div className="text-sm text-brandText whitespace-pre-line leading-relaxed">
        {comment.text}
      </div>
      <div className="flex items-center justify-between text-xs text-brandMuted">
        <span>{toRelativeTime(comment.createdAt)}</span>
        <button
          onClick={onLike}
          className="text-xs text-brandAccent hover:opacity-80 transition-opacity"
        >
          👍 {comment.likes} {liked ? "★" : ""}
        </button>
      </div>
    </div>
  );
}
