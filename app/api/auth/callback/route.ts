import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  console.log("Auth callback received:", { code: !!code, error, error_description });

  if (error) {
    console.error("Auth callback error:", error, error_description);
    return NextResponse.redirect(requestUrl.origin + config.auth.loginUrl + "?error=" + encodeURIComponent(error_description || error));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Code exchange error:", error);
        return NextResponse.redirect(requestUrl.origin + config.auth.loginUrl + "?error=" + encodeURIComponent(error.message));
      }
      
      console.log("Code exchange successful for user:", data.user?.email);
    } catch (exchangeError) {
      console.error("Code exchange exception:", exchangeError);
      return NextResponse.redirect(requestUrl.origin + config.auth.loginUrl + "?error=code_exchange_failed");
    }
  }

  // URL to redirect to after sign in process completes
  console.log("Redirecting to:", requestUrl.origin + config.auth.callbackUrl);
  return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}
