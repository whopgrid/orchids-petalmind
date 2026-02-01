"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { authClient, useSession } from "@/lib/auth-client"

export default function RegisterPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
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
    setErrorMessage("")

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords don't match")
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters")
      return
    }

    setSubmitting(true)

    try {
      // Step 1: Create the account
      const { data: signUpData, error: signUpError } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (signUpError?.code) {
        if (signUpError.code === "USER_ALREADY_EXISTS") {
          setErrorMessage("Email already exists")
        } else {
          setErrorMessage("Failed to create account")
        }
        setSubmitting(false)
        return
      }

      // Step 2: Immediately sign in after registration to establish session
      const { data: signInData, error: signInError } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        toast.error("Account created but sign in failed. Please sign in manually.")
        router.push("/login")
        return
      }

      // Step 3: Session is now established, redirect to chat
      toast.success("Account created successfully!")
      router.push("/chat")
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
          <h2 className="text-3xl font-bold">Create your account</h2>
          <p className="text-gray-400 mt-2">Join PetalMind and start chatting</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="off"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div className="px-3 py-2 bg-gray-700 rounded text-white text-xs text-center">
              {errorMessage}
            </div>
          )}
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}