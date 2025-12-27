import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  onLoginSuccess: (userId: string) => void;
  onGoToSignup: () => void;
  onForgotPassword: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup, onForgotPassword }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        onLoginSuccess(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || "ログイン中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">ログイン</h2>
          <p className="text-xs text-brandMuted">
            おかえりなさい
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
            <label className="text-sm font-semibold">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brandAccentAlt rounded-card px-3 py-2 text-sm"
              placeholder="パスワード"
            />
          </div>

          {error && <div className="text-xs text-red-500">{error}</div>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <div className="text-center">
            <button
              onClick={onForgotPassword}
              className="text-xs text-brandMuted hover:text-brandAccent transition-colors"
            >
              パスワードをお忘れの方はこちら
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onGoToSignup}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity underline"
          >
            アカウントをお持ちでない方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}