"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name: string };

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (profile) setCompanyId(profile.company_id);
      const { data } = await supabase
        .from("categories").select("id, name").order("created_at");
      if (data) setCategories(data);
      setLoading(false);
    };
    init();
  }, []);

  const addCategory = async () => {
    if (!newName.trim() || !companyId) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: newName.trim(), company_id: companyId })
      .select("id, name")
      .single();
    if (!error && data) {
      setCategories([...categories, data]);
      setNewName("");
    }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-white hover:text-blue-200 transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide">ツナグ</h1>
            <p className="text-xs text-blue-200 mt-0.5">カテゴリ管理</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 追加フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-sm font-medium text-slate-700 mb-3">カテゴリを追加</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="カテゴリ名を入力（例：電気、設備）"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={addCategory}
              disabled={!newName.trim()}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              追加
            </button>
          </div>
        </div>

        {/* カテゴリ一覧 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-sm font-medium text-slate-700 mb-3">
            カテゴリ一覧 <span className="text-slate-400 font-normal">({categories.length}件)</span>
          </p>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-4">読み込み中...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">カテゴリが登録されていません</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5"
                >
                  <span className="text-sm text-slate-800 font-medium">{c.name}</span>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
