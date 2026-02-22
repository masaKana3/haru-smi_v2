import React, { useState } from "react";
import { useStorage } from "../hooks/useStorage";

type Props = {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ResetPasswordScreen({ email, onSuccess, onCancel }: Props) {
  const storage = useStorage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!password.trim()) {
      setError("新しいパスワードを入力してください。");
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
      await storage.resetPassword(email, password);
      alert("パスワードを再設定しました。新しいパスワードでログインしてください。");
      onSuccess();
    } catch (err) {
      setError("エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white/60 border border-white/20 rounded-card p-6 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">新しいパスワードの設定</h2>
          <p className="text-xs text-brandMuted">
            {email} の新しいパスワードを設定します。
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">新しいパスワード</label>
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
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm disabled:opacity-50 hover:bg-brandAccentHover transition-colors"
          >
            {loading ? "設定中..." : "パスワードを変更する"}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity underline"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}