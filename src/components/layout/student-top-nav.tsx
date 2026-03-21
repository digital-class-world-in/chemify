
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  User, 
  Check, 
  Trash2, 
  X, 
  Clock, 
  Info, 
  LogOut, 
  Globe, 
  ShieldCheck, 
  Menu,
  ChevronDown
} from "lucide-react"
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "firebase/auth"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { studentMenu } from "./student-sidebar"
import { staffMenuConfig } from "./staff-sidebar"
import { branchMenu } from "./branch-sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  
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

    const studentSession = localStorage.getItem('student_session')
    if (studentSession) {
      const session = JSON.parse(studentSession)
      setDisplayName(session.name)
      setTargetId(session.studentId)
      setAdminUid(session.adminUid)
      return
    }
  }, [])

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

  const markAllRead = async () => {
    if (!database || !adminUid || !targetId) return
    const updates: any = {}
    notifications.forEach(n => {
      if (!n.read) updates[`Institutes/${adminUid}/notifications/${targetId}/${n.id}/read`] = true
    })
    await update(ref(database), updates)
  }

  const clearAll = async () => {
    if (!database || !adminUid || !targetId || !confirm("Clear all notifications?")) return
    await remove(ref(database, `Institutes/${adminUid}/notifications/${targetId}`))
  }

  const handleLogout = async () => {
    localStorage.removeItem('staff_session')
    localStorage.removeItem('branch_session')
    localStorage.removeItem('student_session')
    if (auth) await signOut(auth)
    
    if (pathname.startsWith('/staff')) router.push("/staff/login")
    else if (pathname.startsWith('/branch')) router.push("/branch/login")
    else router.push("/student/login")
  }

  const handleOpenWebsite = () => {
    const target = slug || adminUid
    if (target) window.open(`/`, '_blank')
  }

  const menuItems = useMemo(() => {
    if (pathname.startsWith('/staff')) return staffMenuConfig
    if (pathname.startsWith('/branch')) return branchMenu
    return studentMenu
  }, [pathname])

  const initial = displayName.charAt(0).toUpperCase()
  const chatHref = pathname.startsWith('/staff') ? '/staff/chat' : pathname.startsWith('/student') ? '/student/chat' : pathname.startsWith('/branch') ? '/branch/chat' : '/chat'

  return (
    <header className="h-20 bg-white border-b border-zinc-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 font-public-sans text-black">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-zinc-500 rounded-xl">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-none bg-white">
            <SheetHeader className="h-20 px-8 flex flex-row items-center gap-3 border-b border-zinc-50 space-y-0 text-left">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-primary shadow-inner font-bold">
                {initial}
              </div>
              <SheetTitle className="text-lg font-black text-zinc-800 uppercase tracking-tight truncate">
                {displayName}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)] p-4">
              <nav className="space-y-1 pb-20">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isOpen = openMenu === item.id;

                  if (hasSubItems) {
                    return (
                      <Collapsible key={item.id} open={isOpen} onOpenChange={(o) => setOpenMenu(o ? item.id : null)}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all border-none bg-transparent">
                            <Icon className={cn("w-5 h-5", item.color || "text-zinc-400")} />
                            <span className="flex-1 text-left uppercase tracking-tight">{item.nameKey.replace('_', ' ')}</span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-12 space-y-1 mt-1">
                          {item.subItems?.map((sub) => (
                            <Link 
                              key={sub.id} 
                              href={sub.href} 
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-2 text-sm text-zinc-500 hover:text-primary font-medium"
                            >
                              {sub.nameKey.replace('_', ' ')}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      onClick={(e) => {
                        if (item.id === 'logout') {
                          e.preventDefault();
                          handleLogout();
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all",
                        item.id === 'logout' ? "text-rose-500 hover:bg-rose-50" : "text-zinc-700"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", item.color || "text-zinc-400")} />
                      <span className="uppercase tracking-tight">{item.nameKey.replace('_', ' ')}</span>
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="hidden sm:flex px-0 py-2 min-h-[44px] items-center justify-start">
          {currentDate ? (
            <span className="text-sm md:text-base font-black text-zinc-800 tracking-[0.1em] font-headline">
              {currentDate}
            </span>
          ) : (
            <Skeleton className="h-5 w-32 bg-zinc-200/50" />
          )}
        </div>
        
        {currentPlan && (
          <Badge className="hidden md:flex bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> {currentPlan}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={handleOpenWebsite}
            className="p-2 md:p-2.5 text-emerald-500 hover:text-emerald-600 transition-all bg-emerald-50 rounded-xl group relative border-none outline-none"
            title="View Public Website"
          >
            <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <Link href={chatHref} className="p-2 md:p-2.5 text-blue-500 hover:text-blue-600 transition-all bg-blue-50 rounded-xl group relative border-none outline-none">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 md:p-2.5 text-zinc-400 hover:text-primary transition-colors relative bg-zinc-50 rounded-xl outline-none border-none">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-2xl mr-4 md:mr-8 mt-4">
              <div className="bg-primary p-6 text-white flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Alert Center</h4>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="p-1 hover:bg-white/10 rounded border-none bg-transparent text-white"><Check className="w-4 h-4" /></button>
                  <button onClick={clearAll} className="p-1 hover:bg-white/10 rounded border-none bg-transparent text-white"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <ScrollArea className="h-[350px]">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-zinc-50">
                    {notifications.map((n) => (
                      <div key={n.id} className={cn("p-5 flex gap-4 hover:bg-zinc-50 transition-colors", !n.read && "bg-primary/5")}>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <Info className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-zinc-800 uppercase leading-none">{n.title}</h5>
                          <p className="text-[11px] text-zinc-500 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] font-bold text-zinc-300 uppercase mt-1">{n.timestamp ? format(new Date(n.timestamp), "p") : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-2 opacity-20">
                    <Bell className="w-8 h-8" />
                    <p className="text-xs font-black uppercase tracking-widest">No Alerts</p>
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 bg-primary pl-2 pr-4 py-1.5 rounded-full shadow-lg shadow-primary/10 border-none group cursor-pointer transition-all outline-none">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-black text-xs shadow-sm uppercase">
                {initial}
              </div>
              <span className="hidden md:block text-[11px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
                {displayName.split(' ')[0]}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-[24px] border-zinc-100 p-2 shadow-xl" align="end">
            <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer focus:bg-blue-50">
              <Link href={isStaffPortal ? "/staff/profile" : "/student/profile"} className="flex items-center gap-3">
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
