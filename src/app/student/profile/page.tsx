
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  User, 
  Wallet, 
  UserCheck, 
  GraduationCap, 
  Contact, 
  Award, 
  Library,
  Printer,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ClipboardList,
  CreditCard,
  Video,
  MapPin,
  ShieldCheck,
  Download,
  FileText,
  History,
  TrendingUp,
  FileSearch,
  Activity
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

export default function StudentProfilePage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const [student, setStudent] = useState<any>(null)
  const [fees, setFees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    if (!database || !user) return
    
    // 1. Find Student and Admin context
    const instRef = ref(database, `Institutes`)
    onValue(instRef, (snap) => {
      const institutes = snap.val() || {}
      let foundStudent = null
      let adminUid = null

      Object.keys(institutes).forEach(id => {
        const adms = institutes[id].admissions || {}
        Object.keys(adms).forEach(aid => {
          if (adms[aid].email?.toLowerCase() === user.email?.toLowerCase()) {
            foundStudent = { ...adms[aid], id: aid }
            adminUid = id
          }
        })
      })

      if (foundStudent && adminUid) {
        setStudent(foundStudent)
        const rootPath = `Institutes/${adminUid}`
        
        onValue(ref(database, `${rootPath}/fees`), (s) => {
          const data = s.val() || {}
          setFees(Object.values(data).filter((f: any) => f.studentId === foundStudent.id))
        })

        onValue(ref(database, `${rootPath}/attendance/Student`), (s) => {
          const data = s.val() || {}
          const logs: any[] = []
          Object.keys(data).forEach(date => {
            Object.keys(data[date]).forEach(batch => {
              if (data[date][batch][foundStudent.id]) {
                logs.push({ date, status: data[date][batch][foundStudent.id].status })
              }
            })
          })
          setAttendance(logs)
        })

        onValue(ref(database, `${rootPath}/marksheets`), (s) => {
          const data = s.val() || {}
          setMarksheets(Object.values(data).filter((m: any) => m.studentId === foundStudent.id))
        })

        onValue(ref(database, `${rootPath}/student-documents/${foundStudent.id}`), (s) => {
          const data = s.val() || {}
          setDocuments(Object.values(data))
        })
      }
      setIsLoading(false)
    })
  }, [database, user])

  const stats = useMemo(() => {
    const totalPaid = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
    const netFees = Number(student?.netFees) || 0
    const pending = Math.max(0, netFees - totalPaid)
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'Present').length
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    return { totalPaid, pending, attendancePercent }
  }, [student, fees, attendance])

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Syncing User Dossier...</div>
  if (!student) return <div className="p-20 text-center text-zinc-400 font-bold">UNAUTHORIZED ACCESS</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 font-public-sans text-black text-[14px]">
      
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex flex-col md:flex-row items-center gap-10 lg:border-r border-zinc-100 lg:pr-12">
            <div className="relative">
              <Avatar className="h-40 w-48 rounded-[48px] border-[10px] border-zinc-50 shadow-2xl">
                <AvatarFallback className="bg-primary text-white text-5xl font-black">{student.studentName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Badge className="absolute -bottom-2 right-4 bg-emerald-500 text-white border-4 border-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg">Active</Badge>
            </div>
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student.studentName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase">ID: {student.admissionNo}</Badge>
                <Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase">Roll: {student.rollNo || 'N/A'}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-primary uppercase tracking-widest">{student.course}</p>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Batch: {student.batch || 'Morning'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            <QuickStat color="text-emerald-600" label="Fees Paid" value={`₹${stats.totalPaid.toLocaleString()}`} />
            <QuickStat color="text-rose-500" label="Outstanding" value={`₹${stats.pending.toLocaleString()}`} />
            <QuickStat color="text-indigo-600" label="Attendance" value={`${stats.attendancePercent}%`} />
            <QuickStat color="text-amber-500" label="Session" value={student.session || '2024-25'} />
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
          <DashboardTabTrigger value="personal" label="Profile Overview" icon={<User className="w-4 h-4" />} />
          <DashboardTabTrigger value="academic" label="Enrollment Info" icon={<GraduationCap className="w-4 h-4" />} />
          <DashboardTabTrigger value="fees" label="Finance Matrix" icon={<Wallet className="w-4 h-4" />} />
          <DashboardTabTrigger value="documents" label="Digital Vault" icon={<FileText className="w-4 h-4" />} />
        </TabsList>

        <TabsContent value="personal" className="mt-8">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <section className="space-y-8">
                <SectionHeader icon={<Info className="text-primary" />} title="Personal Identity" />
                <div className="space-y-4">
                  <DetailRow label="Gender" value={student.gender} />
                  <DetailRow label="Date of Birth" value={student.dob} />
                  <DetailRow label="Religion" value={student.religion} />
                  <DetailRow label="Category" value={student.category} />
                  <DetailRow label="Aadhar No" value={student.adharNumber} />
                  <DetailRow label="Contact" value={student.mobile} />
                </div>
              </section>
              <section className="space-y-8">
                <SectionHeader icon={<Users className="text-amber-500" />} title="Parental Registry" />
                <div className="space-y-4">
                  <DetailRow label="Father Name" value={student.fatherName} />
                  <DetailRow label="Mother Name" value={student.motherName} />
                  <DetailRow label="Father Mobile" value={student.fatherMobile} />
                  <DetailRow label="Permanent Address" value={student.address} />
                </div>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="mt-8">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <SectionHeader icon={<ShieldCheck className="text-emerald-500" />} title="Institutional Mapping" />
                <div className="space-y-4">
                  <DetailRow label="Registration Date" value={student.admissionDate} />
                  <DetailRow label="Session Block" value={student.session} />
                  <DetailRow label="Academic Course" value={student.course} />
                  <DetailRow label="Assigned Batch" value={student.batch} />
                </div>
              </div>
              <div className="space-y-6">
                <SectionHeader icon={<BookOpen className="text-blue-500" />} title="Previous Records" />
                <div className="space-y-4">
                  <DetailRow label="Qualifying Exam" value={student.qualification || 'N/A'} />
                  <DetailRow label="Admission Source" value={student.source} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-8 space-y-8">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Installment History</h3>
              <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[10px]">Verified Ledger</Badge>
            </div>
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase pl-8">Order</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Due Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-right pr-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.emiSchedule ? student.emiSchedule.map((emi: any, i: number) => (
                  <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/20 transition-all">
                    <TableCell className="pl-8 text-sm font-bold text-zinc-400">Installment #{emi.installmentNo}</TableCell>
                    <TableCell className="text-sm font-black text-zinc-800">₹ {emi.amount}</TableCell>
                    <TableCell className="text-sm text-zinc-400 font-medium font-mono">{emi.dueDate}</TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge className={cn("rounded-md text-[9px] font-black uppercase", emi.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {emi.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-zinc-300 italic">Financial schedule not configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {documents.map((doc, idx) => (
              <Card key={idx} className="border border-zinc-100 shadow-sm rounded-3xl bg-white p-8 space-y-6 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner"><FileText className="w-6 h-6" /></div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[9px] font-black shadow-sm">Verified</Badge>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-zinc-800 uppercase text-sm tracking-tight line-clamp-1">{doc.documentName}</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {format(new Date(doc.uploadedDate), "PP")}</p>
                </div>
                <Button variant="outline" className="w-full rounded-2xl h-11 border-zinc-100 text-zinc-500 font-black uppercase text-[10px] tracking-widest gap-2" onClick={() => window.open(doc.fileUrl, '_blank')}>
                  <Download className="w-3.5 h-3.5" /> Get Copy
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}

function QuickStat({ label, value, color }: any) {
  return (
    <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100/50 text-center space-y-1 group hover:bg-white hover:shadow-md transition-all">
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{label}</p>
      <p className={cn("text-xl font-black font-headline tracking-tighter", color)}>{value}</p>
    </div>
  )
}

function DashboardTabTrigger({ value, label, icon }: any) {
  return (
    <TabsTrigger 
      value={value} 
      className="h-11 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all border border-transparent data-[state=active]:shadow-lg"
    >
      <span className="flex items-center gap-2">{icon} {label}</span>
    </TabsTrigger>
  )
}

function SectionHeader({ icon, title }: any) {
  return (
    <h3 className="text-base font-black text-zinc-800 flex items-center gap-3 uppercase tracking-tight border-b border-zinc-50 pb-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shadow-inner">{icon}</div>
      {title}
    </h3>
  )
}

function DetailRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 group">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
      <span className="text-sm font-black text-zinc-700 uppercase">{value || '-'}</span>
    </div>
  )
}
