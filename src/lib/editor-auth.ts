import { supabase } from "@/lib/supabase";
import { mayEnterArea, type AccessArea } from "@/lib/editor-access";

export async function checkEditorArea(area: AccessArea) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { userId: null, allowed: false };
  const admin = await supabase.rpc("is_admin");
  let news = false;
  let school = false;
  if (area === "news") {
    const result = await supabase.rpc("can_manage_news");
    news = !result.error && result.data === true;
  }
  if (area === "school") {
    const result = await supabase.from("schools").select("id").limit(1);
    school = !result.error && !!result.data?.length;
  }
  return {
    userId: user.id,
    allowed: mayEnterArea({ admin: !admin.error && admin.data === true, news, school }, area),
  };
}

export async function loginNewsEditor(username: string, pin: string) {
  const { data, error } = await supabase.functions.invoke("news-editor-login", {
    body: { username: username.trim().toLowerCase(), pin },
  });
  if (error || !data?.access_token || !data?.refresh_token)
    throw new Error("Неверный логин или PIN-код. Повторите позже.");
  const result = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (result.error || !(await checkEditorArea("news")).allowed) {
    await supabase.auth.signOut();
    throw new Error("Нет доступа к новостям.");
  }
}
