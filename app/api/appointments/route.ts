import { createClient } from "@/lib/supabase/server"
import { GoogleCalendarService, refreshGoogleToken } from "@/lib/google-calendar"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { seller_id, title, description, start_time, end_time } = body

    // Get buyer and seller profiles
    const { data: buyer } = await supabase.from("users").select("*").eq("id", user.id).single()
    const { data: seller } = await supabase.from("users").select("*").eq("id", seller_id).single()

    if (!buyer || !seller || buyer.role !== "buyer" || seller.role !== "seller") {
      return NextResponse.json({ error: "Invalid user roles" }, { status: 400 })
    }

    // Create appointment in database
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        seller_id,
        buyer_id: user.id,
        title,
        description,
        start_time,
        end_time,
      })
      .select()
      .single()

    if (appointmentError) {
      return NextResponse.json({ error: appointmentError.message }, { status: 400 })
    }

    // Create Google Calendar events if tokens are available
    let googleEventId = null

    if (seller.google_refresh_token) {
      try {
        // Refresh seller's access token
        const sellerAccessToken = await refreshGoogleToken(seller.google_refresh_token)

        if (sellerAccessToken) {
          const calendarService = new GoogleCalendarService(sellerAccessToken)

          // Create event in seller's calendar
          const calendarEvent = {
            summary: title,
            description: `${description}\n\nMeeting with: ${buyer.name} (${buyer.email})`,
            start: {
              dateTime: start_time,
              timeZone: "UTC",
            },
            end: {
              dateTime: end_time,
              timeZone: "UTC",
            },
            attendees: [
              {
                email: buyer.email,
                displayName: buyer.name,
              },
              {
                email: seller.email,
                displayName: seller.name,
              },
            ],
          }

          googleEventId = await calendarService.createEvent(calendarEvent)

          // Update appointment with Google event ID
          if (googleEventId) {
            await supabase.from("appointments").update({ google_event_id: googleEventId }).eq("id", appointment.id)
          }
        }
      } catch (error) {
        console.error("Error creating Google Calendar event:", error)
        // Continue without calendar integration if it fails
      }
    }

    return NextResponse.json({
      appointment: { ...appointment, google_event_id: googleEventId },
      message: "Appointment booked successfully",
    })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
