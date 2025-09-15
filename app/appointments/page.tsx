import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import UserHeader from "@/components/user-header"

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
  if (!profile) redirect("/auth/login")

  const appointmentsQuery = supabase
    .from("appointments")
    .select(`
      *,
      seller:seller_id (name, email),
      buyer:buyer_id (name, email)
    `)
    .order("start_time", { ascending: true })

  if (profile.role === "seller") appointmentsQuery.eq("seller_id", user.id)
  else appointmentsQuery.eq("buyer_id", user.id)

  const { data: appointments } = await appointmentsQuery

  const now = new Date()
  const upcomingAppointments = appointments?.filter((apt) => new Date(apt.start_time) > now) || []
  const pastAppointments = appointments?.filter((apt) => new Date(apt.start_time) <= now) || []

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f9f9f9",
    color: "#111",
    fontFamily: "sans-serif",
    padding: "20px 0",
    width: "90%",
    maxWidth: "800px",
    margin: "0 auto",
  }

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }

  const btnStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "4px",
  }

  const summaryStyle: React.CSSProperties = {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    fontSize: "14px",
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "12px",
  }

  const cardTitleStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontWeight: "bold",
  }

  return (
    <div style={{ background: "#f9f9f9", minHeight: "100vh" }}>
      <div style={containerStyle}>
        <header style={{ ...headerStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Appointments</h1>
          <UserHeader />
        </header>

        <div style={summaryStyle}>
          <div>{upcomingAppointments.length} upcoming</div>
          <div>{pastAppointments.length} past</div>
        </div>

        <section style={{ marginBottom: "30px" }}>
          <h2>Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p>No upcoming appointments.</p>
          ) : (
            upcomingAppointments.map((apt) => {
              const otherParty = profile.role === "seller" ? apt.buyer : apt.seller
              const startTime = new Date(apt.start_time)
              const endTime = new Date(apt.end_time)
              return (
                <div key={apt.id} style={cardStyle}>
                  <div>
                    <span style={cardTitleStyle}>{apt.title}</span>
                    with {otherParty?.name} ({otherParty?.email})
                    <div>
                      {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {apt.description && <p>{apt.description}</p>}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {pastAppointments.length > 0 && (
          <section style={{ marginBottom: "30px" }}>
            <h2>Past Appointments</h2>
            {pastAppointments.map((apt) => {
              const otherParty = profile.role === "seller" ? apt.buyer : apt.seller
              const startTime = new Date(apt.start_time)
              const endTime = new Date(apt.end_time)
              return (
                <div key={apt.id} style={cardStyle}>
                  <div>
                    <span style={cardTitleStyle}>{apt.title}</span>
                    with {otherParty?.name} ({otherParty?.email})
                    <div>
                      {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}