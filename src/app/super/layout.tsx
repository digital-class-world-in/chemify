"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SuperSidebar } from "@/components/super/sidebar"
import { SuperTopNav } from "@/components/super/top-nav"
import { Skeleton } from "@/components/ui/skeleton"

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  const isLoginPage = pathname === "/super/login"

  useEffect(() => {
    if (isLoginPage) {
      setIsVerifying(false)
      return
    }
    const session = localStorage.getItem('super_session')
    if (!session) {
      router.push("/super/login")
    } else {
      setIsVerifying(false)
    }
  }, [pathname, isLoginPage, router])

  if (isVerifying && !isLoginPage) {
    return (
      <div className="min-h-screen flex bg-white font-public-sans">
        <div className="w-[300px] h-screen bg-white border-r border-zinc-100 p-8 space-y-10">
          <Skeleton className="h-12 w-full rounded-2xl bg-zinc-50" />
          <div className="space-y-4 pt-10">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl bg-zinc-50" />)}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-20 bg-white border-b border-zinc-100 px-8 flex items-center justify-between">
            <Skeleton className="h-10 w-64 rounded-xl bg-zinc-50" />
            <Skeleton className="h-10 w-32 rounded-xl bg-zinc-50" />
          </div>
          <div className="p-10 space-y-10">
            <Skeleton className="h-48 w-full rounded-[40px] bg-zinc-50" />
            <div className="grid grid-cols-3 gap-8">
              <Skeleton className="h-32 rounded-3xl bg-zinc-50" />
              <Skeleton className="h-32 rounded-3xl bg-zinc-50" />
              <Skeleton className="h-32 rounded-3xl bg-zinc-50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden selection:bg-indigo-500/30 font-public-sans">
      <SuperSidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 min-w-0">
        <SuperTopNav />
        <div className="flex-1 w-full overflow-x-hidden bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}