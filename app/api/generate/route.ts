import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { keywords, category, priority } = await request.json();

    if (!keywords?.trim()) {
      return NextResponse.json({ error: "キーワードを入力してください" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `あなたは工場の現場スタッフです。以下の情報をもとに、引き継ぎメモを1〜3文で作成してください。

キーワード: ${keywords}
カテゴリ: ${category || "未指定"}
重要度: ${priority || "中"}

ルール:
- 現場で使われる具体的な言葉を使う
- 「〜してください」「〜を確認してください」など次の担当者への指示を含める
- 余計な挨拶や説明は不要、引き継ぎ文章のみ出力する
- 100文字以内にまとめる`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI生成エラー:", error);
    return NextResponse.json({ error: "AI生成に失敗しました" }, { status: 500 });
  }
}
