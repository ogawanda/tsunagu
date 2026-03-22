"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Comment = {
  id: string;
  handover_id: string;
  content: string;
  author: string;
  created_at: string;
};

type Handover = {
  id: string;
  date: string;
  category: string;
  content: string;
  priority: string;
  is_checked: boolean;
  is_archived: boolean;
  created_at: string;
  author?: string;
  comments?: Comment[];
};

const CATEGORIES = ["すべて", "設備", "安全", "品質", "その他"];
const today = new Date().toISOString().split("T")[0];

export default function Home() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("すべて");
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchHandovers = async (date?: string) => {
    const { data, error } = await supabase
      .from("handovers")
      .select("*, comments(*)")
      .eq("date", date ?? today)
      .order("created_at", { ascending: false });
    if (!error && data) setHandovers(data);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id, name")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCompanyId(profile.company_id);
          setUserName(profile.name);
          const { data: memberData } = await supabase
            .from("members").select("name").order("created_at");
          if (memberData) setMembers(memberData.map((m: { name: string }) => m.name));
          const { data: catData } = await supabase
            .from("categories").select("name").order("created_at");
          if (catData && catData.length > 0) {
            setCategoryList(["すべて", ...catData.map((c: { name: string }) => c.name)]);
          } else {
            setCategoryList(["すべて", "設備", "安全", "品質", "その他"]);
          }
        }
      }
      fetchHandovers(today);
    };
    init();
  }, []);

  const toggleCheck = async (id: string, current: boolean) => {
    await supabase.from("handovers").update({ is_checked: !current }).eq("id", id);
    fetchHandovers(selectedDate);
  };

  const deleteHandover = async (id: string) => {
    if (!confirm("この引き継ぎを削除しますか？")) return;
    await supabase.from("handovers").delete().eq("id", id);
    fetchHandovers(selectedDate);
  };

  const archiveHandover = async (id: string, current: boolean) => {
    await supabase.from("handovers").update({ is_archived: !current }).eq("id", id);
    fetchHandovers(selectedDate);
  };

  const startEdit = (item: Handover) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setOpenCommentId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await supabase.from("handovers").update({ content: editContent.trim() }).eq("id", id);
    setEditingId(null);
    setEditContent("");
    fetchHandovers(selectedDate);
  };

  const addComment = async (handoverId: string) => {
    if (!commentText.trim()) return;
    await supabase.from("comments").insert({
      handover_id: handoverId,
      content: commentText.trim(),
      author: commentAuthor.trim() || userName || "名無し",
      company_id: companyId,
    });
    setCommentText("");
    setCommentAuthor("");
    setOpenCommentId(null);
    fetchHandovers(selectedDate);
  };

  const exportCSV = () => {
    const rows = [
      ["日付", "カテゴリ", "重要度", "内容", "確認済み", "登録時刻"],
      ...handovers.map((h) => [
        h.date,
        h.category,
        h.priority,
        h.content,
        h.is_checked ? "済" : "未",
        new Date(h.created_at).toLocaleTimeString("ja-JP"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `引き継ぎ_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = handovers.filter((h) => {
    if (!showArchived && h.is_archived) return false;
    if (showArchived && !h.is_archived) return false;
    if (selectedCategory !== "すべて" && h.category !== selectedCategory) return false;
    if (selectedAuthor !== "すべて" && h.author !== selectedAuthor) return false;
    if (searchKeyword.trim() && !h.content.includes(searchKeyword.trim())) return false;
    return true;
  });

  const archivedCount = handovers.filter((h) => h.is_archived).length;

  const uncheckedCount = handovers.filter((h) => !h.is_checked).length;
  const highPriorityCount = handovers.filter((h) => h.priority === "高" && !h.is_checked).length;
  const displayDate = selectedDate.replace(/-/g, "/");

  const priorityColor = (p: string) => {
    if (p === "高") return "bg-red-100 text-red-700 border-red-200";
    if (p === "中") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">ツナグ</h1>
            <p className="text-xs text-blue-200 mt-0.5">工場引き継ぎメモアプリ</p>
          </div>
          <div className="flex items-center gap-2">
            {uncheckedCount > 0 && (
              <span className="bg-white text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                未確認 {uncheckedCount}件
              </span>
            )}
            <button
              onClick={() => router.push("/members")}
              className="text-blue-200 hover:text-white text-xs transition-colors"
            >
              従業員管理
            </button>
            <button
              onClick={() => router.push("/categories")}
              className="text-blue-200 hover:text-white text-xs transition-colors"
            >
              カテゴリ管理
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
              className="text-blue-600 hover:text-blue-400 text-xs transition-colors opacity-30 hover:opacity-60"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* 重要度「高」アラート */}
      {highPriorityCount > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <p className="text-red-700 text-sm font-medium">
              重要度「高」の未確認が {highPriorityCount} 件あります
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* 日付・ボタン */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500">{displayDate}</h2>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 shadow-sm"
            >
              CSVダウンロード
            </button>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border transition-colors ${
                showArchived
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {showArchived ? "← 通常表示" : `アーカイブ${archivedCount > 0 ? `（${archivedCount}）` : ""}`}
            </button>
            {!showArchived && (
              <button
                onClick={() => router.push("/new")}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
              >
                ＋ 新規登録
              </button>
            )}
          </div>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(categoryList.length > 0 ? categoryList : CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 検索・絞り込み */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="キーワードで検索..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchHandovers(e.target.value);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {members.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {["すべて", ...members].map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedAuthor(name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedAuthor === name
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {name === "すべて" ? "全員" : name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 引き継ぎ一覧 */}
        {loading ? (
          <p className="text-center text-slate-400 py-10 text-sm">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            <p className="text-sm">引き継ぎはまだありません</p>
            <p className="text-xs mt-1">「＋ 新規登録」から追加してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  item.priority === "高" && !item.is_checked
                    ? "border-red-200 ring-1 ring-red-100"
                    : "border-slate-100"
                } ${item.is_checked ? "opacity-50" : ""}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        {item.is_checked && (
                          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                            確認済み
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(item.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* 引き継ぎ内容（編集モード切り替え） */}
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditContent(""); }}
                              className="text-slate-500 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 text-sm leading-relaxed">{item.content}</p>
                      )}

                      {item.author && (
                        <p className="text-xs text-slate-400 mt-1.5">記入: {item.author}</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() => toggleCheck(item.id, item.is_checked)}
                      className="mt-1 w-5 h-5 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                  </div>

                  {/* 編集・削除・アーカイブボタン */}
                  {editingId !== item.id && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {!showArchived && (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1 rounded-lg transition-colors"
                        >
                          編集
                        </button>
                      )}
                      <button
                        onClick={() => archiveHandover(item.id, item.is_archived)}
                        className="text-xs text-slate-500 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 px-3 py-1 rounded-lg transition-colors"
                      >
                        {item.is_archived ? "アーカイブ解除" : "アーカイブ"}
                      </button>
                      <button
                        onClick={() => deleteHandover(item.id)}
                        className="text-xs text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 px-3 py-1 rounded-lg transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  )}

                  {/* コメント一覧 */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {item.comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 flex-shrink-0">
                            {c.author[0]}
                          </div>
                          <div className="bg-slate-50 rounded-xl px-3 py-1.5 flex-1">
                            <span className="text-xs font-medium text-slate-600">{c.author}</span>
                            <p className="text-xs text-slate-700 mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* コメント入力 */}
                  {openCommentId === item.id ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {members.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {members.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setCommentAuthor(name)}
                              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                                commentAuthor === name
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="コメントを入力..."
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addComment(item.id)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
                        >
                          送信
                        </button>
                        <button
                          onClick={() => { setOpenCommentId(null); setCommentText(""); setCommentAuthor(""); }}
                          className="text-slate-500 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpenCommentId(item.id)}
                      className="mt-2 text-xs text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      ＋ コメントを追加
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/history")}
            className="text-blue-500 text-sm hover:text-blue-700 transition-colors"
          >
            過去の引き継ぎ履歴を見る →
          </button>
        </div>
      </div>
    </main>
  );
}
