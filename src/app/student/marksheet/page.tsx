
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  XCircle,
  Search,
  User
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { useResolvedId } from "@/hooks/use-resolved-id"

export default function StudentMarksheetPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, staffId: studentId, isLoading: idLoading } = useResolvedId()
  
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [offlineMarks, setOfflineMarks] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!database || !resolvedId || !studentId) {
      if (!idLoading && !studentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${resolvedId}`
    
    // 1. Fetch Institute Identity
    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.exists()) {
        const data = s.val()
        setInstituteProfile(data)
        setInstituteName(data.instituteName || "Your Institute")
      }
    })

    // 2. Fetch Student Info
    onValue(ref(database, `${rootPath}/admissions/${studentId}`), (s) => {
      if (s.exists()) setStudent({ ...s.val(), id: studentId })
    })

    // 3. Fetch Formal Marksheets
    onValue(ref(database, `${rootPath}/marksheets`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      // Filter marks strictly by the resolved student admission key
      setMarksheets(list.filter((m: any) => m.studentId === studentId).reverse())
      setIsLoading(false)
    })

    // 4. Fetch Individual Subject Scores (Assessment Hub)
    onValue(ref(database, `${rootPath}/offline-marks`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setOfflineMarks(list.filter((m: any) => m.studentId === studentId).reverse())
    })

    return () => {
      off(ref(database, `${rootPath}/profile`))
      off(ref(database, `${rootPath}/marksheets`))
      off(ref(database, `${rootPath}/offline-marks`))
    }
  }, [database, resolvedId, studentId, idLoading])

  const handleDownloadPDF = (record: any) => {
    const doc = new jsPDF()
    const instName = (instituteName || "Your Institute").toUpperCase()
    
    // 1. Background and Border
    doc.setFillColor(253, 251, 240); // Formal Cream background
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setDrawColor(0).setLineWidth(0.8).rect(5, 5, 200, 287); // Outer thick border
    doc.setDrawColor(0).setLineWidth(0.2).rect(7, 7, 196, 283); // Inner thin border

    // 2. Arched Institute Name (High Fidelity Branding)
    doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(0);
    const centerX = 105;
    const centerY = 65;
    const radius = 50;
    const startAngle = -140; 
    const endAngle = -40;   
    const step = (endAngle - startAngle) / (instName.length - 1);

    for (let i = 0; i < instName.length; i++) {
      const angle = startAngle + (i * step);
      const angleRad = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const rotation = angle + 90;
      doc.text(instName[i], x, y, { angle: rotation, align: 'center' });
    }

    // 3. Official Header
    doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(0);
    doc.text(`OFFICIAL MARK SHEET - ${record.examName?.toUpperCase() || 'EXAMINATION'}`, 105, 65, { align: 'center' });

    // 4. Student Dossier (Dotted Lines Style)
    doc.setFontSize(10).setFont("helvetica", "bold");
    const labelX1 = 15, labelX2 = 110;
    
    // Line 1: Name & Roll
    doc.text(`STUDENT NAME:`, labelX1, 80);
    doc.setFont("helvetica", "normal").text(`${record.studentName?.toUpperCase() || ''}`, 50, 80);
    doc.setLineDash([0.5, 0.5]).line(50, 81, 105, 81).setLineDash([]);

    doc.setFont("helvetica", "bold").text(`ROLL NUMBER:`, labelX2, 80);
    doc.setFont("helvetica", "normal").text(`${record.rollNo || '-'}`, 145, 80);
    doc.setLineDash([0.5, 0.5]).line(145, 81, 195, 81).setLineDash([]);

    // Line 2: Parents
    doc.setFont("helvetica", "bold").text(`MOTHER'S NAME:`, labelX1, 90);
    doc.setFont("helvetica", "normal").text(`${(record.motherName || '').toUpperCase()}`, 50, 90);
    doc.setLineDash([0.5, 0.5]).line(50, 91, 105, 91).setLineDash([]);

    doc.setFont("helvetica", "bold").text(`FATHER'S NAME:`, labelX2, 90);
    doc.setFont("helvetica", "normal").text(`${(record.fatherName || '').toUpperCase()}`, 145, 90);
    doc.setLineDash([0.5, 0.5]).line(145, 91, 195, 91).setLineDash([]);

    // Line 3: DOB & Course
    doc.setFont("helvetica", "bold").text(`DATE OF BIRTH:`, labelX1, 100);
    doc.setFont("helvetica", "normal").text(`${record.dob || '-'}`, 50, 100);
    doc.setLineDash([0.5, 0.5]).line(50, 101, 105, 101).setLineDash([]);

    doc.setFont("helvetica", "bold").text(`ENROLLMENT:`, labelX2, 100);
    doc.setFont("helvetica", "normal").text(`${record.enrollmentNo || '-'}`, 145, 100);
    doc.setLineDash([0.5, 0.5]).line(145, 101, 195, 101).setLineDash([]);

    // 5. Marks Table
    autoTable(doc, {
      startY: 115,
      margin: { left: 15, right: 15 },
      head: [['CODE', 'SUBJECT NAME', 'THEORY (100)', 'PRAC (20/50)', 'TOTAL (120)', 'GRADE', 'REMARKS']],
      body: record.subjects.map((s: any) => [
        s.code || '-', 
        s.name.toUpperCase(), 
        s.theoryObtain, 
        s.practicalObtain, 
        s.subjectObtain, 
        s.grade, 
        s.remarks || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255], fontSize: 7, halign: 'center', cellPadding: 3 },
      bodyStyles: { fillColor: [255, 255, 255], fontSize: 8, halign: 'center', textColor: [0], lineWidth: 0.1 },
      columnStyles: { 1: { halign: 'left' } }
    });

    // 6. Summary Section
    const summaryY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(0).rect(15, summaryY, 180, 8, 'F');
    doc.setTextColor(255).setFontSize(9).setFont("helvetica", "bold").text("OVERALL PERFORMANCE SUMMARY", 105, summaryY + 5.5, { align: 'center' });
    
    autoTable(doc, {
      startY: summaryY + 8,
      margin: { left: 15, right: 15 },
      body: [[
        `GRAND TOTAL: ${record.grandObtained} / ${record.grandTotalMax}`,
        `PERCENTAGE: ${record.percentage}%`,
        `GRADE: ${record.overallGrade}`,
        `RESULT: ${record.overallResult}`
      ]],
      theme: 'grid',
      bodyStyles: { fontSize: 9, fontStyle: 'bold', halign: 'center', fillColor: [255, 255, 255], textColor: [0] }
    });

    // 7. Signatures
    const footerY = (doc as any).lastAutoTable.finalY + 30;
    doc.setTextColor(0).setFontSize(9).setFont("helvetica", "bold");
    doc.line(15, footerY, 70, footerY);
    doc.text("PRINCIPAL SIGNATURE", 42.5, footerY + 5, { align: 'center' });

    doc.line(140, footerY, 195, footerY);
    doc.text("EXAM CONTROLLER", 167.5, footerY + 5, { align: 'center' });

    // 8. Grading Scale Node
    const scaleY = 245;
    doc.setFillColor(0).rect(15, scaleY, 180, 6, 'F');
    doc.setTextColor(255).setFontSize(8).text("GRADE POINT AND GRADING SCALE", 105, scaleY + 4.5, { align: 'center' });
    
    autoTable(doc, {
      startY: scaleY + 6,
      margin: { left: 15, right: 15 },
      body: [
        ['A+: DISTINCTION (90-100)', 'B+: FIRST CLASS (70-79)', 'C: SECOND CLASS (50-59)', 'F: FAIL (<35)'],
        ['A: EXCELLENT (80-89)', 'B: ABOVE AVERAGE (60-69)', 'D: PASS (35-49)', '']
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 7, halign: 'left', cellPadding: 2, fillColor: [255, 255, 255], textColor: [0] }
    });

    doc.save(`Transcript_${record.studentName}_${record.examName}.pdf`);
  }

  const filteredMarksheets = useMemo(() => {
    return marksheets.filter(m => m.examName?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [marksheets, searchTerm])

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Syncing Academic Registry...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 font-public-sans text-black text-[14px]">
      
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[28px] bg-indigo-50 flex items-center justify-center text-[#1e3a8a] shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight">Academic Transcripts</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Official Evaluation Dossier for {student?.studentName}</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Examination..." 
              className="pl-12 h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-bold" 
            />
          </div>
        </div>
      </Card>

      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-zinc-50 pb-3 px-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Formal Marksheets</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMarksheets.map((m, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                m.overallResult === 'PASS' ? "bg-emerald-500" : "bg-rose-500"
              )} />
              
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase border-none",
                      m.overallResult === 'PASS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>{m.overallResult}</Badge>
                    <h4 className="text-xl font-black text-zinc-800 uppercase tracking-tight line-clamp-1">{m.examName}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.academicYear} • Year {m.semester}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 shadow-inner group-hover:bg-blue-50 group-hover:text-primary transition-all">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Aggregate</p>
                    <p className="text-lg font-black text-zinc-800">{m.grandObtained} / {m.grandTotalMax}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Percentage</p>
                    <p className="text-lg font-black text-emerald-600">{m.percentage}%</p>
                  </div>
                </div>

                <Button 
                  onClick={() => handleDownloadPDF(m)}
                  className="w-full h-12 bg-zinc-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 border-none gap-2"
                >
                  <FileDown className="w-4 h-4" /> Download Official PDF
                </Button>
              </div>
            </Card>
          ))}

          {filteredMarksheets.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No formal marksheets found in your registry</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6 pt-10">
        <div className="flex items-center gap-3 border-b border-zinc-50 pb-2 px-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Continuous Assessment Hub</h3>
        </div>
        
        <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="pl-10 text-[10px] font-black uppercase h-14">Subject Descriptor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-center">Exam Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-center">Score Captured</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase">Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offlineMarks.map((m, i) => (
                  <TableRow key={i} className="border-zinc-50 group hover:bg-zinc-50/20 transition-all">
                    <TableCell className="pl-10 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-zinc-800 uppercase tracking-tight">{m.subject}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.class} • {m.batch}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold text-zinc-500 font-mono">{m.examDate}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-base font-black text-[#1e3a8a]">{m.obtainedMarks} / {m.maxMarks}</span>
                        <span className="text-[8px] font-black text-zinc-300 uppercase">Obtained</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge className={cn(
                        "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none",
                        m.status === 'Pass' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>{m.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {offlineMarks.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-zinc-300 italic uppercase text-[10px] tracking-widest">Assessment hub is currently empty</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </main>
  )
}

function ProfileTabTrigger({ value, label, icon }: any) {
  return (
    <TabsTrigger 
      value={value} 
      className="h-11 px-6 rounded-xl data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all border border-transparent data-[state=active]:shadow-lg"
    >
      <span className="flex items-center gap-2">{icon} {label}</span>
    </TabsTrigger>
  )
}
