import React, { useEffect, useState } from "react";
import SMIQuestionScreen from "./screens/SMIQuestionScreen";
import DashboardScreen from "./screens/DashboardScreen";
import DailyCheckScreen from "./screens/DailyCheckScreen";
import ResultScreen from "./screens/ResultScreen";
import { calculateClusters, generateDailyQuestions } from "./logic/smiLogic";
import DailyCheckDetail from "./screens/DailyCheckDetail";
import HistoryScreen from "./screens/HistoryScreen";
import PeriodInputScreen from "./screens/PeriodInputScreen";
import InsightScreen from "./screens/InsightScreen";
import CommunityScreen from "./screens/CommunityScreen";
import PostCreateScreen from "./screens/PostCreateScreen";
import ThreadScreen from "./screens/ThreadScreen";
import DiaryScreen from "./screens/DiaryScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { DailyQuestion, DailyRecord } from "./types/daily";
import { PeriodRecord } from "./types/period";
import { SMIConvertedAnswer } from "./types/smi";
import { useStorage } from "./hooks/useStorage";
import { useNavigation } from "./hooks/useNavigation";
import { Screen } from "./types/navigation";
import { useCommunityNavigation } from "./hooks/useCommunityNavigation";

export default function App() {
  // 画面遷移フック
  const nav = useNavigation();
  const communityNav = useCommunityNavigation(nav);

  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [smiAnswers, setSmiAnswers] = useState<SMIConvertedAnswer[] | null>(null);
  const [dailyItems, setDailyItems] = useState<DailyQuestion[]>([]);
  const [todayDaily, setTodayDaily] = useState<DailyRecord | null>(null);
  const currentUserId = "me"; // ★コミュニティ用の仮ユーザーID
  const [historyRecords, setHistoryRecords] = useState<DailyRecord[]>([]);
  const [latestPeriod, setLatestPeriod] = useState<PeriodRecord | null>(null);

  // ストレージ操作フック
  const storage = useStorage();

  // ★ 過去日対応
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );


  // SMI 完了
  const handleFinishSMI = async (total: number, answers: SMIConvertedAnswer[]) => {
    setTotalScore(total);
    setSmiAnswers(answers);
    await storage.saveSMIResult(total, answers);

    nav.navigate("result");
  };

  // ★ カレンダーの日付が選択されたら
  const handleSelectDate = async (dateStr: string) => {
    console.log("選択された日付:", dateStr);

    const today = new Date().toISOString().slice(0, 10);

    setSelectedDate(dateStr);

    const record = await storage.loadDailyRecord(dateStr);

    // ▼ 未来の日付は禁止
    if (dateStr > today) {
      console.log("未来の日付のため記録できません");
      setTodayDaily(null);
      nav.navigate("dashboard");
      return;
    }

    // ▼ 過去 or 今日で “データがある場合” → 詳細画面へ
    if (record) {
      setTodayDaily(record);

      // 今日以外の過去は閲覧のみ → detail へ
      if (dateStr !== today) {
        nav.navigate("detail");
        return;
      }

      // 今日のデータがある → 通常どおり dashboard を更新
      nav.navigate("dashboard");
      return;
    }

    // ▼ 過去でデータがない（閲覧のみ、入力不可）
    if (dateStr < today) {
      console.log("その日は記録がありません");
      setTodayDaily(null);
      nav.navigate("dashboard");
      return;
    }

    // ▼ 今日でデータがまだない → dashboard で記録ボタンを押させる
    if (dateStr === today) {
      setTodayDaily(null);
      nav.navigate("dashboard");
      return;
    }
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
        nav.navigate("dashboard");
      }
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

  return (
    <>
      {nav.screen === "smi" && <SMIQuestionScreen onFinish={handleFinishSMI} />}

      {nav.screen === "result" && (
        <ResultScreen total={totalScore} onGoDashboard={() => nav.navigate("dashboard")} />
      )}

      {nav.screen === "dashboard" && (
        <DashboardScreen
          total={totalScore}
          onDailyCheck={handleStartDailyCheck}
          todayDaily={todayDaily}
          onDetail={() => nav.navigateWithHistory("detail")}
          onSelectDate={handleSelectDate}
          selectedDate={selectedDate}
          onShowHistory={() => nav.navigate("history")}
          onStartSMI={() => nav.navigate("smi")}   // ★追加
          onStartPeriodInput={() => nav.navigate("periodInput")} // ← 追加
          onOpenInsight={() => nav.navigate("insight")}
          onOpenCommunity={() => nav.navigate("community")}
          latestPeriod={latestPeriod}  // ← 追加
        />
      )}

      {nav.screen === "daily" && (
        <DailyCheckScreen
          dailyItems={dailyItems}
          onSave={handleSaveDaily}
          onCancel={() => nav.navigate("dashboard")}
        />
      )}

      {nav.screen === "detail" && (
        <DailyCheckDetail
          data={todayDaily}
          selectedDate={selectedDate}
          isToday={selectedDate === new Date().toISOString().slice(0, 10)}
          readOnly={selectedDate !== new Date().toISOString().slice(0, 10)}
          // ▼ ここを修正
          onBack={() => nav.goBack("dashboard")}
          onUpdate={(updated) => setTodayDaily(updated)}
        />
      )}

      {nav.screen === "history" && (
        <HistoryScreen
          records={historyRecords}   // ← ★これが抜けていた！！
          onBack={() => nav.navigate("dashboard")}
          onSelectDate={(date) => {
            handleSelectDate(date); // 過去日の読み込み
            nav.setPrevScreen("history");  // ★ 追加：戻り先を記録
            nav.navigate("detail");    // 詳細画面へ遷移
          }}
        />
      )}

      {nav.screen === "periodInput" && (
        <PeriodInputScreen
          onBack={() => nav.navigate("dashboard")}
          onSaved={() => nav.navigate("dashboard")}
        />
      )}

      {nav.screen === "community" && (
        <CommunityScreen
          onBack={() => nav.navigate("dashboard")}
          onCreatePost={communityNav.handleCreatePost}
          onOpenThread={communityNav.handleOpenThread}
          onOpenDiary={() => nav.navigate("diary")}
          onOpenProfile={() => nav.navigate("profile")}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
        />
      )}

      {nav.screen === "postCreate" && (
        <PostCreateScreen
          onBack={() => nav.navigate("community")}
          onSaved={(postId) => {
            nav.setActivePostId(postId);
            nav.navigate("postDetail");
          }}
          defaultTopicId={nav.activeTopicId}
          defaultType={nav.activeTopicId ? "thread" : "diary"}
          currentUserId={currentUserId}
          editingPostId={nav.activePostId} // ★ 編集モード用
        />
      )}

      {nav.screen === "thread" && nav.activeTopicId && (
        <ThreadScreen
          topicId={nav.activeTopicId}
          onBack={() => nav.navigate("community")}
          onCreatePost={(topicId) => communityNav.handleCreatePost({ topicId, type: "thread" })}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
        />
      )}

      {nav.screen === "diary" && (
        <DiaryScreen
          onBack={() => nav.navigate("community")}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
          onCreateDiary={() => communityNav.handleCreatePost({ type: "diary" })}
          currentUserId={currentUserId}
        />
      )}

      {nav.screen === "postDetail" && nav.activePostId && (
        <PostDetailScreen
          postId={nav.activePostId}
          onBack={() => nav.navigate("community")}
          currentUserId={currentUserId}
          onEdit={() => communityNav.handleEditPost(nav.activePostId!)}
          onDeleted={() => communityNav.handlePostDeleted()}
        />
      )}

      {nav.screen === "profile" && (
        <ProfileScreen
          onBack={() => nav.navigate("community")}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
          currentUserId={currentUserId}
        />
      )}

      {nav.screen === "insight" && (
        <InsightScreen
          todayDaily={todayDaily}
          onBack={() => nav.navigate("dashboard")}
        />
      )}

      
    </>
  );
}
