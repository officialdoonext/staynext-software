import { Metadata } from "next"
import LoginForm from "@/components/forms/LoginForm"
import Link from "next/link"
import { Building2 } from "lucide-react"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to StayNext</p>
      </div>
      <LoginForm />
      <div className="mt-6 text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Forgot your password?
        </Link>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign up
        </Link>
      </div>
    </div>
  )
}
