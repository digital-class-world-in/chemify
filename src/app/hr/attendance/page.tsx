"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle,
  History,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { usePathname } from "next/navigation"

export default function StaffAttendanceReportPage() {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/branch') || pathname.startsWith('/staff') || pathname.startsWith('/student')

  const { database } = useFirebase()
  const { user } = useUser()
  const [employees, setEmployees] = useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isLoading, setIsLoading] = useState(true)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!database || !user) return
    const rootPath = `Institutes/${user.uid}`
    
    onValue(ref(database, `${rootPath}/employees`), (snapshot) => {
      const data = snapshot.val()
      if (data) setEmployees(Object.keys(data).map(k => ({ ...data[k], id: k })))
      else setEmployees([])
    })

    onValue(ref(database, `${rootPath}/attendance/Staff`), (snapshot) => {
      setAttendanceLogs(snapshot.val() || {})
      setIsLoading(false)
    })
  }, [database, user])

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredEmployees.slice(start, start + itemsPerPage)
  }, [filteredEmployees, currentPage])

  const stats = useMemo(() => {
    const dailyData = attendanceLogs[selectedDate] || {}
    const present = Object.values(dailyData).filter((v: any) => v.status === 'Present').length
    return { total: employees.length, present }
  }, [attendanceLogs, selectedDate, employees])

  const content = (
    <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 font-headline uppercase tracking-tight">Staff Attendance ({filteredEmployees.length})</h2>
          <p className="text-sm text-zinc-500 font-medium">Daily presence tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48 h-11 rounded-xl bg-white border-zinc-200 uppercase text-xs font-bold" />
          <Button variant="outline" className="h-11 px-4 text-emerald-600 border-emerald-100 rounded-xl transition-none gap-2 font-bold text-xs"><FileSpreadsheet className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Staff" value={stats.total} icon={<Users className="text-blue-500" />} />
        <StatCard title="On Duty Today" value={stats.present} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Overall Attendance" value={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'} icon={<TrendingUp className="text-indigo-500" />} />
      </div>

      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-zinc-50"><div className="relative w-80"><Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" /><Input placeholder="Search employee..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-11 h-11 bg-zinc-50 border-none rounded-xl text-sm" /></div></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100">
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14 pl-8">SR NO.</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">Employee Name</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">Status</TableHead>
                <TableHead className="text-right pr-8 text-[13px] font-bold text-zinc-400 uppercase h-14">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map((emp, idx) => {
                const daily = (attendanceLogs[selectedDate] || {})[emp.id]
                return (
                  <TableRow key={emp.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-none">
                    <TableCell className="text-base font-medium text-zinc-400 pl-8">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                    <TableCell><span className="text-base font-bold text-zinc-800 uppercase">{emp.firstName} {emp.lastName}</span></TableCell>
                    <TableCell><Badge className={cn("rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase border-none shadow-none", daily?.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{daily?.status || 'Not Logged'}</Badge></TableCell>
                    <TableCell className="text-right pr-8 text-base text-zinc-400 italic">{daily?.remarks || '-'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 rounded-xl font-bold uppercase text-[10px] tracking-widest"><ChevronLeft className="w-4 h-4 mr-2" /> Previous</Button>
          <div className="flex items-center gap-2">{[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => setCurrentPage(i + 1)} className={cn("w-8 h-8 rounded-lg text-[10px] font-black transition-all", currentPage === i + 1 ? "bg-primary text-white shadow-lg" : "bg-white text-zinc-400")}>{i + 1}</button>))}</div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 rounded-xl font-bold uppercase text-[10px] tracking-widest">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
        </div>
      )}
    </main>
  )

  if (isPortal) return content

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body overflow-x-hidden">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        {content}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="border-none shadow-sm rounded-2xl p-6 bg-white flex items-center gap-5">
      <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center shadow-inner">{icon}</div>
      <div><p className="text-[12px] font-medium text-zinc-400 uppercase tracking-widest">{title}</p><h3 className="text-2xl font-medium text-black">{value}</h3></div>
    </Card>
  )
}
