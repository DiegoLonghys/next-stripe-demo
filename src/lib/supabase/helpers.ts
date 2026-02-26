import { CookieMethodsServer, CookieOptionsWithName } from "@supabase/ssr";
import { SupabaseClientOptions } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type ClientOptions = SupabaseClientOptions<"public"> & {
  cookieOptions?: CookieOptionsWithName;
  cookies: CookieMethodsServer;
  cookieEncoding?: "raw" | "base64url";
};

export async function getClientOptions(): Promise<ClientOptions> {
  const cookieStore = await cookies();
  return {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  };
}
