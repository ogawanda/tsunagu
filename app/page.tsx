"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Handover = {
  id: string;
  date: string;
  category: string;
  content: string;
  priority: string;
  is_checked: boolean;
  created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchHandovers = async () => {
    const { data, error } = await supabase
      .from("handovers")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (!error && data) setHandovers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const toggleCheck = async (id: string, current: boolean) => {
    await supabase
      .from("handovers")
      .update({ is_checked: !current })
      .eq("id", id);
    fetchHandovers();
  };

  const priorityColor = (priority: string) => {
    if (priority === "高") return "bg-red-100 text-red-700";
    if (priority === "中") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  const displayDate = today.replace(/-/g, "/");

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4 shadow">
        <h1 className="text-xl font-bold">ツナグ</h1>
        <p className="text-sm text-blue-200">工場引き継ぎメモアプリ</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            本日の引き継ぎ（{displayDate}）
          </h2>
          <button
            onClick={() => router.push("/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ＋ 新規登録
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : handovers.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p>本日の引き継ぎはまだありません</p>
            <p className="text-sm mt-1">「＋ 新規登録」から追加してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {handovers.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${
                  item.is_checked ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(item.priority)}`}
                      >
                        重要度：{item.priority}
                      </span>
                      {item.is_checked && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          確認済み
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 text-sm">{item.content}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() => toggleCheck(item.id, item.is_checked)}
                    className="mt-1 w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/history")}
            className="text-blue-600 text-sm underline"
          >
            過去の引き継ぎ履歴を見る
          </button>
        </div>
      </div>
    </main>
  );
}
