
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
  ShieldCheck,
  Menu,
  X,
  ChevronDown
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off, remove, update } from "firebase/database"
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "firebase/auth"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { sidebarMenu } from "./sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, auth, database } = useFirebase()
  const { resolvedId, isLoading: idLoading } = useResolvedId()
  
  const [profile, setProfile] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState<string>("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    setCurrentDate(format(new Date(), "dd MMMM yyyy"))
  }, [])

  useEffect(() => {
    if (!database || !resolvedId) return
    
    const profileRef = ref(database, `Institutes/${resolvedId}/profile`)
    const unsubProfile = onValue(profileRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setProfile(data)
    })

    const notifRef = ref(database, `Institutes/${resolvedId}/notifications/admin`)
    const unsubNotif = onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {}
      setNotifications(Object.keys(data).map(k => ({ ...data[k], id: k })).reverse())
    })

    return () => {
      off(profileRef)
      off(notifRef)
    }
  }, [database, resolvedId])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const markAllRead = async () => {
    if (!database || !resolvedId) return
    const updates: any = {}
    notifications.forEach(n => {
      if (!n.read) updates[`Institutes/${resolvedId}/notifications/admin/${n.id}/read`] = true
    })
    await update(ref(database), updates)
  }

  const clearAll = async () => {
    if (!database || !resolvedId || !confirm("Clear all notifications?")) return
    await remove(ref(database, `Institutes/${resolvedId}/notifications/admin`))
  }

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/login")
    }
  }

  const handleOpenWebsite = () => {
    const target = profile?.slug || resolvedId
    if (target) {
      window.open(`/`, '_blank')
    }
  }

  const instituteName = profile?.instituteName || "Management Portal"
  const firstWord = instituteName.split(' ')[0]
  const initial = firstWord.charAt(0).toUpperCase()

  return (
    <header className="h-20 bg-white border-b border-zinc-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 font-public-sans text-black">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-zinc-500 rounded-xl">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-none bg-white">
            <SheetHeader className="h-20 px-8 flex flex-row items-center gap-3 border-b border-zinc-50 space-y-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-primary shadow-inner font-bold">
                {initial}
              </div>
              <SheetTitle className="text-lg font-black text-zinc-800 uppercase tracking-tight truncate">
                {instituteName}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)] p-4">
              <nav className="space-y-1 pb-20">
                {sidebarMenu.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isOpen = openMenu === item.id;

                  if (hasSubItems) {
                    return (
                      <Collapsible key={item.nameKey} open={isOpen} onOpenChange={(o) => setOpenMenu(o ? item.id : null)}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all border-none bg-transparent">
                            <Icon className={cn("w-5 h-5", item.color)} />
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
                      <Icon className={cn("w-5 h-5", item.color)} />
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
            <span className="text-sm md:text-base font-black text-zinc-800 tracking-[0.1em] font-headline uppercase">
              {currentDate}
            </span>
          ) : (
            <Skeleton className="h-5 w-32 bg-zinc-200/50" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={handleOpenWebsite}
            className="p-2 md:p-2.5 text-emerald-500 hover:text-emerald-600 transition-all bg-emerald-50 rounded-xl group relative border-none outline-none"
            title="Live Website Preview"
          >
            <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <Link href="/chat" className="p-2 md:p-2.5 text-blue-500 hover:text-blue-600 transition-all bg-blue-50 rounded-xl group relative border-none outline-none">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 md:p-2.5 text-amber-500 relative hover:text-amber-600 transition-all bg-amber-50 rounded-xl group border-none outline-none">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-2xl mr-4 md:mr-8 mt-4">
              <div className="bg-[#1e3a8a] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h4>
                </div>
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
            <div className="flex items-center gap-3 bg-zinc-50 pl-2 pr-4 py-1.5 rounded-full border border-zinc-100 shadow-sm cursor-pointer hover:bg-zinc-100 transition-all outline-none">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm uppercase">
                {initial}
              </div>
              <span className="hidden md:block text-sm font-bold text-zinc-700 font-headline uppercase">{firstWord}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-[24px] border-zinc-100 p-2 shadow-xl" align="end">
            <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer focus:bg-blue-50">
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
    </header>
  )
}
