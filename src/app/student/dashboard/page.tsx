
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wallet, 
  UserCheck, 
  GraduationCap, 
  Info,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  User,
  BookOpen,
  FileText,
  Download,
  History,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  Users,
  Award,
  IdCard,
  Search,
  Printer,
  CalendarCheck,
  Video,
  ExternalLink,
  Layers,
  X,
  ChevronRight,
  Plus,
  Loader2,
  Save,
  Library,
  Book,
  Tag,
  Check
} from "lucide-react"
import { useFirebase, useUser, useTranslation } from "@/firebase"
import { ref, onValue, off, push, update } from "firebase/database"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "@/lib/utils"
import { toPng } from 'html-to-image'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function StudentDashboardPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { t } = useTranslation()
  const { resolvedId, staffId: studentId, isLoading: idLoading } = useResolvedId()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [student, setStudent] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [awardedCertificates, setAwardedCertificates] = useState<any[]>([])
  const [eContent, setEContent] = useState<any[]>([])
  const [offlineExams, setOfflineExams] = useState<any[]>([])
  const [issuedBooks, setIssuedBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)
  const [isDownloadingId, setIsDownloadingId] = useState(false)

  useEffect(() => {
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('student_session') : null
    const session = sessionStr ? JSON.parse(sessionStr) : null
    const currentResolvedId = resolvedId || session?.adminUid
    const currentStudentId = studentId || session?.studentId

    if (!database || !currentResolvedId || !currentStudentId) {
      if (!idLoading && !currentStudentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${currentResolvedId}`
    
    onValue(ref(database, `${rootPath}/profile`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setInstituteProfile(data)
        setInstituteName(data.instituteName || "Your Institute")
      }
    })

    onValue(ref(database, `${rootPath}/admissions/${currentStudentId}`), (snapshot) => {
      if (snapshot.exists()) {
        const s = snapshot.val()
        setStudent({ ...s, id: currentStudentId })
        
        onValue(ref(database, `${rootPath}/content`), (csnap) => {
          const data = csnap.val() || {}
          const list = Object.values(data).filter((item: any) => 
            item.batch === s.batch && 
            item.course === s.course
          )
          setEContent(list)
        })
      }
    })

    onValue(ref(database, `${rootPath}/fees`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.values(data).filter((p: any) => p.studentId === currentStudentId)
      setPayments(list)
    })

    onValue(ref(database, `${rootPath}/attendance/Student`), (snapshot) => {
      const data = snapshot.val() || {}
      const logs: any[] = []
      Object.keys(data).forEach(date => {
        Object.keys(data[date]).forEach(batch => {
          if (data[date][batch][currentStudentId]) {
            logs.push({ date, ...data[date][batch][currentStudentId] })
          }
        })
      })
      setAttendance(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    })

    onValue(ref(database, `${rootPath}/marksheets`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.values(data).filter((m: any) => m.studentId === currentStudentId)
      setMarksheets(list)
    })

    onValue(ref(database, `${rootPath}/awarded-certificates/${currentStudentId}`), (snapshot) => {
      const data = snapshot.val() || {}
      setAwardedCertificates(Object.values(data).reverse())
    })

    onValue(ref(database, `${rootPath}/offline-exams`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setOfflineExams(list.filter(e => e.assignedStudents?.[currentStudentId]))
    })

    // Fetch Library Issues
    onValue(ref(database, `${rootPath}/library/issues`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data)
        .map(k => ({ ...data[k], id: k }))
        .filter(i => i.userId === currentStudentId)
      setIssuedBooks(list.reverse())
      setIsLoading(false)
    })
  }, [database, resolvedId, studentId, idLoading])

  const stats = useMemo(() => {
    if (!student) return { totalFees: 0, totalPaid: 0, pending: 0, attendancePercent: 0 }
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const totalFees = Number(student?.netFees) || 0
    const pending = Math.max(0, totalFees - totalPaid)
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'Present').length
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    return { totalFees, totalPaid, pending, attendancePercent }
  }, [student, payments, attendance])

  const handleDownloadPDF = (record: any) => {
    const doc = new jsPDF()
    doc.setDrawColor(0).setLineWidth(0.5).rect(5, 5, 200, 287)
    doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(30, 58, 138)
    doc.text(instituteName.toUpperCase(), 105, 25, { align: 'center' })
    doc.setFontSize(9).setTextColor(80).setFont("helvetica", "normal")
    doc.text(instituteProfile?.address || "Institutional Academic Center", 105, 32, { align: 'center' })
    doc.text(`Email: ${instituteProfile?.email || '-'} | Web: ${instituteProfile?.websiteUrl || '-'}`, 105, 38, { align: 'center' })
    
    doc.setFillColor(30, 58, 138).rect(5.5, 50, 199, 10, 'F')
    doc.setTextColor(255).setFontSize(12).setFont("helvetica", "bold").text(record.examName?.toUpperCase() || "ACADEMIC TRANSCRIPT", 105, 56.5, { align: 'center' })

    autoTable(doc, {
      startY: 65,
      margin: { left: 10, right: 10 },
      head: [['Candidate Details', 'Academic Info']],
      body: [[`Name: ${record.studentName?.toUpperCase()}\nAdm No: ${record.enrollmentNo}\nRoll No: ${record.rollNo}`, `Class: ${record.courseName}\nSem: ${record.semester}\nYear: ${record.academicYear}`]],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 }
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      margin: { left: 10, right: 10 },
      head: [['Sr', 'Subject', 'Theory Max', 'Obtained', 'Practical Max', 'Obtained', 'Grade', 'Result']],
      body: record.subjects.map((s: any, i: number) => [i + 1, s.name.toUpperCase(), s.theoryTotal, s.theoryObtain, s.practicalTotal, s.practicalObtain, s.grade, s.result]),
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], halign: 'center' },
      styles: { fontSize: 8, halign: 'center' }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(0)
    doc.text(`GRAND TOTAL: ${record.grandObtained} / ${record.grandTotalMax}`, 15, finalY)
    doc.text(`PERCENTAGE: ${record.percentage}%`, 15, finalY + 10)
    doc.text(`RESULT: ${record.overallResult}`, 15, finalY + 20)
    doc.save(`Transcript_${record.studentName}.pdf`)
  }

  const handleDownloadId = async () => {
    if (!cardRef.current) return
    setIsDownloadingId(true)
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 3, skipFonts: true })
      const link = document.createElement('a')
      link.download = `ID_CARD_${student?.studentName?.replace(/\s+/g, '_')}.png`
      link.href = dataUrl
      link.click()
    } catch (err) { console.error(err) }
    finally { setIsDownloadingId(false) }
  }

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-widest animate-pulse">Establishing Academic Node...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 overflow-x-hidden font-public-sans text-black text-[14px]">
      
      <Card className="border-2 border-zinc-100 shadow-sm rounded-[40px] bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x-2 divide-zinc-50">
          <div className="flex-1 p-10 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">Welcome, {student?.studentName || "Candidate"}!</h2>
            </div>
            <p className="text-zinc-500 font-medium leading-relaxed italic max-sm">"Your academic journey is live and synchronized with the institute node."</p>
            <div className="flex items-center gap-3 pt-2">
              <Badge className="bg-blue-50 text-primary border-none text-[9px] font-black uppercase tracking-widest px-4 py-1.5">Session: {student?.session || '2024-25'}</Badge>
              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest px-4 py-1.5">Status: Verified</Badge>
            </div>
          </div>
          <div className="w-full md:w-[350px] p-0 bg-zinc-50/20 flex items-center justify-center overflow-hidden relative">
            <Image 
              src="https://ik.imagekit.io/2wtn9m5bl/a-man-teacher-working-on-laptop-illustration.png" 
              alt="Banner Illustration" 
              width={280}
              height={180}
              className="object-contain"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStat color="text-[#1e3a8a]" label="Total Fees" value={`₹${stats.totalFees.toLocaleString()}`} />
        <QuickStat color="text-emerald-600" label="Paid Fees" value={`₹${stats.totalPaid.toLocaleString()}`} />
        <QuickStat color="text-rose-500" label="Due Fees" value={`₹${stats.pending.toLocaleString()}`} />
        <QuickStat color="text-indigo-600" label="Attendance" value={`${stats.attendancePercent}%`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
          <DashboardTabTrigger value="profile" label="MY PROFILE" icon={<User className="w-4 h-4" />} />
          <DashboardTabTrigger value="curriculum" label="CURRICULUM" icon={<Layers className="w-4 h-4" />} />
          <DashboardTabTrigger value="exams" label="RESULTS & MARKS" icon={<GraduationCap className="w-4 h-4" />} />
          <DashboardTabTrigger value="library" label="LIBRARY" icon={<Library className="w-4 h-4" />} />
          <DashboardTabTrigger value="payments" label="FEE LEDGER" icon={<Wallet className="w-4 h-4" />} />
          <DashboardTabTrigger value="certificates" label="CERTIFICATES" icon={<Award className="w-4 h-4" />} />
          <DashboardTabTrigger value="idcard" label="ID CARD" icon={<IdCard className="w-4 h-4" />} />
        </TabsList>

        <div className="mt-8">
          <TabsContent value="profile" className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 rounded-[40px] border-8 border-zinc-50 shadow-xl mb-6">
                  <AvatarImage src={student?.studentPhotoUrl} />
                  <AvatarFallback className="bg-primary text-white text-4xl font-black">{student?.studentName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">{student?.studentName}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">ID: {student?.admissionNo}</p>
                <div className="w-full pt-8 mt-8 border-t border-zinc-50 space-y-4 text-left">
                  <DetailBox label="ROLL NUMBER" value={student?.rollNo || '-'} />
                  <DetailBox label="ACADEMIC CLASS" value={student?.course} />
                  <DetailBox label="SECTION" value={student?.section || 'A'} />
                  <DetailBox label="JOINING DATE" value={student?.admissionDate} />
                </div>
              </Card>
              
              <Card className="lg:col-span-8 border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section className="space-y-8">
                    <SectionHeader icon={<Info className="text-primary" />} title="Personal Registry" />
                    <div className="space-y-4">
                      <DetailBox label="GENDER" value={student?.gender} />
                      <DetailBox label="DATE OF BIRTH" value={student?.dob} />
                      <DetailBox label="RELIGION" value={student?.religion} />
                      <DetailBox label="CATEGORY" value={student?.category} />
                      <DetailBox label="ADHAR NO" value={student?.adharNumber} />
                      <DetailBox label="CONTACT" value={student?.mobile} />
                    </div>
                  </section>
                  <section className="space-y-8">
                    <SectionHeader icon={<Users className="text-amber-500" />} title="Parental Context" />
                    <div className="space-y-4">
                      <DetailBox label="FATHER NAME" value={student?.fatherName} />
                      <DetailBox label="MOTHER NAME" value={student?.motherName} />
                      <DetailBox label="FATHER MOBILE" value={student?.fatherMobile} />
                    </div>
                  </section>
                </div>
                <section className="space-y-6 pt-6 border-t border-zinc-50">
                  <SectionHeader icon={<MapPin className="text-rose-500" />} title="Address Registry" />
                  <DetailBox label="PERMANENT PHYSICAL ADDRESS" value={student?.address} />
                </section>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0 animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eContent.map((module, i) => (
                <Card key={i} className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all h-fit">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-primary mb-6 shadow-inner"><BookOpen className="w-6 h-6" /></div>
                  <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight mb-2 line-clamp-1">{module.title}</h4>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">{module.chapters?.length || 0} Academic Chapters</p>
                  
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {(module.chapters || []).map((chapter: any, cIdx: number) => (
                      <AccordionItem key={chapter.id} value={chapter.id} className="border border-zinc-50 rounded-xl px-4">
                        <AccordionTrigger className="hover:no-underline py-3 text-xs font-bold uppercase text-zinc-600">
                          {cIdx + 1}. {chapter.title}
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-2">
                          {chapter.topics?.map((topic: any, tIdx: number) => (
                            <div key={tIdx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                              <span className="text-[11px] font-medium text-zinc-500">{topic.title}</span>
                              <div className="flex gap-2">
                                {topic.videoUrl && <Button onClick={() => window.open(topic.videoUrl, '_blank')} size="icon" variant="ghost" className="h-6 w-6 text-blue-500"><Video className="h-3 w-3" /></Button>}
                                {topic.documentUrl && <Button onClick={() => window.open(topic.documentUrl, '_blank')} size="icon" variant="ghost" className="h-6 w-6 text-emerald-500"><FileText className="h-3 w-3" /></Button>}
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              ))}
              {eContent.length === 0 && (
                <div className="col-span-full py-20 text-center bg-zinc-50/50 rounded-[40px] border-2 border-dashed border-zinc-100">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No curriculum nodes assigned to your batch</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exams" className="mt-0 animate-in fade-in duration-500 space-y-8">
            <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Digital Transcripts</h3>
                <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[10px] font-black">Verified Registry</Badge>
              </div>
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-8 h-14">Examination</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Score</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marksheets.map((m, i) => (
                    <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30 group transition-all">
                      <TableCell className="pl-8 py-4 font-bold text-zinc-700 uppercase">{m.examName}</TableCell>
                      <TableCell className="text-center font-black text-zinc-800">{m.percentage}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-md text-[9px] font-black uppercase", m.overallResult === 'PASS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{m.overallResult}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(m)} className="h-8 rounded-xl bg-zinc-50 text-zinc-500 hover:text-primary transition-all font-black text-[9px] uppercase tracking-widest gap-2">
                          <Download className="w-3.5 h-3.5" /> PDF Transcript
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Offline Exam Node</h3>
              </div>
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Exam Title</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Date & Session</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineExams.map((e, i) => (
                    <TableRow key={i} className="border-zinc-50">
                      <TableCell className="pl-8 py-4 font-bold text-zinc-700 uppercase">{e.title}</TableCell>
                      <TableCell className="text-center text-zinc-500 font-mono">{e.examDate} | {e.timing}</TableCell>
                      <TableCell className="text-right pr-8 font-black text-[#1e3a8a]">{e.totalMarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="mt-0 animate-in fade-in duration-500">
            <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">My Borrowed Volumes</h3>
                <Badge className="bg-blue-50 text-[#1e3a8a] border-none uppercase text-[10px] font-black">Active Loans</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Book Title</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Issue Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Due Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Operation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedBooks.map((iss, i) => (
                      <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/20 transition-all">
                        <TableCell className="pl-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400"><Book className="w-4 h-4" /></div>
                            <span className="text-sm font-bold text-zinc-800 uppercase">{iss.bookTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-zinc-400 font-mono">{iss.issueDate}</TableCell>
                        <TableCell className="text-xs font-black text-rose-400 font-mono">{iss.dueDate}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase border-none shadow-none",
                            iss.status === 'Returned' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#1e3a8a]"
                          )}>{iss.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          {iss.status === 'Issued' ? (
                            <Button variant="ghost" size="sm" className="h-8 rounded-xl bg-zinc-50 text-zinc-500 font-black text-[9px] uppercase tracking-widest">
                              Return Pending
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-600 uppercase text-[8px] font-black">History Node</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {issuedBooks.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="h-48 text-center text-zinc-300 italic uppercase text-[10px]">No books issued to your registry</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-0 animate-in fade-in duration-500">
            <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Financial Ledger</h3>
                <Badge className="bg-[#1e3a8a] text-white border-none uppercase text-[10px] font-black">Authorized</Badge>
              </div>
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase pl-8 h-14">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Receipt Identifier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Operation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30 transition-all">
                      <TableCell className="pl-8 font-black text-zinc-400 font-mono text-xs">{p.date}</TableCell>
                      <TableCell className="text-sm font-bold text-zinc-700 uppercase">{p.receiptNo || '-'}</TableCell>
                      <TableCell className="text-sm font-black text-emerald-600">₹ {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="sm" className="h-8 rounded-xl bg-zinc-50 text-zinc-500 hover:text-[#1e3a8a] transition-all uppercase text-[9px] font-black tracking-widest gap-2">
                          <Download className="w-3.5 h-3.5 mr-1.5" /> PDF Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {awardedCertificates.map((cert, i) => (
                <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500 h-fit">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner group-hover:bg-rose-50 transition-colors"><Award className="w-8 h-8" /></div>
                  <div className="space-y-1 mb-8"><h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight">{cert.name}</h4><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Issued: {cert.issuedDate}</p></div>
                  <Button variant="outline" className="w-full rounded-2xl h-11 border-zinc-100 text-zinc-500 font-black uppercase text-[10px] tracking-widest gap-2">
                    <Download className="w-3.5 h-3.5" /> Access Digital Copy
                  </Button>
                </Card>
              ))}
              {awardedCertificates.length === 0 && (
                <div className="col-span-full py-20 text-center bg-zinc-50/50 rounded-[40px] border-2 border-dashed border-zinc-100 italic text-zinc-400">No certificates awarded yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="idcard" className="mt-0 animate-in fade-in duration-500 flex flex-col items-center gap-10">
            <div ref={cardRef} className="w-[350px] bg-white rounded-[40px] border border-zinc-100 shadow-2xl overflow-hidden flex flex-col print:m-0 print:shadow-none">
              <div className="bg-[#1e3a8a] p-8 text-center space-y-1 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <h3 className="text-white font-black uppercase text-sm tracking-widest">{instituteName}</h3>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Identity Card</p>
              </div>
              <div className="p-10 flex flex-col items-center gap-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 rounded-[40px] border-8 border-zinc-50 shadow-lg">
                    <AvatarImage src={student?.studentPhotoUrl} />
                    <AvatarFallback className="bg-primary text-white text-4xl font-black">{student?.studentName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-md border-2 border-white"><Check className="w-3 h-3 stroke-[4px]" /></div>
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-2xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student?.studentName}</h4>
                  <p className="text-primary font-black text-xs uppercase tracking-widest">{student?.course}</p>
                </div>
                <div className="w-full grid grid-cols-2 gap-y-6 pt-8 border-t border-zinc-50">
                  <CardMeta label="ADM NO." value={student?.admissionNo} />
                  <CardMeta label="ROLL NO." value={student?.rollNo || '-'} />
                  <CardMeta label="SECTION" value={student?.section || 'A'} />
                  <CardMeta label="SESSION" value={student?.session || '2024-25'} />
                </div>
              </div>
              <div className="bg-zinc-50 p-6 border-t border-zinc-100 text-center">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{instituteProfile?.address || 'Main Campus, Academic Block'}</p>
              </div>
            </div>
            <Button onClick={handleDownloadId} disabled={isDownloadingId} className="bg-primary hover:opacity-90 text-white rounded-xl h-14 px-12 font-black uppercase text-xs tracking-widest shadow-xl border-none gap-2">
              {isDownloadingId ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />} Download ID PNG
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

function QuickStat({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <Card className="border border-zinc-100 shadow-sm rounded-[24px] bg-white p-6 transition-all hover:shadow-md">
      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">{label}</p>
      <h4 className={cn("text-2xl font-black tracking-tighter leading-none", color)}>{value}</h4>
    </Card>
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

function SectionHeader({ icon, title }: { icon: any, title: string }) {
  return (
    <h3 className="text-base font-black text-zinc-800 flex items-center gap-3 uppercase tracking-tight border-b border-zinc-50 pb-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shadow-inner">{icon}</div>
      {title}
    </h3>
  )
}

function DetailBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-2 group">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-primary transition-colors ml-1">{label}</p>
      <div className="h-11 flex items-center px-5 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-transparent group-hover:border-zinc-100 transition-all shadow-inner uppercase truncate">
        {value || '-'}
      </div>
    </div>
  )
}

function CardMeta({ label, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-zinc-700 uppercase">{value}</p>
    </div>
  )
}
