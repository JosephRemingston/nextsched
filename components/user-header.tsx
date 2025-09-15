import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User, Settings } from "lucide-react"
import LogoutButton from "./logout-button"
import Link from "next/link"

interface UserHeaderProps {
  className?: string
}

export default async function UserHeader({ className = "" }: UserHeaderProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  const userInitials = profile?.name 
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "U"

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-500 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">
              {profile?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {profile?.role || "user"}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/appointments" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>My Appointments</span>
            </Link>
          </DropdownMenuItem>
          {profile?.role === "seller" && (
            <DropdownMenuItem asChild>
              <Link href="/seller/calendar" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Calendar Settings</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <div className="w-full">
              <LogoutButton 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start p-0 h-auto font-normal"
              />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}