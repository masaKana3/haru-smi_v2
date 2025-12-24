import React, { useCallback, useEffect, useRef, useState } from "react";
import CommentCard from "../components/CommentCard";
import { Post, Comment } from "../types/community";
import { useStorage } from "../hooks/useStorage";
import { toRelativeTime } from "../utils/dateUtils";

type Props = {
  postId: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  currentUserId: string;
};

export default function PostDetailScreen({ postId, onBack, onEdit, onDeleted, currentUserId }: Props) {
  const storage = useStorage();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    const postData = await storage.getPostById(postId);
    setPost(postData);
    if (postData) {
      const commentsData = await storage.loadCommentsByPostId(postId);
      setComments(commentsData);
    }
  }, [postId, storage]);

  useEffect(() => {
    load();
  }, [load]);

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← コミュニティ
          </button>
          <div className="text-sm text-brandMuted">投稿が見つかりませんでした。</div>
        </div>
      </div>
    );
  }

  const handleAddComment = async () => {
    const text = comment.trim();
    if (!text) return;
    await storage.saveComment({
      postId,
      text,
      authorId: currentUserId,
    });
    setComment("");
    load();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleLikePost = async () => {
    await storage.likePost(post.id, currentUserId);
    load();
  };

  const handleLikeComment = async (id: string) => {
    await storage.likeComment(id);
    setLikedComments((prev) => ({ ...prev, [id]: true }));
    load();
  };

  const handleDeletePost = async () => {
    if (window.confirm("この投稿を削除しますか？")) {
      await storage.deletePost(postId);
      onDeleted();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("コメントを削除しますか？")) {
      await storage.deleteComment(commentId);
      load();
    }
  };

  const handleReportPost = async () => {
    if (window.confirm("この投稿を通報しますか？\n※不適切な内容として運営に報告されます。")) {
      await storage.saveReport({
        targetId: postId,
        targetType: "post",
        reason: "inappropriate",
        reporterId: currentUserId,
      });
      alert("通報を受け付けました。ご協力ありがとうございます。");
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (window.confirm("このコメントを通報しますか？")) {
      await storage.saveReport({
        targetId: commentId,
        targetType: "comment",
        reason: "inappropriate",
        reporterId: currentUserId,
      });
      alert("通報を受け付けました。");
    }
  };

  const isAuthor = post.authorId === currentUserId;

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
          <div className="text-md font-semibold">
            {post.title || (post.type === "diary" ? "日記" : "投稿")}
          </div>
          {isAuthor ? (
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="text-xs text-brandAccent underline">
                編集
              </button>
              <button onClick={handleDeletePost} className="text-xs text-red-500 underline">
                削除
              </button>
            </div>
          ) : (
            <button onClick={handleReportPost} className="text-xs text-brandMuted underline">
              通報
            </button>
          )}
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-brandMuted">
            <span>{post.type === "diary" ? "日記" : "テーマ投稿"}</span>
            <span className="px-2 py-[2px] bg-brandAccentAlt/20 rounded-full text-[11px]">
              {post.visibility === "public" ? "公開" : "非公開"}
            </span>
          </div>
          <div className="text-base font-semibold text-brandText">
            {post.title || "タイトルなし"}
          </div>
          <div className="text-sm text-brandText leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
          <div className="flex items-center justify-between text-xs text-brandMuted">
            <span>{toRelativeTime(post.createdAt)}</span>
            <button
              onClick={handleLikePost}
              className="text-xs text-brandAccent hover:opacity-80 transition-opacity"
            >
              👍 {post.likes}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-card p-4 shadow-sm space-y-3">
          <div className="text-sm font-semibold">コメント</div>

          <div className="flex items-start gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border border-brandAccentAlt rounded-card px-3 py-2 text-sm min-h-[80px]"
              placeholder="コメントを入力"
              ref={inputRef}
            />
            <button
              onClick={handleAddComment}
              className="text-xs px-3 py-2 bg-brandAccent text-white rounded-button"
            >
              送信
            </button>
          </div>

          <div className="space-y-2">
            {comments.map((cmt) => (
              <CommentCard
                key={cmt.id}
                comment={cmt}
                onLike={() => handleLikeComment(cmt.id)}
                onDelete={cmt.authorId === currentUserId ? () => handleDeleteComment(cmt.id) : undefined}
                onReport={cmt.authorId !== currentUserId ? () => handleReportComment(cmt.id) : undefined}
                liked={likedComments[cmt.id]}
              />
            ))}
            {comments.length === 0 && (
              <div className="text-xs text-brandMuted">まだコメントがありません。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
