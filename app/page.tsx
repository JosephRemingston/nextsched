import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Schedule Appointments with Ease</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect buyers and sellers through seamless Google Calendar integration. Book appointments that sync
            automatically to both calendars.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">For Sellers</CardTitle>
              <CardDescription>Share your availability and manage appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Connect your Google Calendar to automatically share your availability and receive bookings from
                potential buyers.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login?role=seller">Get Started as Seller</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">For Buyers</CardTitle>
              <CardDescription>Find and book appointments with sellers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Browse available sellers, view their real-time availability, and book appointments that sync to your
                Google Calendar.
              </p>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/auth/login?role=buyer">Get Started as Buyer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
