
-- Fix match_chunks function with proper search_path
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  article_uuid uuid,
  chunk_index int,
  section text,
  content text,
  source_url text,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kb_chunks.id,
    kb_chunks.article_uuid,
    kb_chunks.chunk_index,
    kb_chunks.section,
    kb_chunks.content,
    kb_chunks.source_url,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity
  FROM kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
