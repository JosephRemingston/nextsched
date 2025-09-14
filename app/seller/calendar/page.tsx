import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function SellerCalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=seller")
  }

  // Get seller profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "seller") {
    redirect("/auth/login?role=seller")
  }

  const isCalendarConnected = !!profile.google_refresh_token

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Calendar Settings</h1>
          <Button asChild variant="outline">
            <Link href="/seller">Back</Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCalendarConnected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium">Connected to Google Calendar</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <p className="font-medium">Calendar Not Connected</p>
                  </div>
                )}
              </div>
              {!isCalendarConnected && (
                <Button asChild>
                  <Link href="/auth/login?role=seller">Connect Calendar</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Connect Your Calendar</h3>
                <p className="text-sm text-gray-600">
                  Grant permission to access your Google Calendar for reading availability and creating events.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Automatic Availability</h3>
                <p className="text-sm text-gray-600">
                  The system reads your calendar to show available time slots to potential buyers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Seamless Booking</h3>
                <p className="text-sm text-gray-600">
                  When buyers book appointments, events are automatically created in both calendars.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
