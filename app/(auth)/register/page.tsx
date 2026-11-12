import { Metadata } from "next"
import RegisterForm from "@/components/forms/RegisterForm"
import Link from "next/link"
import { Building2 } from "lucide-react"

export const metadata: Metadata = { title: "Create Account" }

export default function RegisterPage() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="text-gray-500 text-sm mt-1">Start managing your property with StayNext</p>
      </div>
      <RegisterForm />
      <div className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </div>
    </div>
  )
}
