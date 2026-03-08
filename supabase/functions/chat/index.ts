import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /act\s+as\s+(a\s+)?developer/i,
  /you\s+are\s+now/i,
  /disregard\s+all/i,
  /bypass\s+(your\s+)?rules/i,
  /what\s+are\s+your\s+instructions/i,
  /show\s+me\s+your\s+system\s+message/i,
];

function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, user_message } = await req.json();
    if (!user_message || typeof user_message !== "string") {
      return new Response(JSON.stringify({ error: "user_message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prompt injection check
    if (detectInjection(user_message)) {
      return new Response(
        JSON.stringify({
          answer:
            "I can only help with IT knowledge base questions. I cannot modify my instructions or reveal system information. How can I assist you with an IT question?",
          sources: [],
          confidence: "high",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure session exists
    if (session_id) {
      await supabase.from("chat_sessions").upsert({ id: session_id });
    }

    // Store user message
    await supabase.from("chat_logs").insert({
      session_id: session_id || null,
      role: "user",
      message: user_message,
    });

    // Get settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    const embeddingModel = settings?.embedding_model || "text-embedding-3-small";
    const chatModel = settings?.chat_model || "gpt-4o-mini";
    const temperature = settings?.temperature ?? 0.1;
    const maxTokens = settings?.max_tokens ?? 1500;
    const topK = settings?.top_k ?? 5;
    const similarityThreshold = settings?.similarity_threshold ?? 0.3;

    // Get active system prompt
    let systemPrompt =
      "You are IKAP, an IT Knowledge Base assistant. Use ONLY the provided Sources. Every claim must have citations like [Source 1].";
    if (settings?.active_prompt_version_id) {
      const { data: promptData } = await supabase
        .from("prompt_versions")
        .select("system_prompt")
        .eq("id", settings.active_prompt_version_id)
        .single();
      if (promptData?.system_prompt) systemPrompt = promptData.system_prompt;
    }

    // If no OpenAI key, return retrieval-only mode
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          answer:
            "⚠️ IKAP is running in retrieval-only demo mode (OpenAI API key not configured). Please contact an admin to enable full AI responses.",
          sources: [],
          confidence: "low",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute embedding
    const embResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: user_message,
      }),
    });
    if (!embResp.ok) {
      const errText = await embResp.text();
      console.error("Embedding error:", errText);
      throw new Error("Failed to compute embedding");
    }
    const embData = await embResp.json();
    const queryEmbedding = embData.data[0].embedding;

    // Retrieve chunks (semantic)
    const { data: semanticChunks, error: matchError } = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: similarityThreshold,
      match_count: topK,
    });

    if (matchError) {
      console.error("Match error:", matchError);
      throw new Error("Failed to retrieve chunks");
    }

    // Platform-aware supplemental retrieval (improves precision for queries like "Android")
    const platformKeywords = ["android", "iphone", "ios", "windows", "mac", "chromebook", "linux"];
    const normalizedMessage = user_message.toLowerCase();
    const requestedPlatforms = platformKeywords.filter((p) => normalizedMessage.includes(p));

    let supplementalChunks: any[] = [];
    if (requestedPlatforms.length > 0) {
      const orFilter = requestedPlatforms
        .map((p) => `title.ilike.%${p}%`)
        .join(",");

      let platformArticleQuery = supabase
        .from("kb_articles")
        .select("id")
        .or(orFilter);

      // Keep supplemental retrieval focused to the same topic intent
      if (normalizedMessage.includes("nuwave")) {
        platformArticleQuery = platformArticleQuery.ilike("title", "%nuwave%");
      }
      if (!normalizedMessage.includes("vpn")) {
        platformArticleQuery = platformArticleQuery.not("title", "ilike", "%vpn%");
      }

      const { data: platformArticles } = await platformArticleQuery.limit(5);

      const platformArticleIds = (platformArticles || []).map((a: any) => a.id);

      if (platformArticleIds.length > 0) {
        const { data: extraChunks } = await supabase
          .from("kb_chunks")
          .select("id, article_uuid, chunk_index, section, content, source_url")
          .in("article_uuid", platformArticleIds)
          .order("chunk_index", { ascending: true })
          .limit(6);

        supplementalChunks = (extraChunks || []).map((c: any) => ({
          ...c,
          similarity: 0.99,
        }));
      }
    }

    // Merge supplemental + semantic chunks (dedupe by chunk id)
    const mergedById = new Map<string, any>();
    [...supplementalChunks, ...(semanticChunks || [])].forEach((c: any) => {
      if (!mergedById.has(c.id)) mergedById.set(c.id, c);
    });
    const chunks = Array.from(mergedById.values()).slice(0, Math.max(topK, 6));

    // Get article titles
    const articleIds = [...new Set((chunks || []).map((c: any) => c.article_uuid))];
    let articlesMap: Record<string, any> = {};
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from("kb_articles")
        .select("id, title, article_id, source_url")
        .in("id", articleIds);
      if (articles) {
        articles.forEach((a: any) => {
          articlesMap[a.id] = a;
        });
      }
    }

    // Build context
    const sources = (chunks || []).map((chunk: any, i: number) => {
      const article = articlesMap[chunk.article_uuid] || {};
      return {
        chunk_id: chunk.id,
        article_title: article.title || "Unknown",
        article_id: article.article_id || null,
        section: chunk.section || null,
        source_url: chunk.source_url || article.source_url || null,
        snippet: chunk.content?.substring(0, 300) || "",
      };
    });

    const contextText = sources
      .map(
        (s: any, i: number) =>
          `[Source ${i + 1}] Title: ${s.article_title}${s.section ? ` | Section: ${s.section}` : ""}${s.source_url ? ` | URL: ${s.source_url}` : ""}\n${(chunks || [])[i]?.content || ""}`
      )
      .join("\n\n---\n\n");

    // Call OpenAI
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chatModel,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `SOURCES:\n${contextText || "No relevant sources found."}\n\n---\nUSER QUESTION: ${user_message}`,
          },
        ],
      }),
    });

    if (!chatResp.ok) {
      const errText = await chatResp.text();
      console.error("Chat completion error:", errText);
      throw new Error("Failed to get chat completion");
    }
    const chatData = await chatResp.json();
    const answer = chatData.choices?.[0]?.message?.content || "I couldn't generate an answer.";
    const confidence = sources.length >= 3 ? "high" : sources.length >= 1 ? "medium" : "low";

    // Store assistant response
    await supabase.from("chat_logs").insert({
      session_id: session_id || null,
      role: "assistant",
      message: answer,
      retrieved_chunk_ids: sources.map((s: any) => s.chunk_id),
    });

    return new Response(
      JSON.stringify({ answer, sources, confidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
