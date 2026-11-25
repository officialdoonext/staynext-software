import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getServerTenantProfile } from "@/services/auth.server"
import DashboardShell from "@/components/layout/DashboardShell"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Unauthenticated users are blocked and redirected to login
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch tenant profile
  const profile = await getServerTenantProfile()

  // 3. Multi-tenant access check: Block software if inactive or expired
  if (!profile || !profile.isActive || profile.isExpired) {
    redirect('/onboarding')
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
