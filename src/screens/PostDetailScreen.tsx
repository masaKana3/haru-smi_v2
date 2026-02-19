import React, { useCallback, useEffect, useRef, useState } from "react";
import CommentCard from "../components/CommentCard";
import { CommunityPost, Comment } from "../types/community";
import { useStorage } from "../hooks/useStorage";
import { toRelativeTime } from "../utils/dateUtils";

type Props = {
  postId: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  currentUserId: string;
  onOpenProfile: (userId: string) => void;
};

export default function PostDetailScreen({ postId, onBack, onEdit, onDeleted, currentUserId, onOpenProfile }: Props) {
  const storage = useStorage();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [likes, setLikes] = useState({ count: 0, userHasLiked: false });
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    const postData = await storage.getPostById(postId);
    setPost(postData);
    if (postData) {
      const commentsData = await storage.loadCommentsByPostId(postId);
      setComments(commentsData);
      const likesData = await storage.getPostLikes(postId);
      setLikes(likesData);
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
          <div className="text-sm text-brandMuted">投稿の読み込み中か、見つかりませんでした。</div>
        </div>
      </div>
    );
  }

  const handleAddComment = async () => {
    const text = comment.trim();
    if (!text) return;
    const newComment = await storage.saveComment({
      postId,
      text,
      authorId: currentUserId,
    });
    if (newComment) {
        setComments(prev => [...prev, newComment]);
    }
    setComment("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleLikePost = async () => {
    // Optimistic update
    setLikes(prev => ({
        count: prev.userHasLiked ? prev.count - 1 : prev.count + 1,
        userHasLiked: !prev.userHasLiked,
    }));
    await storage.togglePostLike(post.id);
  };

  const handleLikeComment = async (id: string) => {
    // Optimistic update
    setComments(prevComments => 
      prevComments.map(c => {
        if (c.id === id) {
          return {
            ...c,
            likes_count: c.userHasLiked ? (c.likes_count || 1) - 1 : (c.likes_count || 0) + 1,
            userHasLiked: !c.userHasLiked,
          };
        }
        return c;
      })
    );
    await storage.toggleCommentLike(id);
  };

  const handleDeletePost = async () => {
    if (window.confirm("この投稿を削除しますか？")) {
      const success = await storage.deletePost(postId);
      if (success) {
        onDeleted();
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("コメントを削除しますか？")) {
      await storage.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
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

  const isAuthor = post.user_id === currentUserId;

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
              {post.is_public ? "公開" : "非公開"}
            </span>
          </div>
          <div className="text-base font-semibold text-brandText">
            {post.title || "タイトルなし"}
          </div>
          <div className="text-sm text-brandText leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
          <div className="flex items-center justify-between text-xs text-brandMuted">
            <span>{toRelativeTime(post.created_at)}</span>
            <button
              onClick={handleLikePost}
              className={`text-xs hover:opacity-80 transition-opacity ${likes.userHasLiked ? 'text-brandAccent font-bold' : 'text-brandMuted'}`}
            >
              ❤️ {likes.count}
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
                onDelete={cmt.user_id === currentUserId ? () => handleDeleteComment(cmt.id) : undefined}
                onReport={cmt.user_id !== currentUserId ? () => handleReportComment(cmt.id) : undefined}
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
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
