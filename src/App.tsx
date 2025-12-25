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
import AuthNavigator from "./navigators/AuthNavigator";
import AppNavigator from "./navigators/AppNavigator";

export default function App() {
  // 画面遷移フック
  const nav = useNavigation();

  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [smiAnswers, setSmiAnswers] = useState<SMIConvertedAnswer[] | null>(null);
  const [dailyItems, setDailyItems] = useState<DailyQuestion[]>([]);
  const [todayDaily, setTodayDaily] = useState<DailyRecord | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("haru_current_user_id");
    }
    return null;
  });
  const [historyRecords, setHistoryRecords] = useState<DailyRecord[]>([]);
  const [latestPeriod, setLatestPeriod] = useState<PeriodRecord | null>(null);

  // ストレージ操作フック
  const storage = useStorage();

  // ★ 過去日対応
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const handleLoginSuccess = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem("haru_current_user_id", userId);
    nav.navigate("dashboard");
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem("haru_current_user_id");
    // ログイン画面への遷移は下部の if (!currentUserId) ブロックで自動的に処理されます
  };

  // SMI 完了
  const handleFinishSMI = async (total: number, answers: SMIConvertedAnswer[]) => {
    try {
      setTotalScore(total);
      setSmiAnswers(answers);
      await storage.saveSMIResult(total, answers);
      await storage.saveSMIHistory(total, answers);
    } catch (error) {
      console.error("SMI save error:", error);
    } finally {
      nav.navigate("result");
    }
  };

  // ★ カレンダーの日付が選択されたら
  const handleSelectDate = async (dateStr: string) => {
    console.log("選択された日付:", dateStr);

    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(dateStr);
    const record = await storage.loadDailyRecord(dateStr);
    setTodayDaily(record);

    // ▼ 未来の日付は禁止
    if (dateStr > today) {
      console.log("未来の日付のため記録できません");
      return;
    }

    // ▼ 今日
    if (dateStr === today) {
      if (record) {
        nav.navigate("detail");
      } else {
        // 今日の記録がない場合はデイリーチェックを開始
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

    // 今日以外は daily を開かせない
    if (selectedDate !== today) {
      alert("今日の記録のみ入力できます。");
      return;
    }

    // 今日の場合のみ入力画面へ
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
    setTodayDaily(data);
    await storage.saveDailyRecord(data);

    setSelectedDate(data.date);
    nav.navigate("dashboard");
  };

  // ★★★ Step B：SMIを復元（←ここに追加）
  useEffect(() => {
    const load = async () => {
      const { done, total, answers } = await storage.loadSMIResult();

      if (done) {
        if (total !== null) setTotalScore(total);
        if (answers) setSmiAnswers(answers);
      }
      // 診断済みかどうかにかかわらず、初期表示はDashboardを優先
      nav.navigate("dashboard");
    };
    load();
  }, [storage]);

  // 今日の記録の復元
  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const record = await storage.loadDailyRecord(today);

      if (record) {
        setTodayDaily(record);
      }
    };
    load();
  }, [storage]);

  // ▼ 過去の記録を全部取得して並べる
  useEffect(() => {
    const load = async () => {
      const records = await storage.loadAllDailyRecords();
      setHistoryRecords(records);
    };
    load();
  }, [todayDaily, selectedDate, storage]);

  // ▼ 最新の生理記録を取得
  useEffect(() => {
    const load = async () => {
      const period = await storage.getLatestPeriod();
      setLatestPeriod(period);
    };
    load();
  }, [storage, nav.screen]);

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
    />
  );
}
