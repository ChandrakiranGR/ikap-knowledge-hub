import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, question, answer, sources, urgency, contact_email, short_description, description } =
      await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const snInstanceUrl = Deno.env.get("SN_INSTANCE_URL");
    const snUsername = Deno.env.get("SN_USERNAME");
    const snPassword = Deno.env.get("SN_PASSWORD");

    const shortDesc = short_description || (question || "").slice(0, 160);
    const desc =
      description ||
      `Question: ${question}\nAnswer: ${answer}\nSources: ${(sources || []).join(", ")}\nTimestamp: ${new Date().toISOString()}`;

    // Try ServiceNow if configured
    if (snInstanceUrl && snUsername && snPassword) {
      try {
        const snResp = await fetch(`${snInstanceUrl}/api/now/table/incident`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${snUsername}:${snPassword}`),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            short_description: shortDesc,
            description: desc,
            urgency: urgency === "high" ? "1" : urgency === "medium" ? "2" : "3",
            impact: urgency === "high" ? "1" : urgency === "medium" ? "2" : "3",
            contact_type: "chat",
            caller_id: contact_email || "",
          }),
        });

        if (snResp.ok) {
          const snData = await snResp.json();
          const incidentNumber = snData.result?.number;
          const incidentUrl = `${snInstanceUrl}/nav_to.do?uri=incident.do?sysparm_query=number=${incidentNumber}`;

          // Store in DB
          await supabase.from("tickets").insert({
            session_id: session_id || null,
            short_description: shortDesc,
            description: desc,
            urgency: urgency || null,
            contact_email: contact_email || null,
            status: "created",
            sn_incident_number: incidentNumber,
            sn_incident_url: incidentUrl,
          });

          return new Response(
            JSON.stringify({
              status: "created",
              incident_number: incidentNumber,
              incident_url: incidentUrl,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (snErr) {
        console.error("ServiceNow error:", snErr);
      }
    }

    // Stub mode: save to DB
    await supabase.from("tickets").insert({
      session_id: session_id || null,
      short_description: shortDesc,
      description: desc,
      urgency: urgency || null,
      contact_email: contact_email || null,
      status: "pending_config",
    });

    return new Response(
      JSON.stringify({
        status: "captured",
        message: "Ticket captured (ServiceNow not configured yet).",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ticket error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
