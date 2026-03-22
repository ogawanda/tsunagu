"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で設定してください");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError("パスワードの更新に失敗しました。もう一度お試しください。");
    } else {
      setDone(true);
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
          <p className="text-slate-500 text-sm mt-1">新しいパスワードを設定</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {done ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-slate-700 font-medium">パスワードを更新しました</p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                トップページへ
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-800 mb-5">新しいパスワード</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="6文字以上"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    パスワード（確認）
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="もう一度入力"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "更新中..." : "パスワードを更新する"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
