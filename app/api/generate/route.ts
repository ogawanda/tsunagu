import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { keywords, category, priority } = await request.json();

    if (!keywords?.trim()) {
      return NextResponse.json({ error: "キーワードを入力してください" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `あなたは工場の現場スタッフです。以下の情報をもとに、引き継ぎメモを1〜3文で作成してください。

キーワード: ${keywords}
カテゴリ: ${category || "未指定"}
重要度: ${priority || "中"}

ルール:
- 現場で使われる具体的な言葉を使う
- 「〜してください」「〜を確認してください」など次の担当者への指示を含める
- 余計な挨拶や説明は不要、引き継ぎ文章のみ出力する
- 100文字以内にまとめる`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI生成エラー:", error);
    return NextResponse.json({ error: "AI生成に失敗しました" }, { status: 500 });
  }
}
