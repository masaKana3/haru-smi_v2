import React, { useState } from "react";
import { useStorage } from "../hooks/useStorage";

type Props = {
  onBack: () => void;
  onSuccess: (email: string) => void;
};

export default function ForgotPasswordScreen({ onBack, onSuccess }: Props) {
  const storage = useStorage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    setLoading(true);
    try {
      const exists = await storage.checkEmailExists(email);
      if (exists) {
        onSuccess(email);
      } else {
        setError("このメールアドレスは登録されていません。");
      }
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
          <h2 className="text-lg font-semibold">パスワードの再設定</h2>
          <p className="text-xs text-brandMuted">
            登録したメールアドレスを入力してください。
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

          {error && <div className="text-xs text-red-500">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm disabled:opacity-50"
          >
            {loading ? "確認中..." : "次へ"}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity underline"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}