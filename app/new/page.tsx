"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewHandover() {
  const router = useRouter();
  const [category, setCategory] = useState("設備");
  const [priority, setPriority] = useState("中");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      setSaving(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("handovers").insert({
      category,
      content,
      priority,
      date: new Date().toISOString().split("T")[0],
      is_checked: false,
      company_id: profile?.company_id ?? null,
    });

    setSaving(false);
    if (error) {
      alert(`登録に失敗しました。\nエラー: ${error.message}\ncode: ${error.code}`);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4 shadow flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-white text-lg">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">ツナグ</h1>
          <p className="text-sm text-blue-200">新規引き継ぎ登録</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <div className="flex gap-2 flex-wrap">
              {["設備", "安全", "品質", "その他"].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    category === cat
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              重要度
            </label>
            <div className="flex gap-2">
              {[
                { label: "高", color: "bg-red-500" },
                { label: "中", color: "bg-yellow-400" },
                { label: "低", color: "bg-gray-400" },
              ].map(({ label, color }) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => setPriority(label)}
                  className={`px-5 py-2 rounded-full text-sm text-white font-medium transition-opacity ${color} ${
                    priority === label
                      ? "opacity-100 ring-2 ring-offset-1 ring-gray-400"
                      : "opacity-40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              引き継ぎ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="例：3番ラインのポンプから異音あり。夜間も確認してください。"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "登録中..." : "登録する"}
          </button>
        </form>
      </div>
    </main>
  );
}
