"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Comment = {
  id: string;
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
  created_at: string;
  comments?: Comment[];
};

export default function History() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("handovers")
        .select("*, comments(*)")
        .lt("date", today)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) setHandovers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const exportCSV = () => {
    const rows = [
      ["日付", "カテゴリ", "重要度", "内容", "確認済み"],
      ...handovers.map((h) => [
        h.date, h.category, h.priority, h.content, h.is_checked ? "済" : "未",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `引き継ぎ履歴.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const priorityColor = (p: string) => {
    if (p === "高") return "bg-red-100 text-red-700 border-red-200";
    if (p === "中") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const grouped = handovers.reduce<Record<string, Handover[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-white hover:text-blue-200 transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide">ツナグ</h1>
            <p className="text-xs text-blue-200 mt-0.5">過去の引き継ぎ履歴</p>
          </div>
          <button
            onClick={exportCSV}
            className="ml-auto bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
          >
            CSVダウンロード
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-slate-400 py-10 text-sm">読み込み中...</p>
        ) : dates.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            <p className="text-sm">過去の引き継ぎ履歴はありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500">{date.replace(/-/g, "/")}</span>
                  <span className="text-xs text-slate-400">
                    ({grouped[date].filter(h => h.is_checked).length}/{grouped[date].length}件確認済み)
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[date].map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl shadow-sm border p-4 ${
                        item.is_checked ? "opacity-50 border-slate-100" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        {item.is_checked ? (
                          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">確認済み</span>
                        ) : (
                          <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">未確認</span>
                        )}
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed">{item.content}</p>
                      {item.comments && item.comments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-400">コメント {item.comments.length}件</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
