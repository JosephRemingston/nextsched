import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get appointments based on user role
  const appointmentsQuery = supabase
    .from("appointments")
    .select(`
      *,
      seller:seller_id (name, email),
      buyer:buyer_id (name, email)
    `)
    .order("start_time", { ascending: true })

  if (profile.role === "seller") {
    appointmentsQuery.eq("seller_id", user.id)
  } else {
    appointmentsQuery.eq("buyer_id", user.id)
  }

  const { data: appointments } = await appointmentsQuery

  // Separate upcoming and past appointments
  const now = new Date()
  const upcomingAppointments = appointments?.filter((apt) => new Date(apt.start_time) > now) || []
  const pastAppointments = appointments?.filter((apt) => new Date(apt.start_time) <= now) || []

  const backUrl = profile.role === "seller" ? "/seller" : "/buyer"

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Appointments</h1>
          {profile.role === "buyer" && (
            <Button asChild>
              <Link href="/buyer">Book New Appointment</Link>
            </Button>
          )}
        </div>

        <div className="flex gap-4 mb-8">
          <div className="text-sm">
            <span className="font-medium">{upcomingAppointments.length}</span> upcoming
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{pastAppointments.length}</span> past
          </div>
        </div>

        {/* Upcoming Appointments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const otherParty = profile.role === "seller" ? appointment.buyer : appointment.seller
                  const startTime = new Date(appointment.start_time)
                  const endTime = new Date(appointment.end_time)

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{appointment.title}</h3>
                          <Badge variant="secondary">{appointment.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {profile.role === "seller" ? "with" : "with"} {otherParty?.name} ({otherParty?.email})
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {startTime.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {appointment.description && (
                          <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-gray-500">
                          {Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days away
                        </div>
                        {appointment.google_event_id && (
                          <Badge variant="outline" className="text-xs">
                            Synced to Calendar
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming appointments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {profile.role === "buyer"
                    ? "Book your first appointment with a seller."
                    : "No appointments scheduled yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Past Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastAppointments.slice(0, 10).map((appointment) => {
                  const otherParty = profile.role === "seller" ? appointment.buyer : appointment.seller
                  const startTime = new Date(appointment.start_time)
                  const endTime = new Date(appointment.end_time)

                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-700">{appointment.title}</h3>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          with {otherParty?.name} ({otherParty?.email})
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {startTime.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
