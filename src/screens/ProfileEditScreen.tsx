import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";

const PRESET_AVATARS = [
  { label: "アザラシ", url: "http://flat-icon-design.com/f/f_object_174/s256_f_object_174_0bg.png" },
  { label: "パンダ", url: "http://flat-icon-design.com/f/f_object_100/s256_f_object_100_0bg.png" },
  { label: "ペンギン", url: "http://flat-icon-design.com/f/f_object_108/s256_f_object_108_0bg.png" },
  { label: "たぬき", url: "http://flat-icon-design.com/f/f_object_149/s256_f_object_149_0bg.png" },
  { label: "ねこ", url: "http://flat-icon-design.com/f/f_object_111/s256_f_object_111_0bg.png" },
  { label: "いぬ", url: "http://flat-icon-design.com/f/f_object_112/s256_f_object_112_0bg.png" },
];

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
            <label className="text-sm font-semibold">おすすめアイコン</label>
            <div className="flex items-center gap-3 pt-1">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.label}
                  type="button"
                  onClick={() => setAvatarUrl(avatar.url)}
                  className={`w-12 h-12 rounded-full overflow-hidden focus:outline-none transition-all duration-200 ease-in-out ${
                    avatarUrl === avatar.url
                      ? "ring-2 ring-brandAccent ring-offset-2 ring-offset-white"
                      : "hover:opacity-80"
                  }`}
                  aria-label={`アバターを${avatar.label}に設定`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
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