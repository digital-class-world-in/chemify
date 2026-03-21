"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  BookOpen,
  PieChart as PieChartIcon,
  BarChart3,
  ShieldCheck,
  CalendarCheck,
  Plus,
  Loader2,
  FileText
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, get } from "firebase/database"
import { cn } from "@/lib/utils"
import { format, parseISO, getMonth } from "date-fns"

const COLORS = ['#1e3a8a', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function StudentAttendancePage() {
  const { database } = useFirebase()
  const { user } = useUser()

  const [student, setStudent] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("daily")

  useEffect(() => {
    if (!database || !user?.email) {
      setIsLoading(false)
      setError("No user logged in or database not available")
      return
    }

    let attendanceUnsub: (() => void) | null = null
    let leaveUnsub: (() => void) | null = null

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const emailLower = user.email.toLowerCase()
        const institutesSnap = await get(ref(database, "Institutes"))

        if (!institutesSnap.exists()) {
          setError("No institutes found in database")
          return
        }

        const institutes = institutesSnap.val() || {}
        let foundStudent: any = null
        let instituteId: string | null = null

        outer: for (const instKey in institutes) {
          const admissions = institutes[instKey]?.admissions || {}
          for (const studKey in admissions) {
            const stud = admissions[studKey]
            if (stud?.email?.toLowerCase() === emailLower) {
              foundStudent = { ...stud, id: studKey }
              instituteId = instKey
              break outer
            }
          }
        }

        if (!foundStudent || !instituteId) {
          setError("No student profile found for this email")
          return
        }

        setStudent(foundStudent)
        const rootPath = `Institutes/${instituteId}`

        // Attendance listener
        const attRef = ref(database, `${rootPath}/attendance/Student`)
        attendanceUnsub = onValue(attRef, (snap) => {
          const data = snap.val() || {}
          const logs: any[] = []

          Object.keys(data).forEach((date) => {
            const dateEntry = data[date] || {}
            Object.keys(dateEntry).forEach((batchId) => {
              const studentEntry = dateEntry[batchId]?.[foundStudent.id]
              if (studentEntry) {
                logs.push({ date, ...studentEntry })
              }
            })
          })

          logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          setAttendanceData(logs)
        })

        // Leave requests listener
        const leaveRef = ref(database, `${rootPath}/leave-requests`)
        leaveUnsub = onValue(leaveRef, (snap) => {
          const data = snap.val() || {}
          const myLeaves = Object.values(data).filter(
            (l: any) => l.requesterId === foundStudent.id
          )
          setLeaveRequests(myLeaves as any[])
        })
      } catch (err: any) {
        console.error("Error loading attendance:", err)
        setError("Failed to load attendance data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      attendanceUnsub?.()
      leaveUnsub?.()
    }
  }, [database, user?.email])

  // ────────────────────────────────────────────────
  // Computed values
  // ────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = attendanceData.length
    const present = attendanceData.filter(a => a.status === 'Present').length
    const absent = attendanceData.filter(a => a.status === 'Absent').length
    const leave = attendanceData.filter(a => a.status === 'Leave').length
    const late = attendanceData.filter(a => a.status === 'Late').length
    const percent = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, leave, late, percent }
  }, [attendanceData])

  const statusBadge = useMemo(() => {
    if (stats.percent >= 85) return { label: "Good", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <CheckCircle2 className="w-3 h-3" /> }
    if (stats.percent >= 75) return { label: "Warning", color: "bg-amber-50 text-amber-600 border-amber-100", icon: <AlertCircle className="w-3 h-3" /> }
    return { label: "Needs Attention", color: "bg-rose-50 text-rose-600 border-rose-100", icon: <XCircle className="w-3 h-3" /> }
  }, [stats.percent])

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const counts = months.map(m => ({ name: m, present: 0, absent: 0, leave: 0 }))

    attendanceData.forEach(log => {
      const mIdx = new Date(log.date).getMonth()
      if (log.status === 'Present') counts[mIdx].present++
      else if (log.status === 'Absent') counts[mIdx].absent++
      else if (log.status === 'Leave') counts[mIdx].leave++
    })

    return counts.slice(0, new Date().getMonth() + 1)
  }, [attendanceData])

  const subjectData = [
    { name: 'Mathematics', value: 88 },
    { name: 'Physics', value: 92 },
    { name: 'Chemistry', value: 70 },
    { name: 'English', value: 95 },
    { name: 'Biology', value: 82 }
  ]

  // ────────────────────────────────────────────────
  // Loading / Error states
  // ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center space-y-5">
          <Loader2 className="h-14 w-14 animate-spin text-indigo-600 mx-auto" />
          <p className="text-lg font-medium text-zinc-700">Loading your attendance record...</p>
          <p className="text-sm text-zinc-500">Please wait a moment</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="max-w-md w-full border-red-100 shadow-lg">
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="h-14 w-14 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-zinc-800">Something went wrong</h2>
            <p className="text-zinc-600">{error}</p>
            <p className="text-sm text-zinc-500">Please contact your school administrator</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="max-w-md w-full shadow-lg">
          <div className="p-10 text-center space-y-4">
            <XCircle className="h-16 w-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-bold text-zinc-800">Access Denied</h2>
            <p className="text-zinc-600">No student profile found for this account.</p>
            <p className="text-sm text-zinc-500">Please login with your registered student email.</p>
          </div>
        </Card>
      </div>
    )
  }

  // ────────────────────────────────────────────────
  // Main content
  // ────────────────────────────────────────────────

  return (
    <main className="flex-1 p-6 md:p-8 lg:p-10 space-y-8 md:space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden p-8 md:p-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-900 shadow-inner">
              <CalendarCheck className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                {student.studentName || "Student"}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Badge variant="outline" className="rounded-lg border-zinc-200 text-zinc-500 font-bold text-xs uppercase px-3 py-1">
                  ID: {student.admissionNo || "—"}
                </Badge>
                <Badge className={cn(
                  "rounded-full px-4 py-1 text-xs font-black uppercase flex items-center gap-1.5 border",
                  statusBadge.color
                )}>
                  {statusBadge.icon} {statusBadge.label}
                </Badge>
              </div>
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {student.course || "—"} • Section {student.section || "—"} • {student.session || "Current Session"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Attendance Health</p>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-5xl md:text-6xl font-black tracking-tighter",
                stats.percent >= 75 ? "text-emerald-600" : "text-rose-600"
              )}>
                {stats.percent}
              </span>
              <span className="text-2xl md:text-3xl font-black text-zinc-300">%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        <StatCard label="Total Days" value={stats.total} icon={<Calendar className="w-5 h-5 text-zinc-500" />} />
        <StatCard label="Present" value={stats.present} icon={<UserCheck className="w-5 h-5 text-emerald-600" />} />
        <StatCard label="Absent" value={stats.absent} icon={<XCircle className="w-5 h-5 text-rose-600" />} />
        <StatCard label="Leave" value={stats.leave} icon={<Clock className="w-5 h-5 text-blue-600" />} />
        <StatCard label="Late" value={stats.late || 0} icon={<AlertCircle className="w-5 h-5 text-amber-600" />} />
        <StatCard label="Success Rate" value={`${stats.percent}%`} icon={<TrendingUp className="w-5 h-5 text-indigo-600" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <Card className="lg:col-span-8 border-none shadow rounded-3xl bg-white p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-800">Monthly Attendance</h3>
              <p className="text-sm text-zinc-500">Trend overview</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '12px' }} />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="leave" name="Leave" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-4 border-none shadow rounded-3xl bg-white p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-800">Subjects</h3>
              <p className="text-sm text-zinc-500">Performance</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {subjectData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-700">{s.name}</span>
                </div>
                <span className="font-bold">{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-2xl h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-200">
          <DashboardTabTrigger value="daily" label="Daily Attendance" icon={<Calendar className="w-4 h-4" />} />
          <DashboardTabTrigger value="monthly" label="Monthly Report" icon={<BarChart3 className="w-4 h-4" />} />
          <DashboardTabTrigger value="subject" label="Subject-Wise" icon={<BookOpen className="w-4 h-4" />} />
          <DashboardTabTrigger value="leave" label="Leave History" icon={<Clock className="w-4 h-4" />} />
          <DashboardTabTrigger value="policy" label="Attendance Policy" icon={<ShieldCheck className="w-4 h-4" />} />
          <DashboardTabTrigger value="download" label="Download Reports" icon={<FileText className="w-4 h-4" />} />
        </TabsList>

        <div className="mt-8">
          <TabsContent value="daily" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow rounded-3xl overflow-hidden bg-white">
              <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="font-bold text-zinc-800 uppercase text-sm md:text-base tracking-wide">Daily Attendance Log</h3>
                <Button variant="ghost" size="sm" className="h-9 text-xs font-medium gap-1.5">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50/70">
                    <TableRow>
                      <TableHead className="pl-6 md:pl-8 text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Day</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Remark</TableHead>
                      <TableHead className="text-right pr-6 md:pr-8 text-xs font-semibold">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-zinc-400 italic">
                          No attendance records yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceData.map((log, i) => (
                        <TableRow key={i} className="border-zinc-100 hover:bg-zinc-50/50">
                          <TableCell className="pl-6 md:pl-8 font-medium">{log.date}</TableCell>
                          <TableCell className="text-zinc-600">
                            {log.date ? format(parseISO(log.date), "EEE") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium px-2.5 py-0.5",
                                log.status === 'Present' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                log.status === 'Absent' ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {log.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-600 max-w-xs truncate">
                            {log.remarks || log.reason || "—"}
                          </TableCell>
                          <TableCell className="text-right pr-6 md:pr-8 text-sm text-zinc-500">
                            {log.updatedAt ? format(new Date(log.updatedAt), "hh:mm a") : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Add your other TabsContent here similarly */}
          {/* monthly, subject, leave, policy, download */}
          {/* ... you can copy-paste your original content for these tabs ... */}

        </div>
      </Tabs>
    </main>
  )
}

function StatCard({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow rounded-2xl bg-white p-5 md:p-6 hover:shadow-md transition-all">
      <div className="flex flex-col gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
          <h4 className="text-2xl font-bold text-zinc-800 mt-1">{value}</h4>
        </div>
      </div>
    </Card>
  )
}

function DashboardTabTrigger({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="px-5 py-2.5 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-zinc-600 font-medium text-sm transition-all border border-transparent data-[state=active]:shadow-sm"
    >
      <span className="flex items-center gap-2">{icon} {label}</span>
    </TabsTrigger>
  )
}