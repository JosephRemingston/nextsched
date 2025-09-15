import { createClient } from "@/lib/supabase/server"
import { GoogleCalendarService, refreshGoogleToken, type TimeSlot } from "@/lib/google-calendar"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ sellerId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sellerId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    console.log("Availability request:", { sellerId, date })

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get seller profile
    const { data: seller } = await supabase.from("users").select("*").eq("id", sellerId).single()

    if (!seller || seller.role !== "seller") {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    console.log("Seller found:", { id: seller.id, name: seller.name, hasGoogleToken: !!seller.google_refresh_token })

    let availableSlots: TimeSlot[] = []

    if (seller.google_refresh_token) {
      try {
        console.log("Attempting to refresh Google token...")
        // Refresh seller's access token
        const accessToken = await refreshGoogleToken(seller.google_refresh_token)

        if (accessToken) {
          console.log("Access token refreshed successfully")
          const calendarService = new GoogleCalendarService(accessToken)
          availableSlots = await calendarService.getAvailableSlots(date)
          console.log("Google Calendar slots:", availableSlots.length)
        } else {
          console.log("Failed to refresh access token, will use default slots")
        }
      } catch (error) {
        console.error("Error fetching calendar availability:", error)
        console.log("Will fall back to default slots due to calendar error")
      }
    } else {
      console.log("No Google refresh token found, using default slots")
    }

    // If no Google Calendar integration OR Google Calendar returned no slots, provide default slots
    if (availableSlots.length === 0) {
      console.log("Generating default slots for date:", date)
      // Generate default available slots (9 AM to 5 PM)
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = `${date}T${hour.toString().padStart(2, "0")}:00:00Z`
        const slotEnd = `${date}T${(hour + 1).toString().padStart(2, "0")}:00:00Z`
        availableSlots.push({ start: slotStart, end: slotEnd })
      }
      console.log("Generated default slots:", availableSlots.length)
    }

    // Filter out already booked appointments
    const dateStart = `${date}T00:00:00Z`
    const dateEnd = `${date}T23:59:59Z`
    
    console.log("Querying appointments between:", dateStart, "and", dateEnd)
    
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("seller_id", sellerId)
      .gte("start_time", dateStart)
      .lt("end_time", dateEnd)

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError)
    }

    console.log("Existing appointments for date:", existingAppointments?.length || 0, existingAppointments)

    const filteredSlots = availableSlots.filter((slot) => {
      return !existingAppointments?.some((appointment) => {
        const appointmentStart = new Date(appointment.start_time).getTime()
        const appointmentEnd = new Date(appointment.end_time).getTime()
        const slotStart = new Date(slot.start).getTime()
        const slotEnd = new Date(slot.end).getTime()

        return slotStart < appointmentEnd && slotEnd > appointmentStart
      })
    })

    console.log("Final filtered slots:", filteredSlots.length)

    return NextResponse.json({ availableSlots: filteredSlots })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
