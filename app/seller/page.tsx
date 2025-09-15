import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Users } from "lucide-react"
import Link from "next/link"
import UserHeader from "@/components/user-header"

export default async function SellerDashboard() {
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

  // Get upcoming appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      buyer:buyer_id (name, email)
    `)
    .eq("seller_id", user.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5)

  const appointmentCount = appointments?.length || 0

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/seller/calendar">Calendar Settings</Link>
            </Button>
            <Button asChild>
              <Link href="/appointments">Appointments ({appointmentCount})</Link>
            </Button>
            <UserHeader />
          </div>
        </div>

        {!profile.google_refresh_token && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <p className="text-sm">Connect your calendar to start accepting appointments</p>
                <Button asChild>
                  <Link href="/seller/calendar">Connect Calendar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{appointment.title}</h3>
                      <p className="text-sm text-gray-600">
                        with {appointment.buyer?.name} ({appointment.buyer?.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.start_time).toLocaleDateString()} at{" "}
                        {new Date(appointment.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming appointments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your calendar is clear. Buyers can book appointments with you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
