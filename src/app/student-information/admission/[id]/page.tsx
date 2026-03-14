
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Wallet, 
  Info, 
  GraduationCap, 
  CalendarCheck, 
  ArrowLeft,
  Printer,
  X,
  ShieldCheck,
  Users,
  Loader2,
  Award,
  IdCard,
  FileText,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Calendar,
  History
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off, push, update } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { toPng } from 'html-to-image'
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function StudentProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, isLoading: isIdLoading } = useResolvedId()
  const { toast } = useToast()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [student, setStudent] = useState<any>(null)
  const [fees, setFees] = useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [awardedCertificates, setAwardedCertificates] = useState<any[]>([])
  const [offlineExams, setOfflineExams] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [isDownloadingId, setIsDownloadingId] = useState(false)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)

  useEffect(() => {
    if (!database || !resolvedId || !id) return

    const rootPath = `Institutes/${resolvedId}`
    setIsLoading(true)

    const studentRef = ref(database, `${rootPath}/admissions/${id}`)
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: snapshot.key })
      } else {
        setStudent(null)
      }
      setIsLoading(false)
    })

    const feesRef = ref(database, `${rootPath}/fees`)
    onValue(feesRef, (snapshot) => {
      const data = snapshot.val() || {}
      setFees(Object.values(data).filter((f: any) => f.studentId === id).reverse())
    })

    const attRef = ref(database, `${rootPath}/attendance/Student`)
    onValue(attRef, (snapshot) => {
      const data = snapshot.val() || {}
      const logs: any[] = []
      Object.keys(data).forEach(date => {
        Object.keys(data[date]).forEach(batch => {
          if (data[date][batch][id as string]) logs.push({ date, ...data[date][batch][id as string] })
        })
      })
      setAttendanceLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    })

    onValue(ref(database, `${rootPath}/marksheets`), (snapshot) => {
      const data = snapshot.val() || {}
      setMarksheets(Object.values(data).filter((m: any) => m.studentId === id))
    })

    onValue(ref(database, `${rootPath}/awarded-certificates/${id}`), (snapshot) => {
      const data = snapshot.val() || {}
      setAwardedCertificates(Object.values(data).reverse())
    })

    onValue(ref(database, `${rootPath}/offline-exams`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setOfflineExams(list.filter(e => e.assignedStudents?.[id as string]))
    })

    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.val()) {
        setInstituteProfile(s.val())
        setInstituteName(s.val().instituteName || "Your Institute")
      }
    })

    return () => {
      off(studentRef)
      off(feesRef)
      off(attRef)
    }
  }, [database, resolvedId, id])

  const totalCollected = useMemo(() => fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0), [fees])
  const pendingFees = useMemo(() => (Number(student?.netFees || 0)) - totalCollected, [student, totalCollected])

  const handleDownloadPDF = (record: any) => {
    const doc = new jsPDF()
    doc.setDrawColor(0).setLineWidth(0.5).rect(5, 5, 200, 287)
    doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(30, 58, 138)
    doc.text(instituteName.toUpperCase(), 105, 25, { align: 'center' })
    doc.setFontSize(9).setTextColor(80).setFont("helvetica", "normal")
    doc.text(instituteProfile?.address || "Institutional Academic Center", 105, 32, { align: 'center' })
    doc.text(`Email: ${instituteProfile?.email || '-'} | Web: ${instituteProfile?.websiteUrl || '-'}`, 105, 38, { align: 'center' })
    
    doc.setFillColor(30, 58, 138).rect(5.5, 50, 199, 10, 'F')
    doc.setTextColor(255).setFontSize(12).setFont("helvetica", "bold").text(record.examName.toUpperCase(), 105, 56.5, { align: 'center' })

    autoTable(doc, {
      startY: 65,
      margin: { left: 10, right: 10 },
      head: [['Candidate Details', 'Academic Info']],
      body: [[`Name: ${record.studentName.toUpperCase()}\nAdm No: ${record.enrollmentNo}\nRoll No: ${record.rollNo}`, `Class: ${record.courseName}\nSem: ${record.semester}\nYear: ${record.academicYear}`]],
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

  const generatePremiumReceipt = (payment: any) => {
    const doc = new jsPDF();
    const dueAmount = pendingFees;

    doc.setDrawColor(0).setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    doc.setFontSize(10).setTextColor(100).setFont("helvetica", "normal").text("Office Copy", 105, 18, { align: 'center' });
    doc.line(10, 22, 200, 22);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(10.5, 23, 189, 10, 'F');
    doc.setFontSize(12).setTextColor(40).setFont("helvetica", "bold");
    doc.text("Payment Receipt", 105, 29, { align: 'center' });
    doc.line(10, 33, 200, 33);

    doc.setDrawColor(230).setFillColor(255, 255, 255);
    doc.roundedRect(15, 38, 180, 45, 5, 5, 'FD');
    doc.setFontSize(16).setTextColor(40).setFont("helvetica", "bold");
    doc.text(instituteName.toUpperCase(), 105, 48, { align: 'center' });
    doc.text("your logo", 105, 60, { align: 'center' });

    doc.setFontSize(14).setTextColor(0).text("Issued to:", 15, 95);
    doc.setFontSize(10).setTextColor(0).setFont("helvetica", "bold");
    doc.text(`Name: ${student?.studentName || 'N/A'}`, 15, 105);
    doc.text(`Roll no.: ${student?.rollNo || '-'}`, 15, 112);
    doc.text(`Date: ${payment.date || '-'}`, 15, 119);
    doc.text(`Email: ${student?.email || '-'}`, 110, 105);
    doc.text(`Mob.: ${student?.mobile || '-'}`, 110, 112);
    doc.text(`Receipt No.: #${payment.receiptNo || '-'}`, 110, 119);

    autoTable(doc, {
      startY: 125,
      margin: { left: 15, right: 15 },
      head: [['Course/Class', 'Transaction Id', 'Payment Type', 'Amount']],
      body: [
        [student?.course || '-', payment.txId || '-', 'Portal Payment', `INR ${Number(payment.amount).toLocaleString()}`],
        ['', '', 'Transport Fee', `INR 0`],
        ['', '', 'Other Amount', `INR 0`],
        ['', '', 'Fine', `INR 0`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      columnStyles: { 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(0).setLineWidth(0.5);
    doc.rect(15, finalY, 40, 12); doc.setFontSize(10).text("Due Total:", 17, finalY + 8); doc.text(`INR ${dueAmount.toLocaleString()}`, 35, finalY + 8);
    doc.rect(145, finalY, 45, 12); doc.setFontSize(10).text("Total:", 147, finalY + 8); doc.setFont("helvetica", "bold").text(`INR ${Number(payment.amount).toLocaleString()}`, 165, finalY + 8);

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100);
    doc.text(`Website: ${instituteProfile?.slug ? `https://partner.digitalclassworld.com/${instituteProfile.slug}` : '-'}`, 105, finalY + 30, { align: 'center' });
    doc.text(`Address: ${instituteProfile?.address || '-'}`, 105, finalY + 37, { align: 'center' });
    doc.setFont("helvetica", "bold").text("Note: Once a fee submitted can not be refunded.", 105, finalY + 44, { align: 'center' });
    doc.setFont("helvetica", "normal").text("This is a computer-generated receipt and does not require a signature.", 105, finalY + 51, { align: 'center' });

    doc.save(`Receipt_${payment.receiptNo}.pdf`);
  }

  const handleCollectFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolvedId || !database || !student) return
    const formData = new FormData(e.currentTarget)
    const paymentData = {
      studentId: student.id,
      studentName: student.studentName,
      amount: formData.get("amount") as string,
      date: formData.get("date") as string,
      method: formData.get("method") as string,
      txId: formData.get("txId") || `TXN-${Date.now()}`,
      receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now()
    }
    try {
      await push(ref(database, `Institutes/${resolvedId}/fees`), paymentData)
      toast({ title: "Payment Recorded" })
      setIsCollectModalOpen(false)
    } catch (err) { toast({ variant: "destructive", title: "Error" }) }
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

  if (isLoading || isIdLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-widest animate-pulse">Establishing Secure Profile Sync...</div>
  if (!student) return <div className="p-20 text-center text-zinc-400 font-bold uppercase">Record Mapping Failed</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-public-sans text-black">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden text-[14px]">
        <TopNav />
        <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500 print:p-0 print:m-0">
          
          <div className="flex items-center justify-between print:hidden">
            <Button variant="ghost" onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-800 transition-none gap-2 font-bold uppercase tracking-widest text-[10px]">
              <ArrowLeft className="w-4 h-4" /> Directory
            </Button>
            <div className="flex items-center gap-3">
              <Button onClick={() => window.print()} className="bg-zinc-900 text-white rounded-lg h-10 px-6 font-bold text-xs gap-2 transition-none border-none shadow-sm">
                <Printer className="h-4 w-4" /> Print Dossier
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[32px] bg-white p-10 overflow-hidden relative print:hidden">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative group">
                <Avatar className="h-40 w-40 rounded-[48px] border-8 border-zinc-50 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={student?.studentPhotoUrl} />
                  <AvatarFallback className="bg-primary text-white text-5xl font-black">{student?.studentName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white"><ShieldCheck className="w-6 h-6" /></div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                <ProfileHeaderItem label="NAME" value={student?.studentName} />
                <ProfileHeaderItem label="ID NUMBER" value={student?.admissionNo} />
                <ProfileHeaderItem label="ROLL NO" value={student?.rollNo || '-'} />
                <ProfileHeaderItem label="CLASS" value={student?.course} />
                <ProfileHeaderItem label="BATCH" value={student?.batch} />
                <ProfileHeaderItem label="SECTION" value={student?.section || 'A'} />
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:hidden">
            <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
              <ProfileTabTrigger value="details" label="Profile" icon={<User className="w-4 h-4" />} />
              <ProfileTabTrigger value="fees" label="Fees" icon={<Wallet className="w-4 h-4" />} />
              <ProfileTabTrigger value="attendance" label="Attendance" icon={<CalendarCheck className="w-4 h-4" />} />
              <ProfileTabTrigger value="exams" label="Exams & Marks" icon={<Award className="w-4 h-4" />} />
              <ProfileTabTrigger value="certificates" label="Certificates" icon={<Award className="w-4 h-4 text-rose-500" />} />
              <ProfileTabTrigger value="idcard" label="ID Card" icon={<IdCard className="w-4 h-4 text-blue-500" />} />
            </TabsList>

            <TabsContent value="details" className="mt-8 space-y-8">
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10">
                <div className="space-y-12">
                  <SectionGrid title="Identity & Personal" icon={<Info className="text-[#0D9488]" />}>
                    <DetailBox label="GENDER" value={student?.gender} />
                    <DetailBox label="D.O.B." value={student?.dob} />
                    <DetailBox label="BLOOD GROUP" value={student?.bloodGroup} />
                    <DetailBox label="RELIGION" value={student?.religion} />
                    <DetailBox label="CATEGORY" value={student?.category} />
                    <DetailBox label="ADHAR NO" value={student?.adharNumber} />
                  </SectionGrid>
                  <SectionGrid title="Academic Mapping" icon={<GraduationCap className="text-indigo-500" />}>
                    <DetailBox label="SESSION" value={student?.session} />
                    <DetailBox label="ADMISSION DATE" value={student?.admissionDate} />
                    <DetailBox label="SOURCE" value={student?.source} />
                    <DetailBox label="MOBILE" value={student?.mobile} />
                    <DetailBox label="EMAIL" value={student?.email} />
                    <DetailBox label="QUALIFICATION" value={student?.qualification} />
                  </SectionGrid>
                  <SectionGrid title="Parent/Guardian" icon={<Users className="text-amber-500" />}>
                    <DetailBox label="FATHER NAME" value={student?.fatherName} />
                    <DetailBox label="FATHER MOBILE" value={student?.fatherMobile} />
                    <DetailBox label="MOTHER NAME" value={student?.motherName} />
                  </SectionGrid>
                  <div className="space-y-2"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ADDRESS</Label><div className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-2xl text-zinc-700 font-bold uppercase">{student?.address || '-'}</div></div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricBox label="Total Fees" value={student?.netFees} color="text-zinc-800" />
                <MetricBox label="Fees Paid" value={totalCollected} color="text-emerald-600" />
                <MetricBox label="Balance" value={pendingFees} color="text-rose-600" />
              </div>
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
                <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Transaction Ledger</h3>
                  <Button onClick={() => setIsCollectModalOpen(true)} className="bg-[#0D9488] text-white h-9 px-6 rounded-xl font-bold text-xs uppercase shadow-lg border-none active:scale-95 transition-all">Collect Fee+</Button>
                </div>
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-10 text-[10px] font-black uppercase h-14">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                      <TableHead className="text-right pr-10 text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((f, i) => (
                      <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30">
                        <TableCell className="pl-10 text-sm font-bold text-zinc-400 font-mono">{f.date}</TableCell>
                        <TableCell className="text-sm font-black text-zinc-700 uppercase">{f.method || f.paymentMode}</TableCell>
                        <TableCell className="font-black text-emerald-600">₹{Number(f.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => generatePremiumReceipt(f)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all border-none bg-transparent" title="Download Receipt"><Download className="h-4 w-4 text-emerald-600" /></button>
                            <button 
                              onClick={() => window.open(`https://wa.me/${student?.mobile?.replace(/\D/g, '')}?text=Hello *${student?.studentName}*,\n\nYour fee payment of *₹${Number(f.amount).toLocaleString()}* has been successfully recorded at *${instituteName}*.\n\nReceipt No: ${f.receiptNo || '-'}\nBalance: ₹${pendingFees.toLocaleString()}`, '_blank')}
                              className="p-2 hover:bg-zinc-100 rounded-xl transition-all border-none bg-transparent" title="Share on WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-8">
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
                <div className="p-8 border-b border-zinc-50"><h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Presence Logs</h3></div>
                <Table><TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-10 text-[10px] font-black uppercase h-14">Date</TableHead><TableHead className="text-[10px] font-black uppercase">Status</TableHead><TableHead className="text-right pr-10 text-[10px] font-black uppercase">Internal Note</TableHead></TableRow></TableHeader><TableBody>{attendanceLogs.map((log, i) => (<TableRow key={i} className="border-zinc-50"><TableCell className="pl-10 font-black text-zinc-700 font-mono text-sm">{log.date}</TableCell><TableCell><Badge className={cn("rounded-md text-[9px] font-black uppercase border-none", log.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{log.status}</Badge></TableCell><TableCell className="text-right pr-10 text-sm text-zinc-400 italic">"{log.remarks || 'No notes'}"</TableCell></TableRow>))}</TableBody></Table>
              </Card>
            </TabsContent>

            <TabsContent value="exams" className="mt-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-50 pb-2"><TrendingUp className="w-5 h-5 text-[#1e3a8a]" /><h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Marksheets</h3></div>
                  <div className="grid grid-cols-1 gap-4">
                    {marksheets.map((m, i) => (
                      <Card key={i} className="p-6 rounded-3xl border border-zinc-100 bg-white flex items-center justify-between group hover:shadow-lg transition-all">
                        <div>
                          <p className="text-sm font-black text-zinc-800 uppercase">{m.examName}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Score: {m.percentage}% • Grade {m.grade} • {m.status}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(m)} className="h-10 w-10 p-0 rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary transition-all">
                          <FileText className="w-5 h-5" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </section>
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-50 pb-2"><Search className="w-5 h-5 text-rose-500" /><h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Offline Exam Assignments</h3></div>
                  <div className="grid grid-cols-1 gap-4">
                    {offlineExams.map((e, i) => (
                      <Card key={i} className="p-6 rounded-3xl border border-zinc-100 bg-white flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-zinc-800 uppercase">{e.title}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date: {e.examDate} | {e.timing} | Marks: {e.totalMarks}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[8px] font-black">Mapped</Badge>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {awardedCertificates.map((cert, i) => (
                  <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner group-hover:bg-rose-50 transition-colors"><Award className="w-8 h-8" /></div>
                    <div className="space-y-1 mb-8"><h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight">{cert.name}</h4><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Issued: {cert.issuedDate}</p></div>
                    <Button variant="outline" className="w-full rounded-2xl h-11 border-zinc-100 text-zinc-500 font-black uppercase text-[10px] tracking-widest gap-2"><Download className="w-3.5 h-3.5" /> Get Copy</Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="idcard" className="mt-8 flex flex-col items-center gap-10">
              <div ref={cardRef} className="w-[350px] bg-white rounded-[40px] border border-zinc-100 shadow-2xl overflow-hidden flex flex-col print:m-0 print:shadow-none">
                <div className="bg-[#1e3a8a] p-8 text-center space-y-1 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <h3 className="text-white font-black uppercase text-sm tracking-widest">{instituteName}</h3>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Identity Card</p>
                </div>
                <div className="p-10 flex flex-col items-center gap-8">
                  <div className="relative">
                    <Avatar className="h-32 w-32 rounded-[40px] border-8 border-zinc-50 shadow-lg">
                      <AvatarFallback className="text-4xl font-black bg-zinc-100 text-zinc-300">{student?.studentName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-xl border-4 border-white"><ShieldCheck className="w-5 h-5" /></div>
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">{student?.studentName}</h4>
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
          </Tabs>

          <Dialog open={isCollectModalOpen} onOpenChange={setIsCollectModalOpen}>
            <DialogContent className="max-w-md p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-2xl">
              <div className="bg-[#1e3a8a] p-8 text-white"><DialogTitle className="text-xl font-black uppercase">Collect Fee</DialogTitle></div>
              <form onSubmit={handleCollectFee} className="p-8 space-y-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount (INR)</Label><Input name="amount" type="number" required className="h-12 rounded-xl font-black text-emerald-600 text-lg" defaultValue={pendingFees > 0 ? pendingFees : ""} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Method</Label><Select name="method" defaultValue="Cash"><SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem><SelectItem value="Bank">Bank Transfer</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reference / TX ID</Label><Input name="txId" placeholder="Optional..." className="h-12 rounded-xl font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</Label><Input name="date" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} className="h-12 rounded-xl font-bold" /></div>
                <Button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border-none active:scale-95">Record Payment</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* HIDDEN PRINT DOSSIER */}
          <div className="hidden print:block font-public-sans bg-white text-black p-0 m-0">
            <div className="max-w-[800px] mx-auto space-y-10">
              <div className="text-center space-y-4 border-b-4 border-black pb-8">
                <h1 className="text-4xl font-black uppercase tracking-tight">{instituteName}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Official Student Admission Dossier</p>
                <div className="flex items-center justify-center gap-6 text-sm font-bold">
                  <span>Session: {student?.session}</span>
                  <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                  <span>Academic Node: {resolvedId?.substring(0, 8)}</span>
                </div>
              </div>

              <div className="flex gap-12 items-start pt-4">
                <div className="w-40 h-48 border-4 border-black rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  {student?.studentPhotoUrl ? <img src={student.studentPhotoUrl} className="w-full h-full object-cover" alt="Student" /> : <User className="w-16 h-16 text-zinc-200" />}
                </div>
                <div className="flex-1 space-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Name of Candidate</p>
                    <h2 className="text-3xl font-black uppercase border-b-2 border-zinc-100 pb-2">{student?.studentName}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Admission Number</p><p className="text-lg font-black font-mono">{student?.admissionNo}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Roll Number</p><p className="text-lg font-black font-mono">{student?.rollNo || '-'}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Section</p><p className="text-lg font-black font-mono">{student?.section || 'A'}</p></div>
                  </div>
                </div>
              </div>

              <div className="space-y-12 pt-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] bg-zinc-900 text-white px-4 py-2 inline-block">01. Academic Enrollment Context</h3>
                  <div className="grid grid-cols-3 gap-y-8 gap-x-12">
                    <PrintDetail label="Current Class" value={student?.course} />
                    <PrintDetail label="Section" value={student?.section || 'General'} />
                    <PrintDetail label="Assigned Batch" value={student?.batch || 'Morning'} />
                    <PrintDetail label="Admission Date" value={student?.admissionDate} />
                    <PrintDetail label="Source" value={student?.source} />
                    <PrintDetail label="Registration ID" value={id as string} isMono />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] bg-zinc-900 text-white px-4 py-2 inline-block">02. Personal Identity Registry</h3>
                  <div className="grid grid-cols-3 gap-y-8 gap-x-12">
                    <PrintDetail label="Gender" value={student?.gender} />
                    <PrintDetail label="Date of Birth" value={student?.dob} />
                    <PrintDetail label="Blood Group" value={student?.bloodGroup || '-'} />
                    <PrintDetail label="Religion" value={student?.religion || '-'} />
                    <PrintDetail label="Category" value={student?.category || '-'} />
                    <PrintDetail label="Aadhar Number" value={student?.adharNumber || '-'} isMono />
                    <PrintDetail label="Mobile" value={student?.mobile} isMono />
                    <PrintDetail label="Email" value={student?.email} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] bg-zinc-900 text-white px-4 py-2 inline-block">03. Parental / Guardian Records</h3>
                  <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                    <PrintDetail label="Father's Name" value={student?.fatherName} />
                    <PrintDetail label="Father's Mobile" value={student?.fatherMobile} />
                    <PrintDetail label="Mother's Name" value={student?.motherName} />
                    <PrintDetail label="Father's Occupation" value={student?.fatherOccupation || '-'} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] bg-zinc-900 text-white px-4 py-2 inline-block">04. Residential Registry</h3>
                  <div className="p-6 border-2 border-zinc-100 rounded-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Permanent Physical Address</p>
                    <p className="text-base font-bold text-zinc-800 leading-relaxed uppercase">{student?.address || 'No address provided in registry.'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] bg-zinc-900 text-white px-4 py-2 inline-block">05. Financial Ledger Summary</h3>
                  <div className="grid grid-cols-3 gap-8 bg-zinc-50 p-8 rounded-2xl border-2 border-black">
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Academic Fee</p><p className="text-2xl font-black text-black">₹{Number(student?.netFees).toLocaleString()}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Amount Paid</p><p className="text-2xl font-black text-emerald-600">₹{totalCollected.toLocaleString()}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Current Outstanding</p><p className="text-2xl font-black text-rose-600">₹{pendingFees.toLocaleString()}</p></div>
                  </div>
                </div>
              </div>

              <div className="pt-24 flex justify-between items-end border-t border-zinc-100 mt-20">
                <div className="text-center space-y-2"><div className="w-48 h-0.5 bg-black mx-auto" /><p className="text-[10px] font-black uppercase tracking-widest">Candidate / Parent Sign</p></div>
                <div className="text-center space-y-4"><div className="w-24 h-24 border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center opacity-30"><span className="text-[10px] font-black uppercase -rotate-12 tracking-widest">Institutional Seal</span></div><div className="w-48 h-0.5 bg-black mx-auto" /><p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p></div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

function PrintDetail({ label, value, isMono = false }: { label: string, value: string | number, isMono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={cn("text-base font-bold text-black uppercase truncate border-b border-zinc-50 pb-1", isMono && "font-mono tracking-tighter")}>{value || '---'}</p>
    </div>
  )
}

function ProfileHeaderItem({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{label}</span>
      <span className="text-[15px] font-bold text-zinc-800 uppercase truncate">: {value || '-'}</span>
    </div>
  )
}

function DetailBox({ label, value }: any) {
  return (
    <div className="space-y-1.5 group">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</p>
      <div className="h-11 flex items-center px-5 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-transparent group-hover:border-zinc-100 transition-all shadow-inner uppercase">{value || '-'}</div>
    </div>
  )
}

function SectionGrid({ title, icon, children }: any) {
  return (
    <div className="space-y-8">
      <h3 className="text-base font-black text-zinc-800 flex items-center gap-3 uppercase tracking-tight border-b border-zinc-50 pb-3">{icon} {title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">{children}</div>
    </div>
  )
}

function MetricBox({ label, value, color }: any) {
  return (
    <Card className="border border-zinc-50 shadow-sm rounded-3xl bg-white p-8 group hover:shadow-md transition-all">
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      <h4 className={cn("text-2xl font-black tracking-tighter", color)}>₹{Number(value || 0).toLocaleString()}</h4>
    </Card>
  )
}

function ProfileTabTrigger({ value, label, icon }: any) {
  return (
    <TabsTrigger value={value} className="h-11 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all border border-transparent data-[state=active]:shadow-lg">{icon} {label}</TabsTrigger>
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
