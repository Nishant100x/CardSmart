import { createClient } from "npm:@supabase/supabase-js@2.112.0";
import {
  extractResponseText,
  isPdfSource,
  normalizeHtml,
  safeLimit,
  sourceIsDue,
  type OpenAIResponseShape,
} from "./logic.ts";

type SourceRow = {
  id: string;
  card_id: string | null;
  issuer: string;
  source_type: string;
  url: string;
  check_frequency_hours: number;
  last_checked_at: string | null;
  last_content_hash: string | null;
};

type AnalysisChange = {
  change_type: "reward_rule" | "cap" | "exclusion" | "fee" | "eligibility" | "benefit" | "terms" | "offer" | "card_status" | "other";
  field_path: string;
  old_value: string;
  new_value: string;
  evidence_quote: string;
  explanation: string;
  confidence: number;
  effective_date: string | null;
  is_actionable: boolean;
};

type AnalysisResult = {
  source_summary: string;
  no_change_reason: string;
  changes: AnalysisChange[];
};

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_STORED_TEXT = 180_000;
const MAX_MODEL_TEXT = 120_000;
const MAX_PREVIOUS_TEXT = 40_000;

const CHANGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    source_summary: { type: "string" },
    no_change_reason: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          change_type: {
            type: "string",
            enum: ["reward_rule", "cap", "exclusion", "fee", "eligibility", "benefit", "terms", "offer", "card_status", "other"],
          },
          field_path: { type: "string" },
          old_value: { type: "string" },
          new_value: { type: "string" },
          evidence_quote: { type: "string" },
          explanation: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          effective_date: { anyOf: [{ type: "string" }, { type: "null" }] },
          is_actionable: { type: "boolean" },
        },
        required: [
          "change_type", "field_path", "old_value", "new_value", "evidence_quote",
          "explanation", "confidence", "effective_date", "is_actionable",
        ],
      },
    },
  },
  required: ["source_summary", "no_change_reason", "changes"],
} as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function sha256(value: Uint8Array | string): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchSource(source: SourceRow): Promise<{
  bytes: Uint8Array;
  contentType: string;
  normalizedText: string | null;
  isPdf: boolean;
  status: number;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5",
        "user-agent": "CardSmartRewardsMonitor/1.0 (+https://cardsmart.netlify.app)",
      },
    });
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    if (!response.ok) throw new Error(`Issuer source returned HTTP ${response.status}.`);
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_SOURCE_BYTES) throw new Error(`Issuer source exceeds ${MAX_SOURCE_BYTES} bytes.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error(`Issuer source exceeds ${MAX_SOURCE_BYTES} bytes.`);
    const pdf = isPdfSource(contentType, source.url);
    const normalizedText = pdf ? null : normalizeHtml(new TextDecoder("utf-8").decode(bytes));
    if (!pdf && !normalizedText) throw new Error("Issuer source did not contain readable text.");
    return { bytes, contentType, normalizedText, isPdf: pdf, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

async function analyzeChangedSource(args: {
  source: SourceRow;
  currentText: string | null;
  previousText: string | null;
  publishedVersion: unknown;
  isPdf: boolean;
  openAIKey: string;
  model: string;
}): Promise<{ result: AnalysisResult; responseId: string | null }> {
  const { source, currentText, previousText, publishedVersion, isPdf, openAIKey, model } = args;
  const comparisonContext = [
    `Issuer: ${source.issuer}`,
    `Card ID: ${source.card_id ?? "issuer-wide"}`,
    `Source type: ${source.source_type}`,
    `Official source URL: ${source.url}`,
    `Current published CardSmart record: ${JSON.stringify(publishedVersion ?? {})}`,
    `Previous source text (may be empty): ${(previousText ?? "").slice(0, MAX_PREVIOUS_TEXT)}`,
  ].join("\n\n");

  const content: Array<Record<string, unknown>> = [{
    type: "input_text",
    text: `${comparisonContext}\n\nCurrent source text:\n${isPdf ? "The current PDF is attached as an input_file." : (currentText ?? "").slice(0, MAX_MODEL_TEXT)}`,
  }];
  if (isPdf) content.push({ type: "input_file", file_url: source.url, detail: "low" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openAIKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 4_000,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You audit official Indian credit-card issuer pages for CardSmart.",
                "Detect only material, decision-relevant changes to rewards, caps, exclusions, fees, eligibility, benefits, terms, offers, or card status.",
                "A changed webpage layout, cookie text, footer, timestamp, navigation, or wording with the same meaning is not a material change.",
                "Use only the supplied official source. Do not infer missing rules and do not use outside knowledge.",
                "Evidence must quote a short exact excerpt from the current source. If evidence is insufficient, return no actionable changes.",
                "For an offer page, report only genuinely new, removed, extended, or materially changed time-bound offers.",
                "Never claim a production update was made. Your output only creates a human review candidate.",
              ].join(" "),
            },
          ],
        },
        { role: "user", content },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cardsmart_source_change_detection",
          strict: true,
          schema: CHANGE_SCHEMA,
        },
      },
    }),
  });

  const payload = await response.json() as OpenAIResponseShape & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? `OpenAI returned HTTP ${response.status}.`);
  const result = JSON.parse(extractResponseText(payload)) as AnalysisResult;
  if (!result || !Array.isArray(result.changes)) throw new Error("OpenAI returned an invalid change-analysis payload.");
  return { result, responseId: payload.id ?? null };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const monitorSecret = Deno.env.get("MONITOR_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-monitor-secret") ?? "";
  if (!monitorSecret || !safeEqual(monitorSecret, suppliedSecret)) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.6-luna";
  if (!supabaseUrl || !serviceKey || !openAIKey) return json({ error: "Required backend secrets are missing." }, 500);

  let requestBody: Record<string, unknown> = {};
  try { requestBody = await request.json(); } catch { /* Empty body uses defaults. */ }
  const limit = safeLimit(requestBody.limit, 5);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: runId, error: runError } = await admin.rpc("begin_card_monitoring_run");
  if (runError) return json({ error: `Could not start monitoring: ${runError.message}` }, 500);
  if (!runId) return json({ error: "A monitoring run is already in progress." }, 409);

  let checked = 0;
  let changed = 0;
  let candidatesCreated = 0;
  const errors: Array<{ source_id?: string; url?: string; error: string }> = [];

  try {
    const { data: sourceRows, error: sourceError } = await admin
      .from("card_sources")
      .select("id,card_id,issuer,source_type,url,check_frequency_hours,last_checked_at,last_content_hash")
      .eq("is_active", true)
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(100);
    if (sourceError) throw sourceError;

    const dueSources = ((sourceRows ?? []) as SourceRow[])
      .filter((source) => sourceIsDue(source.last_checked_at, source.check_frequency_hours))
      .slice(0, limit);

    for (const source of dueSources) {
      const checkedAt = new Date().toISOString();
      let currentSnapshotId: string | null = null;
      try {
        const fetched = await fetchSource(source);
        const hash = await sha256(fetched.isPdf ? fetched.bytes : (fetched.normalizedText ?? ""));
        checked += 1;

        if (source.last_content_hash === hash) {
          await admin.from("card_sources").update({
            last_checked_at: checkedAt,
            last_http_status: fetched.status,
            last_error: null,
          }).eq("id", source.id);
          continue;
        }

        const { data: previousSnapshot } = await admin
          .from("card_source_snapshots")
          .select("content_text")
          .eq("source_id", source.id)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: snapshot, error: snapshotError } = await admin
          .from("card_source_snapshots")
          .upsert({
            source_id: source.id,
            content_hash: hash,
            content_type: fetched.contentType,
            content_length: fetched.bytes.byteLength,
            content_text: fetched.normalizedText?.slice(0, MAX_STORED_TEXT) ?? null,
            http_status: fetched.status,
            analysis_status: source.last_content_hash ? "analysis_failed" : "baseline",
            analysis_error: source.last_content_hash ? "Analysis pending" : null,
            fetched_at: checkedAt,
          }, { onConflict: "source_id,content_hash" })
          .select("id")
          .single();
        if (snapshotError) throw snapshotError;
        currentSnapshotId = snapshot.id;

        if (!source.last_content_hash) {
          await admin.from("card_sources").update({
            last_checked_at: checkedAt,
            last_content_hash: hash,
            last_http_status: fetched.status,
            last_changed_at: checkedAt,
            last_error: null,
          }).eq("id", source.id);
          continue;
        }

        let publishedVersion: unknown = null;
        if (source.card_id) {
          const { data } = await admin
            .from("card_versions")
            .select("reward_model,fees,eligibility,benefits,terms_and_conditions,source_urls,change_summary")
            .eq("card_id", source.card_id)
            .eq("status", "published")
            .maybeSingle();
          publishedVersion = data;
        }

        const analysis = await analyzeChangedSource({
          source,
          currentText: fetched.normalizedText,
          previousText: previousSnapshot?.content_text ?? null,
          publishedVersion,
          isPdf: fetched.isPdf,
          openAIKey,
          model,
        });

        const actionable = analysis.result.changes.filter((item) => (
          item.is_actionable && item.confidence >= 0.7 && item.evidence_quote.trim().length >= 8
        ));
        let createdForSource = 0;
        for (const item of actionable) {
          const dedupeKey = await sha256([
            source.id, hash, item.change_type, item.field_path, item.new_value,
          ].join("|"));
          const { data, error } = await admin.from("card_change_candidates").upsert({
            card_id: source.card_id,
            issuer: source.issuer,
            source_id: source.id,
            change_type: item.change_type,
            old_value: { field_path: item.field_path, value: item.old_value },
            proposed_value: {
              field_path: item.field_path,
              value: item.new_value,
              effective_date: item.effective_date,
              source_summary: analysis.result.source_summary,
            },
            evidence: {
              quote: item.evidence_quote,
              explanation: item.explanation,
              source_url: source.url,
              source_hash: hash,
              checked_at: checkedAt,
            },
            confidence: Math.min(1, Math.max(0, item.confidence)),
            status: "pending",
            detected_at: checkedAt,
            dedupe_key: dedupeKey,
          }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("id");
          if (error) throw error;
          createdForSource += data?.length ?? 0;
        }

        changed += 1;
        candidatesCreated += createdForSource;
        await admin.from("card_source_snapshots").update({
          analysis_status: createdForSource ? "candidates_created" : "no_material_change",
          analysis_error: null,
          openai_response_id: analysis.responseId,
        }).eq("id", snapshot.id);
        await admin.from("card_sources").update({
          last_checked_at: checkedAt,
          last_content_hash: hash,
          last_http_status: fetched.status,
          last_changed_at: checkedAt,
          last_error: null,
        }).eq("id", source.id);
      } catch (error) {
        const message = errorMessage(error).slice(0, 1_500);
        errors.push({ source_id: source.id, url: source.url, error: message });
        if (currentSnapshotId) {
          await admin.from("card_source_snapshots").update({
            analysis_status: "analysis_failed",
            analysis_error: message,
          }).eq("id", currentSnapshotId);
        }
        await admin.from("card_sources").update({
          last_checked_at: checkedAt,
          last_error: message,
        }).eq("id", source.id);
      }
    }
  } catch (error) {
    errors.push({ error: errorMessage(error).slice(0, 1_500) });
  }

  const status = errors.length ? (checked > 0 ? "partial" : "failed") : "completed";
  await admin.from("card_monitoring_runs").update({
    status,
    sources_checked: checked,
    sources_changed: changed,
    candidates_created: candidatesCreated,
    error_log: errors,
    finished_at: new Date().toISOString(),
  }).eq("id", runId);

  return json({
    run_id: runId,
    status,
    sources_checked: checked,
    sources_changed: changed,
    candidates_created: candidatesCreated,
    errors: errors.length,
  }, status === "failed" ? 500 : 200);
});
