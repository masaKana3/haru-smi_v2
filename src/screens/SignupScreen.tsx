import React, { useState } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function SignupScreen({ onSuccess, onCancel }: Props) {
  const { signUp } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password);
      alert("登録確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center justify-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-center">新規登録</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brandAccentAlt rounded px-3 py-2"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brandAccentAlt rounded px-3 py-2"
              placeholder="6文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brandAccent text-white rounded-button font-medium disabled:opacity-50"
          >
            {loading ? "処理中..." : "登録する"}
          </button>
        </form>

        <button
          onClick={onCancel}
          className="mt-4 w-full text-sm text-brandMuted underline"
        >
          ログイン画面に戻る
        </button>
      </div>
    </div>
  );
}