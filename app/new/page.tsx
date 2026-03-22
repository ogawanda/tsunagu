"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Member = { id: string; name: string };
type Category = { id: string; name: string };

const DEFAULT_CATEGORIES = ["設備", "安全", "品質", "その他"];
const SHIFTS = ["朝", "昼", "夜"];

const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "朝";
  if (hour >= 14 && hour < 22) return "昼";
  return "夜";
};

export default function NewHandover() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("中");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [shift, setShift] = useState(getCurrentShift());
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (profile) {
        setCompanyId(profile.company_id);
        const { data: memberData } = await supabase
          .from("members").select("id, name").order("created_at");
        if (memberData) setMembers(memberData);
        const { data: catData } = await supabase
          .from("categories").select("id, name").order("created_at");
        if (catData && catData.length > 0) {
          setCategories(catData);
          setCategory(catData[0].name);
        } else {
          setCategories(DEFAULT_CATEGORIES.map((n, i) => ({ id: String(i), name: n })));
          setCategory(DEFAULT_CATEGORIES[0]);
        }
      }
    };
    init();
  }, []);

  const searchSimilar = async (kw: string) => {
    if (!kw.trim()) { setSuggestions([]); return; }
    const words = kw.trim().split(/\s+/);
    const { data } = await supabase
      .from("handovers")
      .select("content")
      .ilike("content", `%${words[0]}%`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!data) return;
    const unique = [...new Set(data.map((h) => h.content))].slice(0, 5);
    setSuggestions(unique);
  };

  const handleKeywordsChange = (value: string) => {
    setKeywords(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSimilar(value), 500);
  };

  const generateContent = async () => {
    if (!keywords.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, category, priority }),
      });
      const data = await res.json();
      if (data.text) setContent(data.text);
    } catch {
      alert("AI生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const filename = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("handover-images")
      .upload(filename, file, { upsert: true });
    if (error) {
      console.error("画像アップロードエラー:", error.message);
      return null;
    }
    const { data } = supabase.storage
      .from("handover-images")
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author) {
      alert("記入者を選択してください");
      return;
    }
    setSaving(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      setUploading(true);
      imageUrl = await uploadImage(imageFile);
      setUploading(false);
    }

    const { error } = await supabase.from("handovers").insert({
      category,
      content,
      priority,
      author,
      shift,
      date: new Date().toISOString().split("T")[0],
      is_checked: false,
      company_id: companyId,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    });

    setSaving(false);
    if (error) {
      alert("登録に失敗しました。もう一度試してください。");
    } else {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4 shadow flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-white text-lg">←</button>
        <div>
          <h1 className="text-xl font-bold">ツナグ</h1>
          <p className="text-sm text-blue-200">新規引き継ぎ登録</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 記入者 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              記入者 <span className="text-red-500">*</span>
            </label>
            {members.length === 0 ? (
              <p className="text-sm text-slate-400">
                従業員が登録されていません。
                <button type="button" onClick={() => router.push("/members")} className="text-blue-500 underline ml-1">
                  従業員を追加する
                </button>
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {members.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setAuthor(m.name)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      author === m.name
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* シフト */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">シフト</label>
            <div className="flex gap-2">
              {SHIFTS.map((s) => {
                const colors: Record<string, string> = {
                  朝: "bg-orange-500",
                  昼: "bg-sky-500",
                  夜: "bg-indigo-500",
                };
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setShift(s)}
                    className={`px-5 py-2 rounded-full text-sm text-white font-medium transition-opacity ${colors[s]} ${
                      shift === s ? "opacity-100 ring-2 ring-offset-1 ring-gray-400" : "opacity-40"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">現在の時間から自動選択されています</p>
          </div>

          {/* カテゴリ */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
              <button type="button" onClick={() => router.push("/categories")} className="text-xs text-blue-500 hover:underline">
                カテゴリ管理
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    category === cat.name
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 重要度 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">重要度</label>
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
                    priority === label ? "opacity-100 ring-2 ring-offset-1 ring-gray-400" : "opacity-40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 引き継ぎ内容 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              引き継ぎ内容 <span className="text-red-500">*</span>
            </label>

            {/* AI生成エリア */}
            <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-2">✨ AIで文章を自動生成</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="キーワードを入力（例：3番ライン ポンプ 異音）"
                  className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generating || !keywords.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {generating ? "生成中..." : "AI生成"}
                </button>
              </div>
              <p className="text-xs text-blue-500 mt-1.5">キーワードを入力してAI生成を押すと、引き継ぎ文章が自動で作成されます</p>

              {suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">📋 過去の似た引き継ぎ（タップで入力）</p>
                  <div className="space-y-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setContent(s); setSuggestions([]); }}
                        className="w-full text-left text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors leading-relaxed"
                      >
                        {s.length > 80 ? s.slice(0, 80) + "..." : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="例：3番ラインのポンプから異音あり。夜間も確認してください。"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* 画像添付 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📷 画像添付（任意）
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                写真を選ぶ
              </div>
              <span className="text-xs text-slate-400">
                {imageFile ? imageFile.name : "設備の写真などを添付できます"}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img src={imagePreview} alt="プレビュー" className="max-w-full rounded-lg border border-slate-200 max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "画像アップロード中..." : saving ? "登録中..." : "登録する"}
          </button>
        </form>
      </div>
    </main>
  );
}
