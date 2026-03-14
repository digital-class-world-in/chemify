
"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, MessageSquare, Calendar, User, Check, Trash2, X, Clock, Info, LogOut, Globe, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { useUser, useFirebase } from "@/firebase"
import { ref, onValue, off, remove, update } from "firebase/database"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { signOut } from "firebase/auth"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"

export function StudentTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, auth } = useUser()
  const { database } = useFirebase()
  const { resolvedId, isLoading: idLoading } = useResolvedId()
  
  const [displayName, setDisplayName] = useState("User")
  const [targetId, setTargetId] = useState<string | null>(null)
  const [adminUid, setAdminUid] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState("")
  const [isStaffPortal, setIsStaffPortal] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE dd MMMM").toUpperCase())
  }, [])

  useEffect(() => {
    const staffSession = localStorage.getItem('staff_session')
    if (staffSession) {
      const session = JSON.parse(staffSession)
      setDisplayName(session.name)
      setTargetId(session.staffId)
      setAdminUid(session.adminUid)
      setIsStaffPortal(true)
      return
    }

    const branchSession = localStorage.getItem('branch_session')
    if (branchSession) {
      const session = JSON.parse(branchSession)
      setDisplayName(session.name)
      setTargetId(session.branchId)
      setAdminUid(session.adminUid)
      return
    }

    if (!database || !user) return
    
    const institutesRef = ref(database, `Institutes`)
    onValue(institutesRef, (snapshot) => {
      const institutes = snapshot.val() || {}
      Object.keys(institutes).forEach(instId => {
        const adms = institutes[instId].admissions || {}
        Object.keys(adms).forEach(admId => {
          if (adms[aid].email?.toLowerCase() === user.email?.toLowerCase()) {
            setDisplayName(admissions[admId].studentName)
            setTargetId(admId)
            setAdminUid(instId)
          }
        })
      })
    })
  }, [database, user])

  useEffect(() => {
    if (!database || !targetId || !adminUid) return
    
    const notifRef = ref(database, `Institutes/${adminUid}/notifications/${targetId}`)
    const unsub = onValue(notifRef, (snap) => {
      const data = snap.val() || {}
      setNotifications(Object.keys(data).map(k => ({ ...data[k], id: k })).reverse())
    })

    const profileRef = ref(database, `Institutes/${adminUid}/profile`)
    onValue(profileRef, (s) => {
      const p = s.val()
      if (p) {
        setSlug(p.slug)
        setCurrentPlan(p.currentPlan)
      }
    })

    return () => {
      off(notifRef)
      off(profileRef)
    }
  }, [database, targetId, adminUid])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const markAllAsRead = async () => {
    if (!database || !targetId || !adminUid) return
    const updates: any = {}
    notifications.forEach(n => {
      if (!n.read) updates[`Institutes/${adminUid}/notifications/${targetId}/${n.id}/read`] = true
    })
    await update(ref(database), updates)
  }

  const clearAll = async () => {
    if (!database || !targetId || !adminUid) return
    await remove(ref(database, `Institutes/${adminUid}/notifications/${targetId}`))
  }

  const handleLogout = async () => {
    const staffSession = localStorage.getItem('staff_session')
    const branchSession = localStorage.getItem('branch_session')

    if (staffSession) {
      localStorage.removeItem('staff_session')
      router.push("/staff/login")
    } else if (branchSession) {
      localStorage.removeItem('branch_session')
      router.push("/branch/login")
    } else if (auth) {
      await signOut(auth)
      router.push("/student/login")
    }
  }

  const handleOpenWebsite = () => {
    const target = slug || adminUid
    if (target) {
      window.open(`/sites/${target}`, '_blank')
    }
  }

  const initial = displayName.charAt(0).toUpperCase()
  const chatHref = pathname.startsWith('/staff') ? '/staff/chat' : pathname.startsWith('/student') ? '/student/chat' : pathname.startsWith('/branch') ? '/branch/chat' : '/chat'

  return (
    <header className="h-20 bg-white border-b border-zinc-100 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 flex items-center gap-6">
        <div className="px-0 py-2 min-h-[44px] flex items-center justify-start">
          {currentDate ? (
            <span className="text-sm md:text-base font-black text-zinc-800 tracking-[0.1em] font-headline">
              {currentDate}
            </span>
          ) : (
            <Skeleton className="h-5 w-32 bg-zinc-200/50" />
          )}
        </div>
        
        {currentPlan && (
          <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> {currentPlan}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenWebsite}
            className="p-2.5 text-emerald-500 hover:text-emerald-600 transition-all bg-emerald-50 rounded-xl group relative border-none outline-none"
            title="View Public Website"
          >
            <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <Link href={chatHref} className="p-2.5 text-blue-500 hover:text-blue-600 transition-all bg-blue-50 rounded-xl group relative border-none outline-none">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2.5 text-zinc-400 hover:text-primary transition-colors relative bg-zinc-50 rounded-xl outline-none border-none">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] mr-8 mt-4">
              <div className="bg-primary p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"><Bell className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Alert Center</h4>
                    <p className="text-[10px] font-bold text-white/60 uppercase">{unreadCount} New Notifications</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={markAllAsRead} className="p-2 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent text-white" title="Mark all read"><Check className="w-4 h-4" /></button>
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
                          {n.type === 'Leave' ? <Calendar className="w-5 h-5" /> : <Info className="w-5 h-5" />}
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
                <Link href={displayName === 'User' ? '#' : pathname.startsWith('/staff') ? '/staff/notices' : pathname.startsWith('/branch') ? '/branch/dashboard' : '/student/notifications'} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Alerts</Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 bg-primary pl-2 pr-5 py-1.5 rounded-full shadow-lg shadow-primary/10 border-none group cursor-pointer transition-all hover:pr-6 outline-none">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-black text-xs shadow-sm uppercase">
                {initial}
              </div>
              <span className="text-[11px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                {displayName.split(' ')[0]}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-[24px] border-zinc-100 p-2 shadow-xl" align="end">
            <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User Profile</DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer focus:bg-blue-50">
              <Link href={isStaffPortal ? "/staff/profile" : pathname.startsWith('/student') ? "/student/profile" : "#"} className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">My Profile</span>
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
    </header>
  )
}
