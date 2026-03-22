"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/update`,
    });

    setLoading(false);
    if (error) {
      setError("メール送信に失敗しました。メールアドレスを確認してください。");
    } else {
      setSent(true);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ツナグ</h1>
          <p className="text-slate-500 text-sm mt-1">パスワードをリセット</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-slate-700 font-medium">メールを送信しました</p>
              <p className="text-sm text-slate-500">
                <span className="font-medium">{email}</span> 宛にパスワードリセット用のリンクを送りました。メールをご確認ください。
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors mt-2"
              >
                ログイン画面に戻る
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">パスワードリセット</h2>
              <p className="text-sm text-slate-500 mb-5">
                登録済みのメールアドレスを入力してください。リセット用のリンクをお送りします。
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@company.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "送信中..." : "リセットメールを送る"}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← ログイン画面に戻る
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
