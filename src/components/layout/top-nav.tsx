
"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  MessageSquare, 
  Bell, 
  Calendar, 
  Globe, 
  User, 
  LogOut, 
  Check, 
  Trash2, 
  Clock, 
  Info,
  CalendarDays,
  CreditCard,
  AlertCircle,
  Zap,
  ShieldCheck
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off, remove, update, get } from "firebase/database"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { OnboardingPopup } from "@/components/onboarding/plan-popup"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, auth, database } = useFirebase()
  
  const [profile, setProfile] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState<string>("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  const isPortal = (pathname.startsWith('/branch') && !pathname.startsWith('/branch-management')) || 
                   pathname.startsWith('/staff') || 
                   (pathname.startsWith('/student') && !pathname.startsWith('/student-information'))

  useEffect(() => {
    setCurrentDate(format(new Date(), "dd MMMM yyyy"))
  }, [])

  useEffect(() => {
    if (!database || !user) return
    
    const profileRef = ref(database, `Institutes/${user.uid}/profile`)
    const unsubProfile = onValue(profileRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setProfile(data)
    })

    const notifRef = ref(database, `Institutes/${user.uid}/notifications/admin`)
    const unsubNotif = onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {}
      setNotifications(Object.keys(data).map(k => ({ ...data[k], id: k })).reverse())
    })

    return () => {
      unsubProfile()
      unsubNotif()
    }
  }, [database, user])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/login")
    }
  }

  const markAllRead = async () => {
    if (!database || !user) return
    const updates: any = {}
    notifications.forEach(n => {
      if (!n.read) updates[`Institutes/${user.uid}/notifications/admin/${n.id}/read`] = true
    })
    await update(ref(database), updates)
  }

  const clearAll = async () => {
    if (!database || !user) return
    await remove(ref(database, `Institutes/${user.uid}/notifications/admin`))
  }

  if (isPortal) return null

  const instituteName = profile?.instituteName || ""
  const firstWord = instituteName ? instituteName.split(' ')[0] : "My"
  const initial = firstWord.charAt(0).toUpperCase()

  const handleOpenWebsite = () => {
    if (user?.uid) {
      const target = profile?.slug || user.uid
      window.open(`/sites/${target}`, '_blank')
    }
  }

  // Show Upgrade button ONLY if on Trial or No Plan
  const showUpgrade = useMemo(() => {
    if (!profile) return true
    const plan = profile.currentPlan?.toLowerCase() || ""
    return !plan || plan.includes('trial')
  }, [profile])

  return (
    <header className="h-20 bg-white border-b border-zinc-100 px-8 flex items-center justify-between sticky top-0 z-40 font-public-sans text-black">
      <div className="flex-1 flex items-center gap-6">
        <div className="px-0 py-2 min-h-[44px] flex items-center justify-start">
          {currentDate ? (
            <span className="text-sm md:text-base font-black text-zinc-800 tracking-[0.1em] font-headline uppercase">
              {currentDate}
            </span>
          ) : (
            <Skeleton className="h-5 w-32 bg-zinc-200/50" />
          )}
        </div>
        
        {profile?.planExpiryDate && (
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">Expires On</span>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">
              {format(new Date(profile.planExpiryDate), "MMM dd, yyyy")}
            </span>
          </div>
        )}

        {showUpgrade && (
          <button 
            onClick={() => setIsUpgradeOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-amber-200 hover:border-amber-400 rounded-2xl transition-all active:scale-95 group shadow-sm"
          >
            <span className="text-[11px] font-black text-zinc-800 uppercase tracking-widest">Upgrade</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenWebsite}
            className="p-2.5 text-emerald-500 hover:text-emerald-600 transition-all bg-emerald-50 rounded-xl group relative border-none outline-none"
            title="Live Website Preview"
          >
            <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-50 border-2 border-white rounded-full animate-pulse" />
          </button>
          
          <Link href="/chat" className="p-2.5 text-blue-500 hover:text-blue-600 transition-all bg-blue-50 rounded-xl group relative border-none outline-none">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2.5 text-amber-500 relative hover:text-amber-600 transition-all bg-amber-50 rounded-xl group border-none outline-none">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-2xl mr-8 mt-4">
              <div className="bg-[#1e3a8a] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"><Bell className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Notification Panel</h4>
                    <p className="text-[10px] font-bold text-white/60 uppercase">{unreadCount} New Alerts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="p-2 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent text-white" title="Mark all read"><Check className="w-4 h-4" /></button>
                  <button onClick={clearAll} className="p-2 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent text-white" title="Clear all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-zinc-50">
                    {notifications.map((n) => (
                      <div key={n.id} className={cn(
                        "p-6 flex gap-4 hover:bg-zinc-50 transition-colors relative group",
                        !n.read && "bg-primary/5"
                      )}>
                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-white transition-colors shrink-0">
                          {n.type === 'Fee' ? <CreditCard className="w-5 h-5" /> : 
                           n.type === 'Leave' ? <CalendarDays className="w-5 h-5" /> : 
                           n.type === 'Chat' ? <MessageSquare className="w-5 h-5" /> :
                           <Info className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-zinc-800 uppercase tracking-tight">{n.title}</h5>
                          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{n.message}</p>
                          <p className="text-[9px] font-bold text-zinc-300 uppercase flex items-center gap-1.5 pt-1">
                            <Clock className="w-3 h-3" /> {n.timestamp ? format(new Date(n.timestamp), "p") : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-10 space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                      <Bell className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">No New Alerts</p>
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                <Link href="/notifications" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Global Registry</Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 bg-zinc-50 pl-2 pr-4 py-1.5 rounded-full border border-zinc-100 shadow-sm min-w-[140px] cursor-pointer hover:bg-zinc-100 transition-all outline-none group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm uppercase">
                {instituteName ? initial : "?"}
              </div>
              {instituteName ? (
                <span className="text-sm font-bold text-zinc-700 font-headline uppercase truncate max-w-[120px]">{firstWord}</span>
              ) : (
                <Skeleton className="h-4 w-20 bg-zinc-200" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-[24px] border-zinc-100 p-2 shadow-xl" align="end">
            <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest User Profile"></DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer focus:bg-zinc-50">
              <Link href="/system-setting" className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-zinc-50" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-3 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isUpgradeOpen && (
        <OnboardingPopup 
          instituteName={instituteName} 
          hideStarter={true} 
          onClose={() => setIsUpgradeOpen(false)} 
        />
      )}
    </header>
  )
}
