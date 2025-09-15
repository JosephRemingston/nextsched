"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, User, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

interface BookingFormProps {
  seller: {
    id: string
    name: string
    email: string
    google_refresh_token: string | null
  }
  buyer: {
    id: string
    name: string
    email: string
  }
}

interface TimeSlot {
  start: string
  end: string
}

export default function BookingForm({ seller, buyer }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [title, setTitle] = useState("Appointment")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Get next 14 days for date selection
  const availableDates = []
  for (let i = 1; i <= 14; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      availableDates.push(date.toISOString().split("T")[0])
    }
  }

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const response = await fetch(`/api/calendar/availability/${seller.id}?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("Error fetching available slots:", error)
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) {
      setError("Please select a time slot")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: seller.id,
          title,
          description,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to book appointment")
      }

      // Redirect to appointments page
      router.push("/appointments")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to book appointment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/buyer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">Schedule a meeting with {seller.name}</p>
        </div>
      </div>

      {/* Seller Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{seller.name}</h3>
              <p className="text-sm text-gray-600">{seller.email}</p>
              <p className="text-xs text-gray-500">
                Calendar: {seller.google_refresh_token ? "Connected" : "Not Connected"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Schedule Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBooking} className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <select
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a date</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2">Loading available slots...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 text-sm border rounded-md transition-colors ${
                          selectedSlot === slot
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto h-8 w-8 mb-2" />
                    <p>No available slots for this date</p>
                  </div>
                )}
              </div>
            )}

            {/* Appointment Details */}
            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting with seller"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional details about the appointment..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading || !selectedSlot}>
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
