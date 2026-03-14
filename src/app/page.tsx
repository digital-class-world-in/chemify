
"use client"

import { useState, useEffect, useMemo } from "react"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { OnboardingPopup } from "@/components/onboarding/plan-popup"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  Wallet, 
  UserCheck, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  Monitor, 
  Sparkles, 
  Globe, 
  UserPlus, 
  FileText, 
  Megaphone, 
  Award, 
  ClipboardList, 
  Receipt, 
  MapPin, 
  Video, 
  ShieldCheck, 
  Cake, 
  LayoutGrid,
  Search,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  Store,
  BookOpen,
  IdCard,
  Tag,
  Calendar,
  Eye
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts"
import { cn } from "@/lib/utils"
import { useFirebase, useUser, useTranslation } from "@/firebase"
import { ref, onValue, off, increment, update as dbUpdate, get } from "firebase/database"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BirthdayList } from "@/components/dashboard/birthday-list"
import { cloneElement } from "react"
import { useRouter } from "next/navigation"

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const CHART_COLORS = ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#f97316', '#6366f1', '#d946ef']

export default function DashboardPage() {
  const router = useRouter()
  const { database } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { resolvedId, isLoading: isIdLoading } = useResolvedId()
  const { t } = useTranslation()
  
  const [isErp, setIsErp] = useState<boolean | null>(null)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [profile, setProfile] = useState<any>(null)
  const [showPlanPopup, setShowPlanPopup] = useState(false)
  const [selectedYear, setSelectedYear] = useState("2026")
  
  const [stats, setStats] = useState({
    totalEnquiry: 0,
    totalAdmission: 0,
    totalStaff: 0,
    totalBranch: 0,
    totalFee: 0,
    collectedFee: 0,
    income: 0,
    expenses: 0,
    websiteVisitors: 0,
    todayCollection: 0
  })

  const [admissions, setAdmissions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [allExpenses, setAllExpenses] = useState<any[]>([])
  const [attendanceStats, setAttendanceStats] = useState({
    studentPresentToday: 0,
    staffPresentToday: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  const getSafeKey = (val: string) => val.replace(/\./g, '_')

  useEffect(() => {
    const checkDomainAndRouting = async () => {
      if (isUserLoading) return
      
      // If user is already logged in, immediately allow ERP mode
      if (user) {
        setIsErp(true)
        return
      }

      if (!database) return
      
      const hostname = window.location.hostname
      const erpDomains = ['erp.digitalclassworld.in', 'localhost']
      const isCentralHub = erpDomains.some(d => hostname === d || hostname.includes('webstation-'))
      
      if (!isCentralHub) {
        setIsErp(false)
        let adminUid = null
        const fullHostname = hostname.replace('www.', '')
        const safeKey = getSafeKey(fullHostname)
        
        const domainRef = ref(database, `Slugs/${safeKey}`)
        const domainSnap = await get(domainRef)

        if (domainSnap.exists()) {
          adminUid = domainSnap.val()
        } else {
          const slugCandidate = fullHostname.split('.')[0]
          const slugRef = ref(database, `Slugs/${slugCandidate}`)
          const slugSnap = await get(slugRef)
          if (slugSnap.exists()) adminUid = slugSnap.val()
        }
        
        if (adminUid) {
          const profileRef = ref(database, `Institutes/${adminUid}/profile`)
          const profileSnap = await get(profileRef)
          
          if (profileSnap.exists()) {
            const data = profileSnap.val()
            const plan = data.currentPlan?.toLowerCase() || ""
            
            // Logic: White Label/Enterprise see website first. Others see login.
            // Override by explicit toggle if exists.
            let isWebsiteFirst = plan.includes("white label") || plan.includes("enterprise")
            if (data.isWebsiteFirst !== undefined) {
              isWebsiteFirst = data.isWebsiteFirst
            }

            if (isWebsiteFirst) {
              router.replace(`/sites/${data.slug || adminUid}`)
            } else {
              router.replace("/login")
            }
          } else {
            router.replace("/login")
          }
        } else {
          router.replace("/login")
        }
      } else {
        setIsErp(true)
      }
    }

    checkDomainAndRouting()
  }, [database, router, user, isUserLoading])

  useEffect(() => {
    if (!database || !resolvedId || !user || isErp !== true) return

    const rootPath = `Institutes/${resolvedId}`
    
    const unsubProfile = onValue(ref(database, `${rootPath}/profile`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setProfile(data)
        setInstituteName(data.instituteName || "Your Institute")
        setShowPlanPopup(data.plan_selected === false || data.plan_selected === undefined)
      } else {
        setShowPlanPopup(true)
      }
    })

    const unsubEnq = onValue(ref(database, `${rootPath}/enquiries`), (s) => setStats(prev => ({ ...prev, totalEnquiry: Object.keys(s.val() || {}).length })))
    
    const unsubAdm = onValue(ref(database, `${rootPath}/admissions`), (s) => {
      const data = s.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setAdmissions(list)
      const totalFee = list.reduce((sum, item) => sum + (Number(item.netFees) || 0), 0)
      setStats(prev => ({ ...prev, totalAdmission: list.length, totalFee }))
    })

    const unsubVis = onValue(ref(database, `${rootPath}/analytics/websiteVisitors`), (snapshot) => {
      if (snapshot.exists()) setStats(prev => ({ ...prev, websiteVisitors: snapshot.val() }))
    })

    const unsubEmp = onValue(ref(database, `${rootPath}/employees`), (s) => setStats(prev => ({ ...prev, totalStaff: Object.keys(s.val() || {}).length })))
    const unsubBr = onValue(ref(database, `${rootPath}/branches`), (s) => setStats(prev => ({ ...prev, totalBranch: Object.keys(s.val() || {}).length })))
    
    const unsubFees = onValue(ref(database, `${rootPath}/fees`), (s) => {
      const list = Object.values(s.val() || {}) as any[]
      setPayments(list)
      const totalCollected = list.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const todayColl = list.filter(p => p.date === todayStr).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      setStats(prev => ({ ...prev, collectedFee: totalCollected, todayCollection: todayColl }))
    })

    const unsubExp = onValue(ref(database, `${rootPath}/expenses`), (s) => {
      const list = Object.values(s.val() || {}) as any[]
      setAllExpenses(list)
      setStats(prev => ({ ...prev, expenses: list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) }))
    })

    const unsubAtt = onValue(ref(database, `${rootPath}/attendance`), (snapshot) => {
      const data = snapshot.val() || {}
      let sPToday = 0, stPToday = 0
      if (data.Student && data.Student[todayStr]) {
        Object.values(data.Student[todayStr]).forEach((batch: any) => {
          Object.values(batch).forEach((record: any) => { if (record.status === 'Present') sPToday++ })
        })
      }
      if (data.Staff && data.Staff[todayStr]) {
        Object.values(data.Staff[todayStr]).forEach((record: any) => { if (record.status === 'Present') stPToday++ })
      }
      setAttendanceStats({ studentPresentToday: sPToday, staffPresentToday: stPToday })
      setIsLoading(false)
    })

    return () => {
      unsubProfile(); unsubEnq(); unsubAdm(); unsubVis(); unsubEmp(); unsubBr(); unsubFees(); unsubExp(); unsubAtt();
    }
  }, [database, resolvedId, todayStr, isErp, user])

  const analyticsData = useMemo(() => {
    const monthsData = SHORT_MONTHS.map(m => ({ name: m, income: 0, expense: 0, profit: 0 }))
    payments.forEach(p => {
      if (p.date) {
        const date = parseISO(p.date)
        if (date.getFullYear().toString() === selectedYear) {
          const mIdx = date.getMonth();
          if (monthsData[mIdx]) monthsData[mIdx].income += (Number(p.amount) || 0);
        }
      }
    })
    allExpenses.forEach(e => {
      if (e.date) {
        const date = parseISO(e.date)
        if (date.getFullYear().toString() === selectedYear) {
          const mIdx = date.getMonth();
          if (monthsData[mIdx]) monthsData[mIdx].expense += (Number(e.amount) || 0);
        }
      }
    })
    monthsData.forEach(m => { m.profit = m.income - m.expense })
    return monthsData
  }, [payments, allExpenses, selectedYear])

  const totalsForYear = useMemo(() => {
    const inc = analyticsData.reduce((s, m) => s + m.income, 0)
    const exp = analyticsData.reduce((s, m) => s + m.expense, 0)
    return { inc, exp, pro: inc - exp }
  }, [analyticsData])

  if (isErp === false) return null;
  
  if (isUserLoading || isLoading || isIdLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-public-sans text-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-zinc-300 uppercase tracking-[0.3em] animate-pulse">Syncing Node Hub...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex font-public-sans relative">
      {showPlanPopup && <OnboardingPopup instituteName={instituteName} />}
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 w-full font-public-sans">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-10">
              <WelcomeBanner />
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-[15px] font-medium text-black tracking-wide font-public-sans uppercase">Statistics Overview</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SmallStatCard title="Total Inquiry" value={stats.totalEnquiry} icon={<div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Search className="w-6 h-6" /></div>} href="/front-office/admission-enquiry" />
                  <SmallStatCard title="Total Admission" value={stats.totalAdmission} icon={<div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Building2 className="w-6 h-6" /></div>} href="/student-information/admission" />
                  <SmallStatCard title="Website Visitors" value={stats.websiteVisitors} icon={<div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Monitor className="w-6 h-6" /></div>} href="/website-management/inquiry" />
                  <SmallStatCard 
                    title="Today Fee Collection" 
                    value={stats.todayCollection} 
                    isAmount 
                    icon={<div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><DollarSign className="w-6 h-6" /></div>} 
                    href="/fees-collections"
                  />
                  <SmallStatCard title="Today Present Student" value={attendanceStats.studentPresentToday} icon={<div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white"><GraduationCap className="w-6 h-6" /></div>} href="/attendance" />
                  <SmallStatCard title="Today Present Employee" value={attendanceStats.staffPresentToday} icon={<div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><IdCard className="w-6 h-6" /></div>} href="/hr/attendance" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-6 bg-[#1e3a8a] rounded-full" />
                  <h3 className="text-[15px] font-medium text-black tracking-wide font-public-sans uppercase">Financial Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard title="Total Fees" value={stats.totalFee} isAmount icon={<BookOpen className="w-8 h-8 text-blue-500" />} href="/fees-collections" />
                  <MetricCard title="Collected Fees" value={stats.collectedFee} isAmount icon={<UserCheck className="w-8 h-8 text-emerald-500" />} href="/fees-collections?status=paid" />
                  <MetricCard title="Due Fees" value={stats.totalFee - stats.collectedFee} isAmount icon={<Tag className="w-8 h-8 text-rose-500" />} href="/fees-collections?status=due" />
                </div>
              </div>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
                <div className="p-8 border-b border-zinc-50 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1e3a8a] shadow-inner"><Wallet className="w-6 h-6" /></div>
                    <div><p className="text-[15px] font-medium text-black font-public-sans leading-none mb-1">Total Fee Collection</p><h4 className="text-[20px] font-black text-black leading-none">₹{totalsForYear.inc.toLocaleString()}</h4></div>
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-10 w-32 rounded-xl border-zinc-100 bg-zinc-50 font-bold text-zinc-600 text-[11px] uppercase tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="2024">Year 2024</SelectItem><SelectItem value="2025">Year 2025</SelectItem><SelectItem value="2026">Year 2026</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="p-10">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="income" radius={[4, 4, 0, 0]} barSize={45}>
                          {analyticsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                          <LabelList dataKey="income" position="top" formatter={(v: number) => `₹${v.toLocaleString()}`} style={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                  <h4 className="text-[15px] font-medium text-black tracking-wide font-public-sans uppercase">Quick Links</h4>
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center"><LayoutGrid className="w-4 h-4 text-zinc-300" /></div>
                </div>
                <div className="p-8 grid grid-cols-3 gap-y-10 gap-x-4">
                  <QuickLinkItem href="/front-office/admission-enquiry" label="Enquiry" icon={<ClipboardList />} color="bg-rose-50 text-rose-500" />
                  <QuickLinkItem href="/website-management" label="Website" icon={<Globe />} color="bg-emerald-50 text-emerald-600" />
                  <QuickLinkItem href="/branch-management" label="Branches" icon={<MapPin />} color="bg-indigo-50 text-indigo-600" />
                  <QuickLinkItem href="/live-classes" label="Live Class" icon={<Video />} color="bg-rose-50 text-rose-500" />
                  <QuickLinkItem href="/student-information/admission" label="Admission" icon={<UserPlus />} color="bg-amber-50 text-amber-600" />
                  <QuickLinkItem href="/fees-collections" label="Fees" icon={<Wallet />} color="bg-emerald-50 text-emerald-600" />
                  <QuickLinkItem href="/attendance" label="Attendance" icon={<UserCheck />} color="bg-teal-50 text-teal-600" />
                  <QuickLinkItem href="/examination/online-exam" label="Online Exam" icon={<FileText />} color="bg-sky-50 text-sky-600" />
                  <QuickLinkItem href="/hr/directory" label="Staff" icon={<Users />} color="bg-orange-50 text-orange-600" />
                  <QuickLinkItem href="/accounts" label="Accounts" icon={<Receipt />} color="bg-zinc-50 text-zinc-600" />
                  <QuickLinkItem href="/announcement" label="Broadcast" icon={<Megaphone />} color="bg-pink-50 text-pink-600" />
                  <QuickLinkItem href="/marketplace-listing" label="Listing" icon={<Store />} color="bg-violet-50 text-violet-600" />
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="p-6 border-b border-zinc-50 bg-zinc-50/20"><h4 className="text-[15px] font-medium text-black uppercase tracking-wide">Profit & Loss Analysis</h4></div>
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1e3a8a] shadow-inner"><Wallet className="w-5 h-5" /></div>
                      <div><p className="text-[13px] font-medium text-zinc-400 leading-none mb-1">Net Outcome</p><h4 className={cn("text-[20px] font-black leading-none", totalsForYear.pro >= 0 ? "text-emerald-600" : "text-rose-600")}>{totalsForYear.pro >= 0 ? `+₹${totalsForYear.pro.toLocaleString()}` : `-₹${Math.abs(totalsForYear.pro).toLocaleString()}`}</h4></div>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="profit" radius={[3, 3, 0, 0]} barSize={16}>
                          {analyticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#10b981" : "#ef4444"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="p-6 border-b border-zinc-50 flex items-center justify-between"><h4 className="text-[15px] font-medium text-black tracking-wide">Upcoming Birthdays</h4><Cake className="w-4 h-4 text-rose-400" /></div>
                <CardContent className="p-8 space-y-6">
                  <BirthdayList />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SmallStatCard({ title, value, icon, isAmount = false, href }: any) {
  return (
    <Card className="border border-zinc-100 shadow-sm rounded-2xl bg-white p-5 group hover:shadow-md transition-all overflow-hidden cursor-pointer relative">
      <Link href={href || '#'}>
        <div className="flex flex-col h-full gap-4">
          <p className="text-[15px] font-medium text-black truncate">{title}</p>
          <div className="flex items-center gap-3">
            <div className="shrink-0 transition-transform group-hover:scale-110">{icon}</div>
            <h4 className="text-[20px] text-black leading-none font-medium">{isAmount && <span className="mr-0.5 text-sm font-bold">₹</span>}{value.toLocaleString()}</h4>
          </div>
        </div>
      </Link>
    </Card>
  )
}

function MetricCard({ title, value, icon, isAmount = false, href }: any) {
  return (
    <Card className="border border-zinc-100 shadow-sm rounded-[24px] bg-white p-6 group hover:shadow-md transition-all relative cursor-pointer overflow-hidden">
      <Link href={href || '#'}>
        <div className="flex items-center justify-between mb-6"><p className="text-[15px] font-medium text-black tracking-tight">{title}</p><div className="h-10 w-10 rounded-xl text-black flex items-center justify-center"><Eye className="w-6 h-6" /></div></div>
        <div className="flex items-center gap-4 pt-2">
          <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
          <h4 className="text-[20px] font-medium tracking-tighter text-black">{isAmount && <span className="mr-1 text-black font-bold">₹</span>}{Number(value).toLocaleString()}</h4>
        </div>
      </Link>
    </Card>
  )
}

function QuickLinkItem({ href, label, icon, color }: any) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 group">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all group-hover:scale-110 active:scale-97 group-hover:shadow-md", color)}>
        {cloneElement(icon as any, { className: "w-6 h-6" })}
      </div>
      <span className="text-[11px] font-bold text-zinc-500 tracking-tight text-center leading-tight uppercase group-hover:text-black transition-colors">{label}</span>
    </Link>
  )
}  
