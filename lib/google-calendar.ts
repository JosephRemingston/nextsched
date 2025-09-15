// Google Calendar API utilities
export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

export interface TimeSlot {
  start: string
  end: string
}

export class GoogleCalendarService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    try {
      console.log("Fetching Google Calendar availability for date:", date)
      
      // Get busy times from Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: `${date}T00:00:00Z`,
          timeMax: `${date}T23:59:59Z`,
          items: [{ id: "primary" }],
        }),
      })

      if (!response.ok) {
        console.error("Google Calendar API error:", response.status, await response.text())
        throw new Error("Failed to fetch calendar data")
      }

      const data = await response.json()
      const busyTimes = data.calendars?.primary?.busy || []

      console.log("Google Calendar busy times:", busyTimes)

      // Generate available slots (9 AM to 5 PM, 1-hour slots)
      const availableSlots: TimeSlot[] = []
      const startHour = 9
      const endHour = 17

      console.log("Generating slots from", startHour, "to", endHour, "for date:", date)

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${date}T${hour.toString().padStart(2, "0")}:00:00Z`
        const slotEnd = `${date}T${(hour + 1).toString().padStart(2, "0")}:00:00Z`

        // Check if this slot conflicts with busy times
        const isAvailable = !busyTimes.some((busy: any) => {
          const busyStart = new Date(busy.start).getTime()
          const busyEnd = new Date(busy.end).getTime()
          const slotStartTime = new Date(slotStart).getTime()
          const slotEndTime = new Date(slotEnd).getTime()

          return slotStartTime < busyEnd && slotEndTime > busyStart
        })

        if (isAvailable) {
          availableSlots.push({ start: slotStart, end: slotEnd })
        } else {
          console.log("Slot", slotStart, "to", slotEnd, "is busy")
        }
      }

      console.log("Google Calendar available slots:", availableSlots.length)
      return availableSlots
    } catch (error) {
      console.error("Error fetching available slots:", error)
      console.log("Returning empty array to trigger default slot fallback")
      return []
    }
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...event,
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create calendar event")
      }

      const data = await response.json()
      return data.id
    } catch (error) {
      console.error("Error creating calendar event:", error)
      return null
    }
  }
}

// Utility to refresh Google access token
export async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    console.log("Attempting to refresh Google token...")
    
    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth environment variables")
      return null
    }
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    console.log("Token refresh response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Token refresh failed:", response.status, errorText)
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()
    console.log("Token refreshed successfully")
    return data.access_token
  } catch (error) {
    console.error("Error refreshing Google token:", error)
    return null
  }
}
