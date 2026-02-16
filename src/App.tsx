import React, { useEffect, useState } from "react";
import {
  calculateClusters,
  generateDailyQuestions,
} from "./logic/core/smiLogic";
import { DailyQuestion, DailyRecord } from "./types/daily";
import { PeriodRecord } from "./types/period";
import { SMIConvertedAnswer } from "./types/smi";
import { useStorage } from "./hooks/useStorage";
import { useNavigation } from "./hooks/useNavigation";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import AuthNavigator from "./navigators/AuthNavigator";
import AppNavigator from "./navigators/AppNavigator";

export default function App() {
  // 画面遷移フック
  const nav = useNavigation();
  const { user, loading: authLoading, signOut } = useSupabaseAuth();

  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [smiAnswers, setSmiAnswers] = useState<SMIConvertedAnswer[] | null>(null);
  const [dailyItems, setDailyItems] = useState<DailyQuestion[]>([]);
  const [todayDaily, setTodayDaily] = useState<DailyRecord | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<DailyRecord[]>([]);
  const [latestPeriod, setLatestPeriod] = useState<PeriodRecord | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // ストレージ操作フック
  const storage = useStorage();

  // ★ 過去日対応
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // ユーザー状態の同期とデータのリセット
  useEffect(() => {
    if (!authLoading) {
      const newUserId = user?.id ?? null;
      setCurrentUserId(newUserId);
      // ユーザーがログアウトした場合、すべてのパーソナルデータをクリアする
      if (!newUserId) {
        setTotalScore(null);
        setSmiAnswers(null);
        setDailyItems([]);
        setTodayDaily(null);
        setHistoryRecords([]);
        setLatestPeriod(null);
      }
    }
  }, [user, authLoading]);

  // ユーザーに紐づくすべてのパーソナルデータを読み込むEffect
  useEffect(() => {
    if (!currentUserId) return;

    // ユーザーが切り替わった際に古いデータをクリア
    setHistoryRecords([]);
    setLatestPeriod(null);
    setTodayDaily(null);
    setTotalScore(null);
    setSmiAnswers(null);

    const loadAllPersonalData = async () => {
      // 並列でデータを取得
      const [smiResult, dailyRecords, latestPeriodResult] = await Promise.all([
        storage.loadSMIResult(),
        storage.loadAllDailyRecords(),
        storage.getLatestPeriod(),
      ]);

      // SMI結果の更新
      if (smiResult.done) {
        setTotalScore(smiResult.total);
        setSmiAnswers(smiResult.answers);
      } else {
        setTotalScore(null);
        setSmiAnswers(null);
      }

      // 全デイリー記録の更新
      setHistoryRecords(dailyRecords);

      // 今日の記録を全履歴から探してセット
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayRecord = dailyRecords.find((r) => r.date === todayStr) || null;
      setTodayDaily(todayRecord);

      // 最新の生理記録の更新
      setLatestPeriod(latestPeriodResult);
    };

    loadAllPersonalData();
  }, [currentUserId, storage]); // ユーザー変更時のみ実行

  const handleLoginSuccess = (userId: string) => {
    // Supabase Auth の状態変化で自動的に更新されるため、ナビゲーションのみ
    nav.navigate("dashboard");
  };

  const handleLogout = async () => {
    await signOut();
    // stateのクリアは上記のuseEffectに任せる
  };

  // SMI 完了
  const handleFinishSMI = async (total: number, answers: SMIConvertedAnswer[]) => {
    try {
      setTotalScore(total);
      setSmiAnswers(answers);
      await storage.saveSMIHistory(total, answers);
    } catch (error) {
      console.error("SMI save error:", error);
    } finally {
      nav.navigate("result");
    }
  };

  // ★ カレンダーの日付が選択されたら
  const handleSelectDate = async (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(dateStr);
    
    // 履歴から該当日付の記録を探す（DBアクセスを減らす）
    const record = historyRecords.find(r => r.date === dateStr) || null;
    setTodayDaily(record);

    // ▼ 未来の日付は禁止
    if (dateStr > today) {
      return;
    }

    // ▼ 今日
    if (dateStr === today) {
      if (record) {
        nav.navigate("detail");
      } else {
        handleStartDailyCheck();
      }
      return;
    }

    // ▼ 過去（データ有無に関わらず詳細へ）
    nav.navigate("detail");
  };

  // ★ デイリーチェック開始（今日以外は絶対に入れない）
  const handleStartDailyCheck = () => {
    const today = new Date().toISOString().slice(0, 10);

    if (selectedDate !== today) {
      alert("今日の記録のみ入力できます。");
      return;
    }

    if (!smiAnswers) {
      setDailyItems([]);
    } else {
      const cluster = calculateClusters(smiAnswers);
      const items = generateDailyQuestions(cluster);
      setDailyItems(items);
    }

    nav.navigate("daily");
  };

  // デイリーチェック保存
  const handleSaveDaily = async (data: DailyRecord) => {
    await storage.saveDailyRecord(data);
    setTodayDaily(data); // 今日の記録を更新

    // 保存後に全履歴を再取得してカレンダー表示を更新
    const updatedRecords = await storage.loadAllDailyRecords();
    setHistoryRecords(updatedRecords);

    setSelectedDate(data.date);
    nav.navigate("dashboard");
  };

  // プロフィール画面への遷移
  const handleOpenProfile = (userId: string) => {
    setViewingUserId(userId);
    nav.navigate("profile");
  };

  if (authLoading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  // 未ログイン時の表示
  if (!currentUserId) {
    return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppNavigator
      nav={nav}
      totalScore={totalScore}
      todayDaily={todayDaily}
      dailyItems={dailyItems}
      historyRecords={historyRecords}
      latestPeriod={latestPeriod}
      selectedDate={selectedDate}
      currentUserId={currentUserId}
      onFinishSMI={handleFinishSMI}
      onStartDailyCheck={handleStartDailyCheck}
      onSaveDaily={handleSaveDaily}
      onSelectDate={handleSelectDate}
      onUpdateTodayDaily={(updated: DailyRecord) => setTodayDaily(updated)}
      onLogout={handleLogout}
      viewingUserId={viewingUserId}
      onOpenProfile={handleOpenProfile}
    />
  );
}
