import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

export default function ProfileEditScreen({ onBack, onSaved }: Props) {
  const storage = useStorage();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const profile = await storage.loadProfile();
      if (profile) {
        setNickname(profile.nickname);
        setBio(profile.bio);
        setAvatarUrl(profile.avatarUrl || "");
      }
      setLoading(false);
    };
    load();
  }, [storage]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert("ニックネームを入力してください。");
      return;
    }
    await storage.saveProfile({
      nickname: nickname.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });
    onSaved();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex items-center justify-center text-brandMuted">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            キャンセル
          </button>
          <div className="text-md font-semibold">プロフィール編集</div>
          <div className="w-14" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold">ニックネーム</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="表示名を入力"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">アバター画像URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="画像のURL（https://...）をここに貼り付けてください"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm min-h-[100px]"
              placeholder="ひとこと（任意）"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm mt-4"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}