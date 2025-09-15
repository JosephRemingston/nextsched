"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  showText?: boolean
  className?: string
}

export default function LogoutButton({ 
  variant = "ghost", 
  size = "default", 
  showIcon = true, 
  showText = true,
  className = ""
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        // Clear any client-side data
        // Redirect to home page
        router.push("/")
        router.refresh()
      } else {
        console.error("Failed to logout")
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {showIcon && <LogOut className={`${showText ? "mr-2" : ""} h-4 w-4`} />}
      {showText && (isLoggingOut ? "Signing out..." : "Sign out")}
    </Button>
  )
}