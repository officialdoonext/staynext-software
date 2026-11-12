'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, ShieldCheck, LogOut, Hotel } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface UserMenuProps {
  user?: {
    id?: string
    email?: string
    user_metadata?: {
      full_name?: string
      role?: string
    }
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Hotel Manager'
  const email = user?.email || 'manager@staynext.com'
  const role = user?.user_metadata?.role || 'Hotel Owner'

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignored if offline
    }
    router.push('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900 leading-none">
              {fullName}
            </span>
            <span className="text-[10px] text-gray-500 font-medium mt-0.5">
              {role}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-medium text-gray-900">{fullName}</p>
            <p className="text-[11px] text-gray-500 truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-xs">Profile &amp; Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/properties" className="flex items-center gap-2 cursor-pointer">
            <Hotel className="h-4 w-4 text-gray-500" />
            <span className="text-xs">Property Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/roles" className="flex items-center gap-2 cursor-pointer">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            <span className="text-xs">Roles &amp; Permissions</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-xs">System Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-600 focus:text-red-700 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

