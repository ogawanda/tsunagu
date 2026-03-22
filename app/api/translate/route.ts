import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_NAMES: Record<string, string> = {
  en: "English",
  vi: "Vietnamese",
  zh: "Simplified Chinese",
};

export async function POST(request: NextRequest) {
  const { texts, targetLang } = await request.json();

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ translations: [] });
  }
  if (!targetLang || targetLang === "ja") {
    return NextResponse.json({ translations: texts });
  }

  const langName = LANG_NAMES[targetLang] ?? "English";
  const numbered = texts.map((t: string, i: number) => `[${i + 1}] ${t}`).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Translate the following Japanese factory handover notes to ${langName}.
Keep the same numbering format [1], [2], etc.
Keep technical terms accurate. Output only the translations, nothing else.

${numbered}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // [1] ... [2] ... の形式からパース
  const translations: string[] = texts.map((_: string, i: number) => {
    const idx = i + 1;
    const regex = new RegExp(`\\[${idx}\\]\\s*([\\s\\S]*?)(?=\\[${idx + 1}\\]|$)`);
    const match = raw.match(regex);
    return match ? match[1].trim() : texts[i];
  });

  return NextResponse.json({ translations });
}
