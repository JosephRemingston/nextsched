"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "buyer"

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes:
            "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in as {role === "seller" ? "Seller" : "Buyer"}</CardTitle>
            <CardDescription>
              Use your Google account to{" "}
              {role === "seller" ? "manage your calendar and appointments" : "book appointments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button onClick={handleGoogleLogin} className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Continue with Google"}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to connect your Google Calendar for appointment scheduling.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
