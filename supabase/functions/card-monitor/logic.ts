export type OpenAIResponseShape = {
  id?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

export function normalizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPdfSource(contentType: string | null, url: string): boolean {
  return Boolean(contentType?.toLowerCase().includes("application/pdf") || /\.pdf(?:$|[?#])/i.test(url));
}

export function sourceIsDue(
  lastCheckedAt: string | null,
  frequencyHours: number,
  nowMs = Date.now(),
): boolean {
  if (!lastCheckedAt) return true;
  const checkedMs = Date.parse(lastCheckedAt);
  if (!Number.isFinite(checkedMs)) return true;
  return nowMs - checkedMs >= Math.max(1, frequencyHours) * 60 * 60 * 1000;
}

export function extractResponseText(response: OpenAIResponseShape): string {
  for (const item of response.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "refusal" && part.refusal) {
        throw new Error(`OpenAI refused the source analysis: ${part.refusal}`);
      }
      if ((part.type === "output_text" || part.type === "text") && part.text) return part.text;
    }
  }
  throw new Error("OpenAI response did not contain structured output text.");
}

export function safeLimit(value: unknown, fallback = 5): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(10, Math.max(1, Math.floor(numeric)));
}
