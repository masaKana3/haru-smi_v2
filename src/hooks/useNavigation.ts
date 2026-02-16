import { useState, useCallback, useMemo } from "react";
import { Screen } from "../types/navigation";

export function useNavigation() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  // コミュニティ機能用の状態
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // 通常の遷移
  const navigate = useCallback((nextScreen: Screen) => {
    setScreen(nextScreen);
  }, []);

  // 履歴を残して遷移（「戻る」で元の画面に戻れるようにする）
  const navigateWithHistory = useCallback((nextScreen: Screen) => {
    setPrevScreen(screen);
    setScreen(nextScreen);
  }, [screen]);

  // 戻る（履歴があればそこへ、なければデフォルトへ）
  const goBack = useCallback((defaultScreen: Screen = "dashboard") => {
    setScreen(prevScreen || defaultScreen);
  }, [prevScreen]);

  return useMemo(() => ({
    screen,
    setScreen,
    prevScreen,
    setPrevScreen,
    activeTopicId,
    setActiveTopicId,
    activePostId,
    setActivePostId,
    viewingUserId,
    setViewingUserId,
    navigate,
    navigateWithHistory,
    goBack,
  }), [
    screen,
    prevScreen,
    activeTopicId,
    activePostId,
    viewingUserId,
    navigate,
    navigateWithHistory,
    goBack,
  ]);
}