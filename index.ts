import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await caller.auth.getUser();
    if (userError || !user) throw new Error("Not signed in.");

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: coach, error: coachError } = await admin
      .from("profiles").select("role").eq("id", user.id).single();
    if (coachError || coach?.role !== "coach") throw new Error("Coach access required.");

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const resend = !!body.resend;
    const existingClientId = body.clientId ? String(body.clientId) : null;
    const redirectTo = String(body.redirectTo ?? "");

    let clientId = existingClientId;

    if (resend) {
      if (!clientId) throw new Error("Missing client.");
      const { data: existing, error } = await admin.auth.admin.getUserById(clientId);
      if (error || !existing.user?.email) throw new Error("Client email not found.");
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(existing.user.email, {
        redirectTo,
        data: { display_name: name || undefined },
      });
      if (inviteError) throw inviteError;
    } else {
      if (!name || !email) throw new Error("Name and email are required.");
      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { display_name: name },
      });
      if (inviteError) throw inviteError;
      clientId = invited.user.id;

      // Trigger normally creates profile. Upsert makes the function robust if trigger timing differs.
      const { error: profileError } = await admin.from("profiles").upsert({
        id: clientId, display_name: name, role: "client"
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      const { error: linkError } = await admin.from("coach_clients").upsert({
        coach_id: user.id, client_id: clientId, status: "invited"
      }, { onConflict: "coach_id,client_id" });
      if (linkError) throw linkError;
    }

    return new Response(JSON.stringify({ ok: true, clientId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
