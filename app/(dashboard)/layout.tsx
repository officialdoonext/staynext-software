import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/services/dashboard.service"
import DashboardShell from "@/components/layout/DashboardShell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user: any = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch {
      // Supabase connection timeout or error
    }
  }

  // If not authenticated or in local dev/demo preview
  if (!user) {
    if (!isSupabaseConfigured()) {
      // Instant dev preview user in 0ms
      user = {
        id: 'demo-user-1',
        email: 'alex.rivers@staynext.com',
        user_metadata: {
          full_name: 'Alex Rivers',
          role: 'Hotel Owner / GM',
        },
      }
    } else {
      redirect('/login')
    }
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
