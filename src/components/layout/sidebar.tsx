
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  LayoutGrid, 
  Video,
  ClipboardList,
  UserPlus,
  Wallet,
  UserCheck,
  FileText,
  FileVideo,
  Library,
  Award,
  BellRing,
  Settings,
  Settings2,
  Lock,
  CalendarDays,
  Globe,
  Trash2,
  Info,
  Monitor,
  AlertCircle,
  Mail,
  Clock,
  Newspaper,
  GraduationCap,
  Receipt,
  LogOut,
  ChevronDown,
  Layers,
  MapPin,
  Users,
  Search,
  CreditCard,
  Database,
  Printer,
  Package,
  Megaphone,
  TrendingUp,
  Store
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useUser, useFirebase, useAuth, useTranslation } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { signOut } from "firebase/auth"
import Image from "next/image"

interface SubItem {
  id: string
  nameKey: string
  href: string
  icon: any
  color?: string
}

interface MenuItem {
  id: string
  nameKey: string
  href?: string
  icon: any
  color?: string
  subItems?: SubItem[]
}

const sidebarMenu: MenuItem[] = [
  { id: 'dashboard', nameKey: 'dashboard', href: '/', icon: LayoutGrid, color: "text-blue-500" },
  { 
    id: 'website_mgmt', 
    nameKey: 'website_mgmt', 
    icon: Globe,
    color: "text-emerald-500",
    subItems: [
      { id: 'homepage_setup', nameKey: 'homepage_setup', href: '/website-management', icon: Monitor, color: "text-emerald-500" },
      { id: 'about_us', nameKey: 'about_us', href: '/website-management/about-us', icon: Info, color: "text-emerald-500" },
      { id: 'infra_setup', nameKey: 'infra_setup', href: '/website-management/infrastructure', icon: Layers, color: "text-emerald-500" },
      { id: 'courses_setup', nameKey: 'courses_setup', href: '/website-management/courses', icon: GraduationCap, color: "text-emerald-500" },
      { id: 'blog_seo', nameKey: 'blog_seo', href: '/website-management/blog-seo', icon: Newspaper, color: "text-emerald-500" },
      { id: 'website_inquiry', nameKey: 'website_inquiry', href: '/website-management/inquiry', icon: Search, color: "text-emerald-500" },
      { id: 'contact_seo', nameKey: 'contact_seo', href: '/website-management/contact', icon: MapPin, color: "text-emerald-500" },
    ]
  },
  { id: 'marketplace_listing', nameKey: 'marketplace_listing', href: '/marketplace-listing', icon: Store, color: "text-indigo-600" },
  { 
    id: 'branch_mgmt', 
    nameKey: 'branch_mgmt', 
    icon: MapPin,
    color: "text-purple-500",
    subItems: [
      { id: 'manage_branches', nameKey: 'manage_branches', href: '/branch-management', icon: Settings2, color: "text-purple-500" },
      { id: 'branch_login', nameKey: 'branch_login', href: '/branch/login', icon: Lock, color: "text-purple-500" },
    ]
  },
  { id: 'batch_management', nameKey: 'batch_management', href: '/batch-management', icon: Layers, color: "text-indigo-500" },
  { id: 'live_classes', nameKey: 'live_classes', href: '/live-classes', icon: Video, color: "text-rose-500" },
  { 
    id: 'front_office', 
    nameKey: 'front_office', 
    icon: ClipboardList,
    color: "text-amber-500",
    subItems: [
      { id: 'admission_enquiry', nameKey: 'admission_enquiry', href: '/front-office/admission-enquiry', icon: Search, color: "text-amber-500" },
      { id: 'visitor_books', nameKey: 'visitor_books', href: '/front-office/visitor-books', icon: UserCheck, color: "text-amber-500" },
      { id: 'phone_calls_logs', nameKey: 'phone_calls_logs', href: '/front-office/phone-calls-logs', icon: Clock, color: "text-amber-500" },
      { id: 'complains', nameKey: 'complains', href: '/front-office/complains', icon: AlertCircle, color: "text-amber-500" },
      { id: 'postal_service', nameKey: 'postal_service', href: '/front-office/postal-service', icon: Mail, color: "text-amber-500" },
    ]
  },
  {
    id: 'student_info',
    nameKey: 'student_info',
    icon: UserPlus,
    color: "text-teal-500",
    subItems: [
      { id: 'student_admission', nameKey: 'student_admission', href: '/student-information/admission', icon: GraduationCap, color: "text-teal-500" },
      { id: 'leave_request_student', nameKey: 'leave_request', href: '/student-information/leave-request', icon: CalendarDays, color: "text-teal-500" },
      { id: 'document_management', nameKey: 'document_management', href: '/student-information/document-management', icon: FileText, color: "text-teal-500" },
      { id: 'student_id_cards', nameKey: 'student_id_cards', href: '/student-information/id-cards', icon: CreditCard, color: "text-teal-500" },
      { id: 'student_login', nameKey: 'student_login', href: '/student/login', icon: Lock, color: "text-teal-500" },
    ]
  },
  { id: 'fees_collections', nameKey: 'fees_collections', href: '/fees-collections', icon: Wallet, color: "text-emerald-600" },
  { id: 'attendance', nameKey: 'attendance', href: '/attendance', icon: UserCheck, color: "text-green-500" },
  { 
    id: 'examination', 
    nameKey: 'examination', 
    icon: FileText,
    color: "text-blue-600",
    subItems: [
      { id: 'online_exam', nameKey: 'online_exam', href: '/examination/online-exam', icon: Monitor, color: "text-blue-600" },
      { id: 'offline_exam', nameKey: 'offline_exam', href: '/examination/offline-exam', icon: Printer, color: "text-blue-600" },
      { id: 'offline_marks', nameKey: 'offline_marks', href: '/examination/offline-marks', icon: FileText, color: "text-blue-600" },
    ]
  },
  { id: 'marksheet', nameKey: 'marksheet', href: '/marksheet', icon: GraduationCap, color: "text-indigo-600" },
  { id: 'e_content', nameKey: 'e_content', href: '/e-content', icon: FileVideo, color: "text-rose-600" },
  { id: 'library_management', nameKey: 'library_management', href: '/library-management', icon: Library, color: "text-purple-600" },
  { id: 'inventory', nameKey: 'inventory', href: '/inventory', icon: Package, color: "text-amber-600" },
  { 
    id: 'hr', 
    nameKey: 'human_resources', 
    icon: Users, 
    color: "text-blue-500",
    subItems: [
      { id: 'employee_directory', nameKey: 'employee_directory', href: '/hr/directory', icon: Users, color: "text-blue-500" },
      { id: 'employee_id_cards', nameKey: 'employee_id_cards', href: '/hr/id-cards', icon: CreditCard, color: "text-blue-500" },
      { id: 'staff_attendance', nameKey: 'staff_attendance', href: '/hr/attendance', icon: UserCheck, color: "text-blue-500" },
      { id: 'staff_performance', nameKey: 'staff_performance', href: '/hr/performance', icon: TrendingUp, color: "text-blue-500" },
      { id: 'leave_request_hr', nameKey: 'leave_request', href: '/hr/leave', icon: CalendarDays, color: "text-blue-500" },
      { id: 'payroll', nameKey: 'payroll', href: '/hr/payroll', icon: Wallet, color: "text-blue-500" },
      { id: 'staff_login', nameKey: 'staff_login', href: '/staff/login', icon: Lock, color: "text-blue-500" },
    ]
  },
  { id: 'account_management', nameKey: 'account_management', href: '/accounts', icon: Receipt, color: "text-zinc-600" },
  { id: 'announcement', nameKey: 'announcement', href: '/announcement', icon: Megaphone, color: "text-pink-500" },
  { id: 'certificates', nameKey: 'certificates', href: '/certificates', icon: Award, color: "text-violet-500" },
  { id: 'notification', nameKey: 'notification', href: '/notification', icon: BellRing, color: "text-amber-500" },
  { id: 'billing', nameKey: 'billing', href: '/billing', icon: CreditCard, color: "text-indigo-500" },
  { id: 'payment_setting', nameKey: 'payment_setting', href: '/payment-setting', icon: Settings2, color: "text-cyan-500" },
  { id: 'system_setting', nameKey: 'system_setting', href: '/system-setting', icon: Settings, color: "text-zinc-500" },
  { id: 'holiday_calendar', nameKey: 'holiday_calendar', href: '/holiday-calendar', icon: CalendarDays, color: "text-blue-500" },
  { id: 'backup', nameKey: 'backup', href: '/backup', icon: Database, color: "text-indigo-500" },
  { id: 'trash', nameKey: 'trash', href: '/trash', icon: Trash2, color: "text-rose-500" },
  { id: 'logout', nameKey: 'logout', href: '#', icon: LogOut, color: "text-rose-500" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [searchQuery, setSearchTerm] = useState("")
  const { user } = useUser()
  const { database } = useFirebase()
  const auth = useAuth()
  const { t } = useTranslation()
  
  const [profile, setProfile] = useState<any>(null)
  const [moduleAccess, setModuleAccess] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Real-time Counts
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!database || !user?.uid) return
    const rootPath = `Institutes/${user.uid}`
    
    onValue(ref(database, `${rootPath}/profile`), (snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.val())
    })

    onValue(ref(database, `${rootPath}/moduleAccess`), (snapshot) => {
      setModuleAccess(snapshot.val() || {})
      setIsLoading(false)
    })

    // Real-time count listeners
    const collectionsToCount = [
      { key: 'student_admission', path: 'admissions' },
      { key: 'employee_directory', path: 'employees' },
      { key: 'manage_branches', path: 'branches' },
      { key: 'batch_management', path: 'batches' },
      { key: 'live_classes', path: 'live-classes' },
      { key: 'announcement', path: 'announcements' },
      { key: 'admission_enquiry', path: 'enquiries' },
      { key: 'visitor_books', path: 'visitors' },
      { key: 'phone_calls_logs', path: 'call-logs' },
      { key: 'complains', path: 'complains' }
    ]

    collectionsToCount.forEach(({ key, path }) => {
      onValue(ref(database, `${rootPath}/${path}`), (snapshot) => {
        setCounts(prev => ({ ...prev, [key]: Object.keys(snapshot.val() || {}).length }))
      })
    })

  }, [database, user?.uid])

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  }

  const capitalize = (str: string) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const transformTitle = (title: string) => {
    if (!settings.capitalizeTitles) return title
    return title.split(' ').map(capitalize).join(' ')
  }

  // Settings lookup
  const settings = profile || { capitalizeTitles: false, showItemCounts: false }

  const filteredMenu = useMemo(() => {
    return sidebarMenu.filter(item => {
      if (item.id === 'logout' || item.id === 'dashboard') return true
      const access = moduleAccess[item.id]
      if (access === false) return false
      if (typeof access === 'object' && access.enabled === false) return false
      if (!searchQuery) return true
      const lowerQuery = searchQuery.toLowerCase()
      const matchesMain = t(item.nameKey).toLowerCase().includes(lowerQuery)
      const matchesSub = item.subItems?.some(sub => t(sub.nameKey).toLowerCase().includes(lowerQuery))
      return matchesMain || matchesSub
    }).map(item => {
      if (item.subItems) {
        const access = moduleAccess[item.id]
        return {
          ...item,
          subItems: item.subItems.filter(sub => {
            if (typeof access === 'object' && access.submodules?.[sub.id] === false) return false
            if (!searchQuery) return true
            return t(sub.nameKey).toLowerCase().includes(searchQuery.toLowerCase())
          })
        }
      }
      return item
    });
  }, [searchQuery, moduleAccess, t]);

  const activeStyle = "bg-white border border-zinc-200 text-black shadow-sm rounded-2xl font-bold";

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-[300px] lg:fixed lg:inset-y-0 bg-white z-50 font-public-sans border-r border-zinc-100 shadow-sm">
      <div className="h-20 flex items-center justify-center px-8 border-b border-zinc-50">
        {profile?.logoUrl ? (
          <div className="relative w-full h-12">
            <Image src={profile.logoUrl} alt="Logo" fill className="object-contain" priority />
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-10 h-10 min-w-[40px] bg-zinc-50 rounded-xl flex items-center justify-center text-primary shadow-inner font-bold text-lg">
              {isLoading ? <div className="w-6 h-6 rounded-full shimmer" /> : (profile?.instituteName || "D").charAt(0).toUpperCase()}
            </div>
            <span className={cn(
              "text-lg font-bold tracking-tight text-zinc-800 font-headline truncate uppercase text-black",
              settings.capitalizeTitles && "capitalize font-medium"
            )}>
              {transformTitle(profile?.instituteName || "Dashboard")}
            </span>
          </div>
        )}
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search Menu..." 
            value={searchQuery} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 h-10 bg-zinc-50 border-none rounded-xl text-[13px] font-normal shadow-none focus-visible:ring-0" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 scrollbar-none pb-8 pt-4">
        <nav className="space-y-0.5">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenu === item.nameKey || !!searchQuery;
            const isActiveParent = item.href === '/' ? pathname === '/' : (item.href && pathname === item.href);
            const isSubItemActive = item.subItems?.some(sub => {
              const [basePath] = sub.href.split('?');
              return pathname === basePath;
            });

            const currentActive = isActiveParent || isSubItemActive;
            const displayTitle = transformTitle(t(item.nameKey));

            if (hasSubItems) {
              return (
                <Collapsible key={item.nameKey} open={isOpen} onOpenChange={(o) => setOpenMenu(o ? item.nameKey : null)} className="w-full">
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center gap-4 px-5 py-2.5 rounded-xl text-[15px] font-normal transition-all",
                      currentActive ? activeStyle : "text-black hover:bg-zinc-50"
                    )}>
                      <Icon className={cn("w-5 h-5 shrink-0", currentActive ? "text-black" : (item.color || "text-black"))} />
                      <span className="flex-1 text-left font-medium text-black whitespace-nowrap">{displayTitle}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform text-black shrink-0", isOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-0.5">
                    {item.subItems?.map((sub) => {
                      const [basePath] = sub.href.split('?');
                      const isSubActive = pathname === basePath;
                      const subCount = counts[sub.id];

                      return (
                        <Link 
                          key={sub.id} 
                          href={sub.href} 
                          className={cn(
                            "flex items-center py-2 pl-14 pr-4 rounded-xl text-[15px] font-normal transition-all group",
                            isSubActive 
                              ? "text-black font-bold bg-zinc-50 border border-zinc-100" 
                              : "text-black hover:text-black hover:font-bold hover:bg-zinc-50"
                          )}
                        >
                          <sub.icon className={cn("w-5 h-5 mr-3 shrink-0", isSubActive ? "text-black" : (sub.color || "text-zinc-400 group-hover:text-zinc-500"))} />
                          <span className="flex-1 whitespace-nowrap">{transformTitle(t(sub.nameKey))}</span>
                          {settings.showItemCounts && subCount !== undefined && (
                            <Badge variant="secondary" className="ml-2 bg-zinc-50 text-zinc-400 border-none text-[9px] font-black">{subCount}</Badge>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            }
            
            const mainCount = counts[item.id];

            return (
              <button key={item.nameKey} onClick={item.nameKey === 'Logout' ? handleLogout : undefined} className={cn(
                "w-full flex items-center gap-4 px-5 py-2.5 rounded-xl text-[15px] font-normal transition-all",
                isActiveParent ? activeStyle : item.nameKey === 'Logout' ? "text-rose-500 hover:bg-rose-50" : "text-black hover:bg-zinc-50"
              )}>
                {item.nameKey === 'Logout' ? (
                  <div className="flex-1 flex items-center gap-4">
                    <Icon className="w-5 h-5 text-rose-500 shrink-0" />
                    <span className="flex-1 text-left font-bold text-rose-500 whitespace-nowrap">Logout</span>
                  </div>
                ) : (
                  <Link href={item.href || '#'} className="flex-1 flex items-center gap-4">
                    <Icon className={cn("w-5 h-5 shrink-0", isActiveParent ? "text-black" : (item.color || "text-black"))} />
                    <span className="flex-1 text-left font-medium text-black whitespace-nowrap">{displayTitle}</span>
                    {settings.showItemCounts && mainCount !== undefined && (
                      <Badge variant="secondary" className="ml-2 bg-zinc-50 text-zinc-400 border-none text-[9px] font-black">{mainCount}</Badge>
                    )}
                  </Link>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
