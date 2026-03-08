import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface Settings {
  embedding_model: string;
  chat_model: string;
  temperature: number;
  max_tokens: number;
  top_k: number;
  enable_mmr: boolean;
  mmr_lambda: number;
  similarity_threshold: number;
  hybrid_enabled: boolean;
  url_allowlist: string[];
  rate_limit_per_minute: number;
}

const defaultSettings: Settings = {
  embedding_model: "text-embedding-3-small",
  chat_model: "gpt-4o-mini",
  temperature: 0.1,
  max_tokens: 1500,
  top_k: 5,
  enable_mmr: false,
  mmr_lambda: 0.5,
  similarity_threshold: 0.3,
  hybrid_enabled: false,
  url_allowlist: [],
  rate_limit_per_minute: 30,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setSettings({
          embedding_model: data.embedding_model || defaultSettings.embedding_model,
          chat_model: data.chat_model || defaultSettings.chat_model,
          temperature: data.temperature ?? defaultSettings.temperature,
          max_tokens: data.max_tokens ?? defaultSettings.max_tokens,
          top_k: data.top_k ?? defaultSettings.top_k,
          enable_mmr: data.enable_mmr ?? defaultSettings.enable_mmr,
          mmr_lambda: data.mmr_lambda ?? defaultSettings.mmr_lambda,
          similarity_threshold: data.similarity_threshold ?? defaultSettings.similarity_threshold,
          hybrid_enabled: data.hybrid_enabled ?? defaultSettings.hybrid_enabled,
          url_allowlist: data.url_allowlist || defaultSettings.url_allowlist,
          rate_limit_per_minute: data.rate_limit_per_minute ?? defaultSettings.rate_limit_per_minute,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      id: "singleton",
      ...settings,
    });
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground";

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

          <div className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 font-semibold text-foreground">OpenAI Configuration</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Embedding Model">
                  <input value={settings.embedding_model} onChange={(e) => setSettings({ ...settings, embedding_model: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Chat Model">
                  <input value={settings.chat_model} onChange={(e) => setSettings({ ...settings, chat_model: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Temperature">
                  <input type="number" step="0.05" min="0" max="2" value={settings.temperature} onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Max Tokens">
                  <input type="number" min="100" max="4000" value={settings.max_tokens} onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })} className={inputClass} />
                </Field>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 font-semibold text-foreground">Retrieval Configuration</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Top K">
                  <input type="number" min="1" max="20" value={settings.top_k} onChange={(e) => setSettings({ ...settings, top_k: parseInt(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Similarity Threshold">
                  <input type="number" step="0.05" min="0" max="1" value={settings.similarity_threshold} onChange={(e) => setSettings({ ...settings, similarity_threshold: parseFloat(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Enable MMR">
                  <select value={settings.enable_mmr ? "true" : "false"} onChange={(e) => setSettings({ ...settings, enable_mmr: e.target.value === "true" })} className={inputClass}>
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </select>
                </Field>
                <Field label="MMR Lambda">
                  <input type="number" step="0.1" min="0" max="1" value={settings.mmr_lambda} onChange={(e) => setSettings({ ...settings, mmr_lambda: parseFloat(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Hybrid Search">
                  <select value={settings.hybrid_enabled ? "true" : "false"} onChange={(e) => setSettings({ ...settings, hybrid_enabled: e.target.value === "true" })} className={inputClass}>
                    <option value="false">Vector Only</option>
                    <option value="true">Hybrid (Vector + Keyword)</option>
                  </select>
                </Field>
                <Field label="Rate Limit (req/min)">
                  <input type="number" min="1" max="100" value={settings.rate_limit_per_minute} onChange={(e) => setSettings({ ...settings, rate_limit_per_minute: parseInt(e.target.value) })} className={inputClass} />
                </Field>
              </div>
            </section>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
