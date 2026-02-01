"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { authClient, useSession } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const { data: session, isPending } = useSession()

  // Check if already logged in - instant redirect without loading state
  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/chat")
    }
  }, [session, isPending, router])

  // Auto-dismiss error message after 4 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("")
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage("")

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        setErrorMessage("Wrong password or email")
        setSubmitting(false)
        return
      }

      if (data) {
        toast.success("Successfully signed in!")
        router.push("/chat")
      }
    } catch (error) {
      setErrorMessage("An error occurred")
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white p-4 overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url("https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/file_000000008f8c7206aafd88cd92e4150c-1762278610630.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="text-gray-400 mt-2">Sign in to continue to PetalMind</p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="off"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div className="px-3 py-2 bg-gray-700 rounded text-white text-xs text-center">
              {errorMessage}
            </div>
          )}
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}