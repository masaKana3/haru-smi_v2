import React, { useEffect, useState } from "react";
import { Comment } from "../types/community";
import { toRelativeTime } from "../utils/dateUtils";
import { useStorage } from "../hooks/useStorage";

type Props = {
  comment: Comment;
  onLike?: () => void;
  onOpenProfile?: (userId: string) => void;
  onDelete?: () => void;
  onReport?: () => void;
  liked?: boolean;
};

export default function CommentCard({
  comment,
  onLike,
  onOpenProfile,
  onDelete,
  onReport,
  liked,
}: Props) {
  const storage = useStorage();
  const [authorName, setAuthorName] = useState("ユーザー");

  useEffect(() => {
    let isMounted = true;
    const loadAuthor = async () => {
      const profile = await storage.getUserProfile(comment.authorId);
      if (isMounted && profile?.nickname) {
        setAuthorName(profile.nickname);
      }
    };
    loadAuthor();
    return () => { isMounted = false; };
  }, [storage, comment.authorId]);

  return (
    <div className="w-full bg-brandBg rounded-card px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile?.(comment.authorId);
          }}
          className="text-sm font-semibold text-brandText hover:underline"
        >
          {authorName}
        </button>
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
