import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";
import { ICONS } from "../lib/constants";

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

export default function ProfileEditScreen({ onBack, onSaved }: Props) {
  const storage = useStorage();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [iconId, setIconId] = useState("azarashi"); // Default icon
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const profile = await storage.loadProfile();
      if (profile) {
        setNickname(profile.nickname);
        setBio(profile.bio);
        // If avatarUrl is not a URL, it's an icon ID
        if (profile.avatarUrl && !profile.avatarUrl.startsWith('http')) {
          setIconId(profile.avatarUrl);
        }
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
      avatarUrl: iconId, // Save the iconId as avatarUrl
    });
    onSaved();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-brandMuted">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white/60 border border-white/20 rounded-card p-6 shadow-sm space-y-4">
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

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">ニックネーム</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="表示名を入力"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">アイコンを選択</label>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {Object.entries(ICONS).map(([id, src]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIconId(id)}
                  className={`w-12 h-12 rounded-full overflow-hidden focus:outline-none transition-all duration-200 ease-in-out ${
                    iconId === id
                      ? "ring-2 ring-brandAccent ring-offset-2 ring-offset-white"
                      : "hover:opacity-80"
                  }`}
                  aria-label={`アイコンを${id}に設定`}
                >
                  <img
                    src={src as string}
                    alt={id}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
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
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm mt-4 hover:bg-brandAccentHover transition-colors"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}