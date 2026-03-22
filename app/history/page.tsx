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

export default function History() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("handovers")
        .select("*")
        .lt("date", today)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) setHandovers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const priorityColor = (priority: string) => {
    if (priority === "高") return "bg-red-100 text-red-700";
    if (priority === "中") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  // 日付ごとにグループ化
  const grouped = handovers.reduce<Record<string, Handover[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4 shadow flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-white text-lg">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">ツナグ</h1>
          <p className="text-sm text-blue-200">過去の引き継ぎ履歴</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : dates.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p>過去の引き継ぎ履歴はありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">
                  {date.replace(/-/g, "/")}
                </h2>
                <div className="space-y-2">
                  {grouped[date].map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm border p-4 ${
                        item.is_checked ? "opacity-60" : ""
                      } ${
                        item.priority === "高" && !item.is_checked
                          ? "border-red-300"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(item.priority)}`}
                        >
                          重要度：{item.priority}
                        </span>
                        {item.is_checked ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            確認済み
                          </span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            未確認
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 text-sm">{item.content}</p>
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
