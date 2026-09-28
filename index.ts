import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    console.log("invite-client: request received");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRole) throw new Error("Required Supabase environment variable is missing.");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) throw new Error("Authorization header missing.");
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await caller.auth.getUser();
    if (userError || !user) throw new Error(`Authentication failed: ${userError?.message || "Not signed in."}`);

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: coach, error: coachError } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (coachError || coach?.role !== "coach") throw new Error(`Coach access required${coachError ? `: ${coachError.message}` : "."}`);

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const resend = !!body.resend;
    const existingClientId = body.clientId ? String(body.clientId) : null;
    const redirectTo = String(body.redirectTo ?? "").trim();
    let clientId = existingClientId;

    if (resend) {
      if (!clientId) throw new Error("Missing client ID for resend.");
      const { data: existing, error } = await admin.auth.admin.getUserById(clientId);
      if (error || !existing.user?.email) throw new Error(`Client lookup failed: ${error?.message || "email not found"}`);
      console.log("invite-client: sending setup/recovery link", clientId);
      const { error: recoveryError } = await admin.auth.resetPasswordForEmail(existing.user.email, { redirectTo });
      if (recoveryError) throw new Error(`Setup link failed: ${recoveryError.message}`);
    } else {
      if (!name || !email) throw new Error("Name and email are required.");
      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { display_name: name } });
      if (inviteError) throw new Error(`Invitation failed: ${inviteError.message}`);
      clientId = invited.user.id;
      const { error: profileError } = await admin.from("profiles").upsert({ id: clientId, display_name: name, role: "client" }, { onConflict: "id" });
      if (profileError) throw new Error(`Client profile failed: ${profileError.message}`);
      const { error: linkError } = await admin.from("coach_clients").upsert({ coach_id: user.id, client_id: clientId, status: "invited" }, { onConflict: "coach_id,client_id" });
      if (linkError) throw new Error(`Coach/client link failed: ${linkError.message}`);
    }

    console.log("invite-client: completed successfully");
    return new Response(JSON.stringify({ ok: true, clientId, mode: resend ? "setup" : "invite" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("INVITE CLIENT ERROR:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
