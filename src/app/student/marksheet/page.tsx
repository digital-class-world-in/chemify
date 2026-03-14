
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileDown, 
  GraduationCap, 
  ShieldCheck, 
  CheckCircle2,
  FileText,
  TrendingUp,
  Download,
  Award,
  Loader2,
  History,
  XCircle
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export default function StudentMarksheetPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [offlineMarks, setOfflineMarks] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)

  useEffect(() => {
    if (!database || !user) return
    
    // Resolve Student Identity from Local Session
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('student_session') : null
    const session = sessionStr ? JSON.parse(sessionStr) : null
    const currentResolvedId = session?.adminUid
    const currentStudentId = session?.studentId

    if (!currentResolvedId || !currentStudentId) {
      setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${currentResolvedId}`
    
    // Fetch Student Info
    onValue(ref(database, `${rootPath}/admissions/${currentStudentId}`), (s) => {
      if (s.exists()) setStudent({ ...s.val(), id: currentStudentId })
    })

    // Fetch Formal Marksheets
    onValue(ref(database, `${rootPath}/marksheets`), (snapshot) => {
      const data = snapshot.val() || {}
      // Robust filtering by student ID
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setMarksheets(list.filter((m: any) => m.studentId === currentStudentId))
      setIsLoading(false)
    })

    // Fetch Offline Assessment Scores
    onValue(ref(database, `${rootPath}/offline-marks`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setOfflineMarks(list.filter((m: any) => m.studentId === currentStudentId))
    })

    // Fetch Institute Identity
    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.val()) {
        setInstituteProfile(s.val())
        setInstituteName(s.val().instituteName || "Your Institute")
      }
    })
  }, [database, user])

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

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Establishing Node Sync...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 font-public-sans text-black text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-headline uppercase">My Results</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Verified academic transcripts from the institutional node</p>
        </div>
      </div>

      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-50 pb-2">
            <ShieldCheck className="w-5 h-5 text-[#1e3a8a]" />
            <h3 className="text-[15px] font-black uppercase tracking-widest">Formal Transcripts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {marksheets.map((m, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-[#1e3a8a] shadow-inner">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <Badge className={cn(
                    "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none",
                    m.overallResult === 'PASS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>{m.overallResult}</Badge>
                </div>
                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight leading-tight">{m.examName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div className="space-y-1"><p>Score</p><p className="text-sm font-black text-zinc-700">{m.grandObtained} / {m.grandTotalMax}</p></div>
                    <div className="space-y-1"><p>Percentage</p><p className="text-sm font-black text-emerald-600">{m.percentage}%</p></div>
                  </div>
                </div>
                <Button onClick={() => handleDownloadPDF(m)} className="w-full rounded-2xl h-12 bg-zinc-900 text-white font-black uppercase text-[10px] tracking-widest gap-2 active:scale-95 transition-all">
                  <Download className="w-4 h-4" /> Get Transcript PDF
                </Button>
              </Card>
            ))}
            {marksheets.length === 0 && (
              <div className="col-span-full py-20 text-center text-zinc-300 italic uppercase text-[10px] tracking-widest">No formal transcripts published in registry</div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-50 pb-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-[15px] font-black uppercase tracking-widest">Assessment Scores</h3>
          </div>
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="pl-10 text-[10px] font-black uppercase h-14">Subject</TableHead>
                  <TableHead className="text-[10px] font-black uppercase h-14 text-center">Marks</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase h-14">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offlineMarks.map((m, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="pl-10 py-4 font-bold text-zinc-700 uppercase">{m.subject}</TableCell>
                    <TableCell className="text-center font-black text-[#1e3a8a]">{m.obtainedMarks} / {m.maxMarks}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge className={cn(
                        "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase border-none",
                        m.status === 'Pass' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>{m.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {offlineMarks.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="h-32 text-center text-zinc-300 italic uppercase text-[10px] tracking-widest">No scores found in registry</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </section>
      </div>
    </main>
  )
}
