'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      toast.success('Successfully logged in!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Unable to reach Supabase authentication service. Please check configuration.')
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    toast.success('Entering Demo Mode as Hotel Owner / GM')
    router.push('/dashboard')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-10 text-sm"
              placeholder="manager@luxuryhotel.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 h-10 text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm"
        >
          {loading ? 'Authenticating...' : 'Sign In to Property'}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-medium">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleDemoLogin}
        className="w-full h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium text-xs flex items-center justify-center gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
        <span>One-Click Demo Dashboard Access</span>
      </Button>
    </div>
  )
}
