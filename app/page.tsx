import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Schedule Appointments Easily
        </h1>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border rounded-md text-center">
            <CardHeader>
              <CardTitle className="text-lg font-medium">For Sellers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600 text-sm">
                Share your availability and receive bookings from buyers.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login?role=seller">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border rounded-md text-center">
            <CardHeader>
              <CardTitle className="text-lg font-medium">For Buyers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-600 text-sm">
                Browse sellers and book appointments that sync to your calendar.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/auth/login?role=buyer">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}