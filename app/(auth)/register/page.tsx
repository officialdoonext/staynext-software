import { Metadata } from "next"
import AuthForm from "@/components/forms/AuthForm"
import { Building2 } from "lucide-react"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Register Property | StayNext Hotel Management",
}

export default function RegisterPage() {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 sm:p-8 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-[#5e2b9d] rounded-md flex items-center justify-center shadow-md shadow-[#5e2b9d]/10">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-medium text-gray-900">Register New Property</h1>
        <p className="text-gray-500 text-xs mt-1">
          Create a tenant organization for your hotel, lodge, or resort
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-gray-400">Loading registration...</div>}>
        <AuthForm initialTab="signup" />
      </Suspense>
    </div>
  )
}
