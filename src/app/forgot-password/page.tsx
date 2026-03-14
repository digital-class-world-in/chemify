
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useFirebase } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Mail, ArrowLeft, Loader2, ShieldCheck, Zap } from "lucide-react"

const LOGO_URL = "https://ik.imagekit.io/rgazxzsxr/image_60fabb28-8462-4e23-9c68-1683a88bad1f.png?updatedAt=1767788967683"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { auth } = useFirebase()
  const { toast } = useToast()

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!auth) return
    
    setIsLoading(true)
    const email = (new FormData(e.currentTarget).get("email") as string).trim()

    try {
      await sendPasswordResetEmail(auth, email)
      setIsSent(true)
      toast({
        title: "Reset Email Sent",
        description: `Instructions have been sent to ${email}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email. Please verify the address.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-public-sans text-black overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full -mr-64 -mt-64 blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full -ml-64 -mb-64 blur-3xl opacity-50" />

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] bg-white overflow-hidden relative z-10">
        <div className="h-2 w-full bg-[#0D9488]" />
        <CardHeader className="space-y-4 pt-12 px-10 text-center">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-500">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-zinc-800 tracking-tight font-headline uppercase">Recovery</CardTitle>
            <CardDescription className="text-zinc-400 font-medium text-[10px] tracking-widest uppercase">
              {isSent ? "Node Sync Initiated" : "Secure Password Reset Link"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest ml-1">Registered Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-[#0D9488] transition-colors" />
                  <Input 
                    name="email" 
                    type="email" 
                    placeholder="admin@institute.com" 
                    required 
                    className="pl-12 h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 transition-all text-black font-bold placeholder:text-zinc-300 text-sm shadow-inner focus-visible:ring-[#0D9488]"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#0D9488] hover:bg-[#0b7a6d] text-white rounded-2xl h-14 font-black text-sm shadow-xl shadow-emerald-900/10 border-none transition-all active:scale-95 uppercase tracking-widest"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100/50 text-emerald-600 text-sm font-medium leading-relaxed italic">
                "An official password reset link has been dispatched to your inbox. Please follow the instructions to secure your node."
              </div>
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-zinc-500 border-zinc-100 bg-zinc-50/50 transition-all uppercase text-[10px] tracking-widest hover:bg-zinc-100">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {!isSent && (
          <CardFooter className="px-10 pb-10 pt-0 justify-center">
            <Link href="/login" className="flex items-center gap-2 text-[10px] font-black text-zinc-300 hover:text-[#0D9488] uppercase tracking-widest transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to Authorization
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
