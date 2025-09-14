import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Search, User } from "lucide-react"
import Link from "next/link"

export default async function BuyerDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=buyer")
  }

  // Get buyer profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "buyer") {
    redirect("/auth/login?role=buyer")
  }

  // Get available sellers
  const { data: sellers } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("role", "seller")
    .order("name", { ascending: true })

  // Get buyer's upcoming appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      seller:seller_id (name, email)
    `)
    .eq("buyer_id", user.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Book an Appointment</h1>
          <Button asChild variant="outline">
            <Link href="/appointments">My Appointments ({appointments?.length || 0})</Link>
          </Button>
        </div>

        {/* Sellers List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Available Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sellers && sellers.length > 0 ? (
              <div className="grid gap-4">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{seller.name}</h3>
                        <p className="text-sm text-gray-600">{seller.email}</p>
                        <p className="text-xs text-gray-500">
                          Member since {new Date(seller.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/buyer/book/${seller.id}`}>Book Appointment</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sellers available</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later for available sellers.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        {appointments && appointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{appointment.title}</h3>
                      <p className="text-sm text-gray-600">
                        with {appointment.seller?.name} ({appointment.seller?.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.start_time).toLocaleDateString()} at{" "}
                        {new Date(appointment.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
