import React from "react";
import SMIQuestionScreen from "../screens/SMIQuestionScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DailyCheckScreen from "../screens/DailyCheckScreen";
import ResultScreen from "../screens/ResultScreen";
import DailyCheckDetail from "../screens/DailyCheckDetail";
import HistoryScreen from "../screens/HistoryScreen";
import PeriodInputScreen from "../screens/PeriodInputScreen";
import InsightScreen from "../screens/InsightScreen";
import CommunityScreen from "../screens/CommunityScreen";
import PostCreateScreen from "../screens/PostCreateScreen";
import ThreadScreen from "../screens/ThreadScreen";
import DiaryScreen from "../screens/DiaryScreen";
import PostDetailScreen from "../screens/PostDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import { DailyQuestion, DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { SMIConvertedAnswer } from "../types/smi";
import { useNavigation } from "../hooks/useNavigation";
import { useCommunityNavigation } from "../hooks/useCommunityNavigation";

type Props = {
  nav: ReturnType<typeof useNavigation>;
  totalScore: number | null;
  todayDaily: DailyRecord | null;
  dailyItems: DailyQuestion[];
  historyRecords: DailyRecord[];
  latestPeriod: PeriodRecord | null;
  selectedDate: string;
  currentUserId: string;
  onFinishSMI: (total: number, answers: SMIConvertedAnswer[]) => void;
  onStartDailyCheck: () => void;
  onSaveDaily: (data: DailyRecord) => void;
  onSelectDate: (dateStr: string) => void;
  onUpdateTodayDaily: (updated: DailyRecord) => void;
  onLogout: () => void;
};

export default function AppNavigator({
  nav,
  totalScore,
  todayDaily,
  dailyItems,
  historyRecords,
  latestPeriod,
  selectedDate,
  currentUserId,
  onFinishSMI,
  onStartDailyCheck,
  onSaveDaily,
  onSelectDate,
  onUpdateTodayDaily,
  onLogout,
}: Props) {
  const communityNav = useCommunityNavigation(nav);

  return (
    <>
      {nav.screen === "smi" && <SMIQuestionScreen onFinish={onFinishSMI} />}

      {nav.screen === "result" && (
        <ResultScreen total={totalScore} onGoDashboard={() => nav.navigate("dashboard")} />
      )}

      {nav.screen === "dashboard" && (
        <DashboardScreen
          total={totalScore}
          onDailyCheck={onStartDailyCheck}
          todayDaily={todayDaily}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
          onShowHistory={() => nav.navigate("history")}
          onStartSMI={() => nav.navigate("smi")}
          onStartPeriodInput={() => nav.navigate("periodInput")}
          onOpenInsight={() => nav.navigate("insight")}
          onOpenCommunity={() => nav.navigate("community")}
          onOpenSettings={() => nav.navigate("settings")}
          latestPeriod={latestPeriod}
        />
      )}

      {nav.screen === "daily" && (
        <DailyCheckScreen
          dailyItems={dailyItems}
          onSave={onSaveDaily}
          onCancel={() => nav.navigate("dashboard")}
        />
      )}

      {nav.screen === "detail" && (
        <DailyCheckDetail
          data={todayDaily}
          selectedDate={selectedDate}
          isToday={selectedDate === new Date().toISOString().slice(0, 10)}
          readOnly={selectedDate !== new Date().toISOString().slice(0, 10)}
          onBack={() => nav.goBack("dashboard")}
          onUpdate={onUpdateTodayDaily}
        />
      )}

      {nav.screen === "history" && (
        <HistoryScreen
          records={historyRecords}
          onBack={() => nav.navigate("dashboard")}
          onSelectDate={(date) => {
            nav.setPrevScreen("history");
            onSelectDate(date);
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
          onOpenPostDetail={communityNav.handleOpenPostDetail}
          currentUserId={currentUserId}
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
          editingPostId={nav.activePostId}
        />
      )}

      {nav.screen === "thread" && nav.activeTopicId && (
        <ThreadScreen
          topicId={nav.activeTopicId}
          onBack={() => nav.navigate("community")}
          onCreatePost={(topicId) => communityNav.handleCreatePost({ topicId, type: "thread" })}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
          currentUserId={currentUserId}
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
          onBack={() => nav.navigate("settings")}
          onOpenPostDetail={communityNav.handleOpenPostDetail}
          currentUserId={currentUserId}
          viewingUserId={nav.viewingUserId || currentUserId}
          onEditProfile={() => nav.navigate("profileEdit")}
        />
      )}

      {nav.screen === "insight" && (
        <InsightScreen
          todayDaily={todayDaily}
          onBack={() => nav.navigate("dashboard")}
        />
      )}

      {nav.screen === "settings" && (
        <SettingsScreen
          onBack={() => nav.navigate("dashboard")}
          onLogout={onLogout}
          onOpenProfile={() => nav.navigate("profile")}
        />
      )}

      {nav.screen === "profileEdit" && (
        <ProfileEditScreen
          onBack={() => nav.goBack("profile")}
          onSaved={() => nav.goBack("profile")}
        />
      )}
    </>
  );
}