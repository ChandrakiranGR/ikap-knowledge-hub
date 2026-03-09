import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Chunking: split by headings/sections, keep steps together
function chunkText(text: string, targetSize = 1500, overlap = 200): { section: string; content: string }[] {
  const lines = text.split("\n");
  const sections: { heading: string; content: string }[] = [];
  let currentHeading = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    // Detect heading-like lines
    if (/^#{1,4}\s/.test(line) || /^[A-Z][A-Za-z\s&-]{2,60}$/.test(line.trim())) {
      if (currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join("\n") });
      }
      currentHeading = line.replace(/^#+\s*/, "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join("\n") });
  }

  // Now chunk each section if too large
  const chunks: { section: string; content: string }[] = [];
  for (const sec of sections) {
    const text = sec.content.trim();
    if (!text) continue;
    if (text.length <= targetSize) {
      chunks.push({ section: sec.heading, content: text });
    } else {
      // Split by paragraphs, keeping chunks under target
      const paragraphs = text.split(/\n\n+/);
      let current = "";
      for (const para of paragraphs) {
        if (current.length + para.length > targetSize && current.length > 0) {
          chunks.push({ section: sec.heading, content: current.trim() });
          // Overlap: take last N chars
          current = current.slice(-overlap) + "\n\n" + para;
        } else {
          current += (current ? "\n\n" : "") + para;
        }
      }
      if (current.trim()) {
        chunks.push({ section: sec.heading, content: current.trim() });
      }
    }
  }

  return chunks.length > 0 ? chunks : [{ section: "", content: text.trim() }];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, article_id, category, tags, source_url, content, content_type } = await req.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "title and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      // Check admin access
      const email = user?.email || "";
      const { data: isAdminResult } = await supabase.rpc("is_admin", { check_email: email });
      if (!isAdminResult) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get embedding model from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("embedding_model")
      .eq("id", "singleton")
      .single();
    const embeddingModel = settings?.embedding_model || "text-embedding-3-small";

    // Determine ingestion status
    let ingestionStatus = "ok";
    const warnings: string[] = [];
    if (!source_url) warnings.push("missing_url");

    // Insert article
    const { data: article, error: articleError } = await supabase
      .from("kb_articles")
      .insert({
        title,
        article_id: article_id || null,
        category: category || null,
        tags: tags || null,
        source_url: source_url || null,
        content_type: content_type || "pasted_text",
        raw_text: content,
        ingestion_status: ingestionStatus,
        created_by: userId,
      })
      .select("id")
      .single();

    if (articleError) {
      console.error("Article insert error:", articleError);
      throw new Error("Failed to insert article");
    }

    // Chunk the content
    const chunks = chunkText(content);

    // Create embeddings for each chunk
    const chunkRecords = [];
    if (openaiKey) {
      // Batch embed all chunks
      const texts = chunks.map((c) => c.content);
      const embResp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: embeddingModel, input: texts }),
      });

      if (!embResp.ok) {
        const errText = await embResp.text();
        console.error("Embedding error:", errText);
        warnings.push("embedding_failed");
      } else {
        const embData = await embResp.json();
        for (let i = 0; i < chunks.length; i++) {
          chunkRecords.push({
            article_uuid: article.id,
            chunk_index: i,
            section: chunks[i].section || null,
            content: chunks[i].content,
            embedding: embData.data[i].embedding,
            source_url: source_url || null,
          });
        }
      }
    }

    // If no embeddings (no API key or failed), still store chunks without embeddings
    if (chunkRecords.length === 0) {
      for (let i = 0; i < chunks.length; i++) {
        chunkRecords.push({
          article_uuid: article.id,
          chunk_index: i,
          section: chunks[i].section || null,
          content: chunks[i].content,
          embedding: null,
          source_url: source_url || null,
        });
      }
      if (!openaiKey) warnings.push("no_openai_key_embeddings_skipped");
    }

    // Insert chunks
    const { error: chunkError } = await supabase.from("kb_chunks").insert(chunkRecords);
    if (chunkError) {
      console.error("Chunk insert error:", chunkError);
      throw new Error("Failed to insert chunks");
    }

    return new Response(
      JSON.stringify({
        article_id: article.id,
        title,
        chunks_created: chunkRecords.length,
        warnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ingest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
