import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const role = searchParams.get("role") || "buyer"

  if (code) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      console.log("Google refresh token:", data.session?.provider_refresh_token);
      // Create or update user profile
      const { error: profileError } = await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.full_name || data.user.email!,
        role: role,
        google_refresh_token: data.session?.provider_refresh_token || null,
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }

      // Redirect based on role
      console.log("Google refresh token:", data.session?.provider_refresh_token);
      const redirectPath = role === "seller" ? "/seller" : "/buyer"
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
