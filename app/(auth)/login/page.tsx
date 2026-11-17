import { Metadata } from "next"
import AuthForm from "@/components/forms/AuthForm"
import { Building2 } from "lucide-react"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Multi-Tenant Access | StayNext Hotel Management",
}

export default function LoginPage() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900">StayNext Multi-Tenant Portal</h1>
        <p className="text-gray-500 text-xs mt-1">
          Sign in to your property or register a new hospitality tenant
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-gray-400">Loading portal...</div>}>
        <AuthForm initialTab="signin" />
      </Suspense>
    </div>
  )
}
