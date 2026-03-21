
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  ShieldCheck,
  Download,
  FileSearch,
  Activity,
  MapPin,
  Phone,
  Mail,
  Users,
  Briefcase,
  Printer,
  History as HistoryIcon,
  TrendingUp
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function StudentProfilePage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, staffId: studentId, isLoading: isIdLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [fees, setFees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    // Attempt to get student ID from local session if hook is still loading
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('student_session') : null
    const session = sessionStr ? JSON.parse(sessionStr) : null
    
    const currentResolvedId = resolvedId || session?.adminUid
    const currentStudentId = studentId || session?.studentId

    if (!database || !currentResolvedId || !currentStudentId) {
      if (!isIdLoading && !currentStudentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${currentResolvedId}`
    
    // 1. Fetch Comprehensive Student Profile
    const studentRef = ref(database, `${rootPath}/admissions/${currentStudentId}`)
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: snapshot.key })
      }
    })

    // 2. Fetch Fees History
    const feesRef = ref(database, `${rootPath}/fees`)
    onValue(feesRef, (snapshot) => {
      const data = snapshot.val() || {}
      setFees(Object.values(data).filter((f: any) => f.studentId === currentStudentId).reverse())
    })

    // 3. Fetch Attendance Logs
    const attRef = ref(database, `${rootPath}/attendance/Student`)
    onValue(attRef, (snapshot) => {
      const data = snapshot.val() || {}
      const logs: any[] = []
      Object.keys(data).forEach(date => {
        Object.keys(data[date]).forEach(batchId => {
          if (data[date][batchId][currentStudentId]) {
            logs.push({ date, ...data[date][batchId][currentStudentId] })
          }
        })
      })
      setAttendance(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    })

    // 4. Fetch Marksheets
    const marksRef = ref(database, `${rootPath}/marksheets`)
    onValue(marksRef, (snapshot) => {
      const data = snapshot.val() || {}
      setMarksheets(Object.values(data).filter((m: any) => m.studentId === currentStudentId).reverse())
    })

    // 5. Fetch Verified Documents
    const docsRef = ref(database, `${rootPath}/student-documents/${currentStudentId}`)
    onValue(docsRef, (snapshot) => {
      const data = snapshot.val() || {}
      setDocuments(Object.values(data).reverse())
    })

    setIsLoading(false)

    return () => {
      off(studentRef)
      off(feesRef)
      off(attRef)
      off(marksRef)
      off(docsRef)
    }
  }, [database, resolvedId, studentId, isIdLoading])

  // Computed Stats for Quick Overview
  const stats = useMemo(() => {
    if (!student) return { totalPaid: 0, pending: 0, attendancePercent: 0, latestPercentage: 0 }
    
    const totalPaid = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
    const netFees = Number(student.netFees) || 0
    const pending = Math.max(0, netFees - totalPaid)
    
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'Present').length
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    const latestExam = marksheets[0]
    const latestPercentage = latestExam ? latestExam.percentage : 0

    return { totalPaid, pending, attendancePercent, latestPercentage }
  }, [student, fees, attendance, marksheets])

  if (isLoading || isIdLoading) return (
    <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-widest animate-pulse">
      Establishing Secure Academic Sync...
    </div>
  )

  if (!student) return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
        <Info className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">Profile Not Linked</h2>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto font-medium">Please contact administration to map your login to a valid admission record.</p>
      </div>
    </div>
  )

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32">
      
      {/* 👤 PROFILE HERO SECTION */}
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Avatar & Identifiers */}
          <div className="flex flex-col md:flex-row items-center gap-10 lg:border-r border-zinc-100 lg:pr-12">
            <div className="relative">
              <Avatar className="h-44 w-44 rounded-[48px] border-[10px] border-zinc-50 shadow-2xl">
                <AvatarFallback className="bg-primary text-white text-6xl font-black">{student.studentName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl border-4 border-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student.studentName}</h2>
                <p className="text-primary font-black text-sm uppercase tracking-[0.2em]">{student.course}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase px-3 py-1">ADM: {student.admissionNo}</Badge>
                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1">Verified Student</Badge>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            <QuickStat label="Paid Amount" value={`₹${stats.totalPaid.toLocaleString()}`} color="text-emerald-600" />
            <QuickStat label="Balance Due" value={`₹${stats.pending.toLocaleString()}`} color="text-rose-500" />
            <QuickStat label="Attendance" value={`${stats.attendancePercent}%`} color="text-indigo-600" />
            <QuickStat label="Last Result" value={`${stats.latestPercentage}%`} color="text-amber-500" />
          </div>
        </div>
      </Card>

      {/* 📑 TABBED NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
          <DashboardTabTrigger value="personal" label="Personal Profile" icon={<User className="w-4 h-4" />} />
          <DashboardTabTrigger value="academic" label="Academic Data" icon={<GraduationCap className="w-4 h-4" />} />
          <DashboardTabTrigger value="fees" label="Fee Ledger" icon={<Wallet className="w-4 h-4" />} />
          <DashboardTabTrigger value="attendance" label="Attendance" icon={<UserCheck className="w-4 h-4" />} />
          <DashboardTabTrigger value="exams" label="Transcripts" icon={<Award className="w-4 h-4" />} />
          <DashboardTabTrigger value="documents" label="Records" icon={<FileText className="w-4 h-4" />} />
        </TabsList>

        <div className="mt-8">
          {/* 🏡 PERSONAL DATA TAB (WHOLE PROFILE) */}
          <TabsContent value="personal" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm rounded-[32px] bg-white p-10 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Identification & Basic Info */}
                <section className="space-y-8">
                  <SectionHeader icon={<Info className="text-primary" />} title="Primary Identification" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    <DetailRow label="Full Name" value={student.studentName} />
                    <DetailRow label="Date of Birth" value={student.dob} />
                    <DetailRow label="Gender" value={student.gender} />
                    <DetailRow label="Blood Group" value={student.bloodGroup} />
                    <DetailRow label="Aadhar Number" value={student.adharNumber} />
                    <DetailRow label="Religion" value={student.religion} />
                    <DetailRow label="Category" value={student.category} />
                    <DetailRow label="Mobile" value={student.mobile} />
                  </div>
                </section>

                {/* Parental & Residential Info */}
                <section className="space-y-8">
                  <SectionHeader icon={<Users className="text-rose-500" />} title="Parental & Residential" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    <DetailRow label="Father's Name" value={student.fatherName} />
                    <DetailRow label="Mother's Name" value={student.motherName} />
                    <DetailRow label="Father's Occupation" value={student.fatherOccupation} />
                    <DetailRow label="Mother's Occupation" value={student.motherOccupation} />
                    <div className="md:col-span-2">
                      <DetailRow label="Permanent Address" value={student.address} />
                    </div>
                  </div>
                </section>
              </div>
            </Card>
          </TabsContent>

          {/* 🎓 ACADEMIC DATA TAB */}
          <TabsContent value="academic" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm rounded-[32px] bg-white p-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <section className="space-y-8">
                  <SectionHeader icon={<ShieldCheck className="text-emerald-500" />} title="Enrollment Details" />
                  <div className="space-y-4">
                    <DetailRow label="Admission Number" value={student.admissionNo} />
                    <DetailRow label="Class / Course" value={student.course} />
                    <DetailRow label="Assigned Batch" value={student.batch} />
                    <DetailRow label="Section" value={student.section || 'General'} />
                    <DetailRow label="Roll Number" value={student.rollNo || '-'} />
                  </div>
                </section>
                <section className="space-y-8">
                  <SectionHeader icon={<HistoryIcon className="text-blue-500" />} title="Session Tracking" />
                  <div className="space-y-4">
                    <DetailRow label="Admission Date" value={student.admissionDate} />
                    <DetailRow label="Current Session" value={student.session} />
                    <DetailRow label="Course Duration" value={student.courseDuration} />
                    <DetailRow label="Source of Inquiry" value={student.source} />
                  </div>
                </section>
              </div>
            </Card>
          </TabsContent>

          {/* 💰 FEES LEDGER TAB */}
          <TabsContent value="fees" className="mt-0 animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SummaryStat label="Net Course Fee" value={`₹${Number(student.netFees).toLocaleString()}`} />
              <SummaryStat label="Total Received" value={`₹${stats.totalPaid.toLocaleString()}`} isSuccess />
              <SummaryStat label="Outstanding" value={`₹${stats.pending.toLocaleString()}`} isDanger />
            </div>
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-[0.2em]">Transaction History</h3>
                <Button variant="ghost" className="text-[10px] font-black uppercase text-primary gap-2 transition-none"><Printer className="w-3.5 h-3.5" /> Full Statement</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Receipt No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((f, i) => (
                      <TableRow key={i} className="border-zinc-50 group hover:bg-zinc-50/30 transition-all">
                        <TableCell className="pl-8 text-sm font-bold text-zinc-400 font-mono">{f.date}</TableCell>
                        <TableCell className="text-sm font-bold text-zinc-700">{f.receiptNo || '-'}</TableCell>
                        <TableCell className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{f.method}</TableCell>
                        <TableCell className="text-right pr-8 font-black text-emerald-600">₹{Number(f.amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {fees.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="h-48 text-center text-zinc-300 italic">No payments recorded yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* 📅 ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-0 animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm rounded-[32px] bg-white p-10 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-zinc-50" />
                    <circle 
                      cx="88" cy="88" r="75" stroke="currentColor" strokeWidth="14" fill="transparent" 
                      strokeDasharray={471} 
                      strokeDashoffset={471 - (471 * stats.attendancePercent) / 100} 
                      className={cn(stats.attendancePercent >= 75 ? "text-emerald-500" : "text-rose-500")} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-zinc-800 tracking-tighter">{stats.attendancePercent}%</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Presence</span>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full border-zinc-100 text-zinc-400 font-black text-[9px] uppercase px-4 py-1">Current Session Avg</Badge>
              </Card>

              <Card className="md:col-span-2 border-none shadow-sm rounded-[32px] bg-white p-10 space-y-10">
                <SectionHeader icon={<Calendar className="text-[#1e3a8a]" />} title="Presence breakdown" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <PresenceMetric label="Working Days" value={attendance.length} />
                  <PresenceMetric label="Present" value={attendance.filter(a => a.status === 'Present').length} color="text-emerald-600" />
                  <PresenceMetric label="Absent" value={attendance.filter(a => a.status === 'Absent').length} color="text-rose-500" />
                  <PresenceMetric label="On Leave" value={attendance.filter(a => a.status === 'Leave').length} color="text-blue-500" />
                </div>
                <div className="pt-8 border-t border-zinc-50 bg-zinc-50/50 p-6 rounded-3xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><Info className="w-5 h-5" /></div>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">Maintaining above 75% attendance is mandatory for semester examinations as per institutional guidelines.</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 🏆 EXAMS & TRANSCRIPTS TAB */}
          <TabsContent value="exams" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-[0.2em]">Academic Transcripts Ledger</h3>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Examination</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Score</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Percentage</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Grade</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marksheets.map((m, i) => (
                      <TableRow key={i} className="border-zinc-50 group hover:bg-zinc-50/30 transition-all">
                        <TableCell className="pl-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-white group-hover:text-primary transition-all shadow-inner">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-black text-zinc-800 uppercase tracking-tight">{m.examName}</p>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{m.academicYear}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-zinc-500">{m.totalObtained} / {m.totalMaxMarks}</TableCell>
                        <TableCell className="text-center font-black text-[#1e3a8a]">{m.percentage}%</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="rounded-lg font-black px-3">{m.grade}</Badge></TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge className={cn("rounded-lg px-2.5 py-1 text-[9px] font-black uppercase border-none", m.status === 'Pass' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{m.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {marksheets.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="h-48 text-center text-zinc-300 italic">No transcripts released yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* 📄 DOCUMENTS TAB */}
          <TabsContent value="documents" className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {documents.map((doc, i) => (
                <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all shadow-inner">
                      <FileText className="w-7 h-7" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase px-3 py-1">Verified</Badge>
                  </div>
                  <div className="space-y-1 mb-8 flex-1">
                    <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight line-clamp-1">{doc.documentName}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Added on {format(new Date(doc.uploadedDate), "PPP")}</p>
                  </div>
                  <div className="flex gap-3 pt-6 border-t border-zinc-50">
                    <Button variant="ghost" onClick={() => window.open(doc.fileUrl, '_blank')} className="flex-1 h-11 rounded-2xl bg-zinc-50 text-zinc-500 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-zinc-100">
                      <FileSearch className="w-3.5 h-3.5" /> Preview
                    </Button>
                    <Button onClick={() => window.open(doc.fileUrl, '_blank')} className="flex-1 h-11 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-900/20 border-none active:scale-95">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </div>
                </Card>
              ))}
              {documents.length === 0 && (
                <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                    <FileSearch className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No verified documents in your registry</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

function QuickStat({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-zinc-50/50 p-5 rounded-3xl border border-zinc-100/50 text-center space-y-1 hover:bg-white hover:shadow-md transition-all">
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">{label}</p>
      <p className={cn("text-xl font-black font-headline tracking-tighter leading-none pt-1", color)}>{value}</p>
    </div>
  )
}

function DashboardTabTrigger({ value, label, icon }: any) {
  return (
    <TabsTrigger 
      value={value} 
      className="h-11 px-6 rounded-xl data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all border border-transparent data-[state=active]:shadow-lg"
    >
      <span className="flex items-center gap-2">{icon} {label}</span>
    </TabsTrigger>
  )
}

function SectionHeader({ icon, title }: any) {
  return (
    <h3 className="text-lg font-black text-zinc-800 flex items-center gap-3 uppercase tracking-tight">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shadow-inner">{icon}</div>
      {title}
    </h3>
  )
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1.5 group">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</p>
      <div className={cn(
        "min-h-[48px] flex items-center px-5 bg-zinc-50/50 rounded-2xl text-xs font-bold text-zinc-700 border border-transparent group-hover:border-zinc-100 transition-all shadow-inner",
        "text-zinc-700"
      )}>
        {value || '---'}
      </div>
    </div>
  )
}

function SummaryStat({ label, value, isSuccess, isDanger }: any) {
  return (
    <Card className="border-none shadow-sm rounded-[32px] bg-white p-8 flex flex-col items-center text-center space-y-3 group hover:shadow-lg transition-all">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">{label}</p>
      <h4 className={cn(
        "text-3xl font-black font-headline tracking-tight leading-none",
        isSuccess ? "text-emerald-600" : isDanger ? "text-rose-600" : "text-zinc-800"
      )}>{value}</h4>
    </Card>
  )
}

function PresenceMetric({ label, value, color }: { label: string, value: number, color?: string }) {
  return (
    <div className="text-center space-y-1">
      <p className={cn("text-2xl font-black font-headline tracking-tight leading-none", color || "text-zinc-800")}>{value}</p>
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none pt-1">{label}</p>
    </div>
  )
}
