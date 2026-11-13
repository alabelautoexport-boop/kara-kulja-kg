import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createNewsLoginHandler } from "./handler.ts";
const url = Deno.env.get("SUPABASE_URL")!;
const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(
  createNewsLoginHandler({
    find: async (username) => {
      const result = await service
        .from("news_editor_assignments")
        .select("user_id,is_active")
        .eq("username", username)
        .maybeSingle();
      if (result.error) throw new Error("Lookup failed");
      return result.data;
    },
    canAttempt: async (username) => {
      const result = await service.rpc("can_attempt_news_login", { p_username: username });
      return !result.error && result.data === true;
    },
    finishAttempt: async (username, success) => {
      const result = await service.rpc("finish_news_login_attempt", {
        p_username: username,
        p_success: success,
      });
      if (result.error) throw new Error("Login accounting unavailable");
      return result.data === true;
    },
    login: async (email, password) => {
      // Separate nonpersistent client per request; no cross-request user sessions.
      const caller = createClient(url, publicKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await caller.auth.signInWithPassword({ email, password });
      if (error?.code === "invalid_credentials") return null;
      if (error || !data.session) throw new Error("Authentication unavailable");
      return {
        userId: data.session.user.id,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    },
  }),
);
