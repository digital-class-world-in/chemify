
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, Loader2, ShieldCheck, Zap } from "lucide-react"

export default function SuperLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Super Admin Default Credentials
    if (email === "digitalclassworld@gmail.com" && password === "digital8990") {
      setTimeout(() => {
        const session = {
          email,
          role: 'SUPER_ADMIN',
          timestamp: Date.now()
        }
        localStorage.setItem('super_session', JSON.stringify(session))
        toast({ title: "Authorized", description: "Welcome to the Dashboard." })
        router.push("/super/dashboard")
      }, 1000)
    } else {
      setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Invalid super admin credentials.",
        })
        setIsLoading(false)
      }, 800)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-body">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1e3a8a]/5 via-transparent to-transparent opacity-50" />
      
      <Card className="w-full max-w-md border-zinc-100 shadow-2xl rounded-[40px] bg-white overflow-hidden relative z-10">
        <div className="h-2 w-full bg-[#1e3a8a]" />
        <CardHeader className="space-y-4 pt-12 px-10 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#1e3a8a] rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-blue-900/20 transition-all hover:scale-105">
              <ShieldCheck className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-zinc-800 tracking-tight uppercase font-headline">Dashboard</CardTitle>
            <CardDescription className="text-zinc-400 font-medium uppercase tracking-widest text-[10px]">Management Dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Master Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-[#1e3a8a] transition-colors" />
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="super@admin.com" 
                  required 
                  className="pl-12 h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 text-zinc-800 font-bold focus-visible:ring-[#1e3a8a] shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Access Key</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-[#1e3a8a] transition-colors" />
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="pl-12 h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 text-zinc-800 font-bold focus-visible:ring-[#1e3a8a] shadow-inner"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#EAB308] hover:bg-[#FACC15] text-black rounded-2xl h-14 font-black text-sm shadow-xl shadow-amber-900/10 border-none transition-all mt-4 uppercase tracking-[0.2em] active:scale-95"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Access"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 py-8 text-center justify-center">
          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em]">
            <Zap className="w-3.5 h-3.5 text-[#1e3a8a]" /> Cloud Infrastructure Control
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
