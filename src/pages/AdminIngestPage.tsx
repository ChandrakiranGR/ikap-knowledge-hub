import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";

export default function AdminIngestPage() {
  const [title, setTitle] = useState("");
  const [articleId, setArticleId] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ chunks: number; warnings: string[] } | null>(null);

  const handleIngest = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingest", {
        body: {
          title: title.trim(),
          article_id: articleId.trim() || undefined,
          category: category.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          source_url: sourceUrl.trim() || undefined,
          content: content.trim(),
          content_type: "pasted_text",
        },
      });
      if (error) throw error;
      setResult({ chunks: data.chunks_created || 0, warnings: data.warnings || [] });
      toast.success(`Article ingested: ${data.chunks_created} chunks created`);
      setTitle("");
      setArticleId("");
      setCategory("");
      setTags("");
      setSourceUrl("");
      setContent("");
    } catch (err) {
      console.error(err);
      toast.error("Ingestion failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setTitle("How to Enroll in Duo MFA");
    setArticleId("KB0012345");
    setCategory("Security");
    setTags("MFA, Duo, Enrollment, Security");
    setSourceUrl("https://service.northeastern.edu/tech?id=kb_article&sys_id=duo_mfa");
    setContent(`How to Enroll in Duo Multi-Factor Authentication (MFA)

Overview
Duo MFA adds an extra layer of security to your Northeastern account. All faculty, staff, and students must enroll in Duo to access university services.

Requirements
- A smartphone (iOS or Android) with the Duo Mobile app, OR
- A hardware token (available from the IT Help Desk)
- Your Northeastern username and password

Step-by-Step Enrollment

Step 1: Go to the Duo Enrollment Portal
Navigate to https://duo.northeastern.edu and sign in with your Northeastern credentials.

Step 2: Choose Your Device
Select "Mobile phone" or "Tablet" as your device type. Enter your phone number if prompted.

Step 3: Install Duo Mobile
Download and install the Duo Mobile app from the App Store (iOS) or Google Play Store (Android).

Step 4: Activate Duo Mobile
Open the Duo Mobile app and scan the QR code displayed on your screen. The app will automatically link to your Northeastern account.

Step 5: Verify Enrollment
Click "Send Me a Push" to verify your enrollment. Approve the push notification on your phone.

Troubleshooting
- If you don't receive a push notification, ensure your phone has an internet connection.
- If you lost your phone, contact the IT Help Desk at 617-373-4357 to get a temporary bypass code.
- Hardware tokens can be requested at the IT Help Desk in Snell Library.

Warning: Never share your Duo bypass codes with anyone. IT staff will never ask for your bypass codes.

For additional help, contact the IT Service Desk:
- Phone: 617-373-4357
- Email: help@northeastern.edu
- ServiceNow: https://service.northeastern.edu`);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-3xl py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ingest KB Article</h1>
              <p className="text-sm text-muted-foreground">Add knowledge base content for IKAP retrieval</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLoadSample}>
              <FileText className="mr-2 h-4 w-4" />
              Load Sample KB
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" placeholder="Article title" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Article ID</label>
                <input value={articleId} onChange={(e) => setArticleId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" placeholder="KB0012345" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. Security, Network" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Tags (comma-separated)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" placeholder="MFA, Duo, Security" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Source URL</label>
              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">KB Content *</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground font-mono" placeholder="Paste your KB article content here..." />
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleIngest} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Ingest Article
              </Button>
              {result && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-foreground">{result.chunks} chunks created</span>
                  {result.warnings.length > 0 && (
                    <span className="text-accent">({result.warnings.join(", ")})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
