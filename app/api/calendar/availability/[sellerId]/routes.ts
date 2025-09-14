import { createClient } from "@/lib/supabase/server"
import { GoogleCalendarService, refreshGoogleToken } from "@/lib/google-calendar"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ sellerId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sellerId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get seller profile
    const { data: seller } = await supabase.from("users").select("*").eq("id", sellerId).single()

    if (!seller || seller.role !== "seller") {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    let availableSlots = []

    if (seller.google_refresh_token) {
      try {
        // Refresh seller's access token
        const accessToken = await refreshGoogleToken(seller.google_refresh_token)

        if (accessToken) {
          const calendarService = new GoogleCalendarService(accessToken)
          availableSlots = await calendarService.getAvailableSlots(date)
        }
      } catch (error) {
        console.error("Error fetching calendar availability:", error)
      }
    }

    // If no Google Calendar integration, provide default slots
    if (availableSlots.length === 0) {
      // Generate default available slots (9 AM to 5 PM)
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = `${date}T${hour.toString().padStart(2, "0")}:00:00Z`
        const slotEnd = `${date}T${(hour + 1).toString().padStart(2, "0")}:00:00Z`
        availableSlots.push({ start: slotStart, end: slotEnd })
      }
    }

    // Filter out already booked appointments
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("seller_id", sellerId)
      .gte("start_time", `${date}T00:00:00Z`)
      .lt("start_time", `${date}T23:59:59Z`)

    const filteredSlots = availableSlots.filter((slot) => {
      return !existingAppointments?.some((appointment) => {
        const appointmentStart = new Date(appointment.start_time).getTime()
        const appointmentEnd = new Date(appointment.end_time).getTime()
        const slotStart = new Date(slot.start).getTime()
        const slotEnd = new Date(slot.end).getTime()

        return slotStart < appointmentEnd && slotEnd > appointmentStart
      })
    })

    return NextResponse.json({ availableSlots: filteredSlots })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
