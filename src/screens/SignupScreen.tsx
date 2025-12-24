import React, { useState } from "react";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onSignupSuccess: (userId: string) => void;
  onGoToLogin: () => void;
};

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const storage = useStorage();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError(null);
    if (!email.trim() || !nickname.trim() || !password.trim()) {
      setError("すべての項目を入力してください。");
      return;
    }
    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }
    if (password.length < 4) {
      setError("パスワードは4文字以上で設定してください。");
      return;
    }

    setLoading(true);
    try {
      const userId = await storage.registerUser(email, password);

      // 登録したニックネームをプロフィールとして保存
      await storage.saveProfile({
        nickname: nickname,
        bio: "",
      });

      onSignupSuccess(userId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("登録中にエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">新規登録</h2>
          <p className="text-xs text-brandMuted">
            Haru SMI で日々の体調を記録しましょう
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="アプリ内で表示される名前"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="4文字以上"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">パスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="もう一度入力"
            />
          </div>

          {error && <div className="text-xs text-red-500">{error}</div>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onGoToLogin}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity underline"
          >
            すでにアカウントをお持ちの方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}