import { useCallback, useMemo } from "react";
import { useNavigation } from "./useNavigation";

// useNavigationの返り値の型を推論
type Navigation = ReturnType<typeof useNavigation>;

export function useCommunityNavigation(nav: Navigation) {
  // ★コミュニティ：投稿作成画面へ
  const handleCreatePost = useCallback((opts?: { topicId?: string; type?: "thread" | "diary" }) => {
    nav.setActivePostId(null); // 新規作成時はIDをクリア
    nav.setActiveTopicId(opts?.topicId ?? null);
    nav.navigate("postCreate");
  }, [nav]);

  // ★コミュニティ：特定スレッドへ
  const handleOpenThread = useCallback((topicId: string) => {
    nav.setActiveTopicId(topicId);
    nav.navigate("thread");
  }, [nav]);

  // ★コミュニティ：投稿詳細へ
  const handleOpenPostDetail = useCallback((postId: string) => {
    nav.setActivePostId(postId);
    nav.navigate("postDetail");
  }, [nav]);

  // ★コミュニティ：投稿編集へ
  const handleEditPost = useCallback((postId: string) => {
    nav.setActivePostId(postId);
    nav.navigate("postCreate"); // 作成画面を編集モードとして利用
  }, [nav]);

  // ★コミュニティ：投稿削除後の遷移
  const handlePostDeleted = useCallback(() => {
    // グローバルイベントを発火して、コミュニティ画面に更新を通知
    window.dispatchEvent(new CustomEvent('haru:post-deleted'));
    nav.setActivePostId(null);
    nav.goBack("community");
  }, [nav]);

  // ★コミュニティ：他のユーザーのプロフィール画面へ
  const handleOpenUserProfile = useCallback((userId: string) => {
    nav.setViewingUserId(userId);
    nav.navigate("profile");
  }, [nav]);

  return useMemo(() => ({
    handleCreatePost,
    handleOpenThread,
    handleOpenPostDetail,
    handleEditPost,
    handlePostDeleted,
    handleOpenUserProfile,
  }), [
    handleCreatePost,
    handleOpenThread,
    handleOpenPostDetail,
    handleEditPost,
    handlePostDeleted,
    handleOpenUserProfile,
  ]);
}