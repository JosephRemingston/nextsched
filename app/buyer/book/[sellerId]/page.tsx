import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BookingForm from "./booking-form"

interface BookingPageProps {
  params: Promise<{ sellerId: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { sellerId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?role=buyer")
  }

  // Get buyer profile
  const { data: buyerProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!buyerProfile || buyerProfile.role !== "buyer") {
    redirect("/auth/login?role=buyer")
  }

  // Get seller profile
  const { data: sellerProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", sellerId)
    .eq("role", "seller")
    .single()

  if (!sellerProfile) {
    redirect("/buyer")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <BookingForm seller={sellerProfile} buyer={buyerProfile} />
      </div>
    </div>
  )
}
