import { createServerClient } from "@supabase/ssr";
import { getClientOptions } from "./helpers";

export async function createClient() {
  const clientOptions = await getClientOptions();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    clientOptions,
  );
}