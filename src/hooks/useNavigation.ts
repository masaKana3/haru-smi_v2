import { useState, useCallback } from "react";
import { Screen } from "../types/navigation";

export function useNavigation() {
  const [screen, setScreen] = useState<Screen>("smi");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  // コミュニティ機能用の状態
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

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

  return {
    screen,
    setScreen,
    prevScreen,
    setPrevScreen,
    activeTopicId,
    setActiveTopicId,
    activePostId,
    setActivePostId,
    navigate,
    navigateWithHistory,
    goBack,
  };
}