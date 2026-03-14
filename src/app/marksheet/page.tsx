
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileDown, 
  X, 
  GraduationCap, 
  ShieldCheck,
  FileText,
  TrendingUp,
  Award,
  Loader2,
  Save,
  Info
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, remove, off, update } from "firebase/database"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useResolvedId } from "@/hooks/use-resolved-id"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { usePathname } from "next/navigation"

interface SubjectMark {
  id: string
  name: string
  theoryTotal: number
  theoryObtain: number
  practicalTotal: number
  practicalObtain: number
  subjectTotal: number
  subjectObtain: number
  grade: string
  result: "Pass" | "Fail"
}

export default function MarksheetPage() {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/staff') || pathname.startsWith('/student') || pathname.startsWith('/branch')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [marksheets, setMarksheets] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)

  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentPhoto, setStudentPhoto] = useState("")
  const [enrollmentNo, setEnrollmentNo] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [fatherName, setFatherName] = useState("")
  const [motherName, setMotherName] = useState("")
  const [courseName, setCourseName] = useState("")
  const [semester, setSemester] = useState("")
  const [section, setSection] = useState("")
  const [dob, setDob] = useState("")
  const [examSeatNo, setExamSeatNo] = useState("")
  const [examTitle, setExamTitle] = useState("FINAL EXAMINATION 2026")
  const [academicYear, setAcademicYear] = useState("2024-25")
  const [declarationDate, setDeclarationDate] = useState(new Date().toISOString().split('T')[0])
  const [attendancePercent, setAttendancePercent] = useState("0")
  const [remarks, setRemarks] = useState("Excellent")
  
  const [subjects, setSubjects] = useState<SubjectMark[]>([
    { id: '1', name: "", theoryTotal: 100, theoryObtain: 0, practicalTotal: 100, practicalObtain: 0, subjectTotal: 200, subjectObtain: 0, grade: "F", result: "Fail" }
  ])

  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId } = useResolvedId()

  useEffect(() => {
    if (!database || !resolvedId) return
    const rootPath = `Institutes/${resolvedId}`
    
    onValue(ref(database, `${rootPath}/marksheets`), (snapshot) => {
      const data = snapshot.val()
      if (data) setMarksheets(Object.keys(data).map(key => ({ ...data[key], id: key })).reverse())
      else setMarksheets([])
      setIsLoading(false)
    })

    onValue(ref(database, `${rootPath}/admissions`), (s) => {
      const data = s.val()
      if (data) setStudents(Object.keys(data).map(k => ({ ...data[k], id: k })))
      else setStudents([])
    })

    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.val()) {
        setInstituteProfile(s.val())
        setInstituteName(s.val().instituteName || "Your Institute")
      }
    })
  }, [database, resolvedId])

  useEffect(() => {
    if (selectedStudentId && !editingItem) {
      const s = students.find(item => item.id === selectedStudentId)
      if (s) {
        setEnrollmentNo(s.admissionNo || "")
        setRollNo(s.rollNo || "")
        setFatherName(s.fatherName || "")
        setMotherName(s.motherName || "")
        setCourseName(s.course || "")
        setSection(s.section || "")
        setDob(s.dob || "")
        setStudentPhoto(s.studentPhotoUrl || "")
      }
    }
  }, [selectedStudentId, students, editingItem])

  const calculateGrade = (obtained: number, total: number) => {
    if (total === 0) return "F"
    const percent = (obtained / total) * 100
    if (percent >= 90) return "A+"
    if (percent >= 80) return "A"
    if (percent >= 70) return "B+"
    if (percent >= 60) return "B"
    if (percent >= 50) return "C"
    if (percent >= 35) return "D"
    return "F"
  }

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { id: Date.now().toString(), name: "", theoryTotal: 100, theoryObtain: 0, practicalTotal: 100, practicalObtain: 0, subjectTotal: 200, subjectObtain: 0, grade: "F", result: "Fail" }
    ])
  }

  const handleRemoveSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id))
    }
  }

  const updateSubject = (id: string, field: keyof SubjectMark, value: any) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value }
        updated.subjectTotal = (Number(updated.theoryTotal) || 0) + (Number(updated.practicalTotal) || 0)
        updated.subjectObtain = (Number(updated.theoryObtain) || 0) + (Number(updated.practicalObtain) || 0)
        const theoryPass = (Number(updated.theoryObtain) / (Number(updated.theoryTotal) || 1)) * 100 >= 35
        const practicalPass = (Number(updated.practicalObtain) / (Number(updated.practicalTotal) || 1)) * 100 >= 35
        updated.result = (theoryPass && practicalPass) ? "Pass" : "Fail"
        updated.grade = calculateGrade(updated.subjectObtain, updated.subjectTotal)
        return updated
      }
      return s
    }))
  }

  const finalResults = useMemo(() => {
    let grandTotalMax = 0
    let grandObtained = 0
    let anyFail = false
    subjects.forEach(s => {
      grandTotalMax += s.subjectTotal
      grandObtained += s.subjectObtain
      if (s.result === "Fail") anyFail = true
    })
    const percentageVal = grandTotalMax > 0 ? (grandObtained / grandTotalMax) * 100 : 0
    const percentage = percentageVal.toFixed(2)
    const overallGrade = calculateGrade(grandObtained, grandTotalMax)
    const overallResult = (anyFail || percentageVal < 35) ? "FAIL" : "PASS"
    return { grandTotalMax, grandObtained, percentage, overallGrade, overallResult }
  }, [subjects])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedId || !database || !selectedStudentId) return
    const data = {
      studentId: selectedStudentId, studentName: students.find(s => s.id === selectedStudentId)?.studentName, studentPhoto, enrollmentNo, rollNo, fatherName, motherName, courseName, semester, section, dob, examSeatNo, examName: examTitle, academicYear, declarationDate, attendancePercent, remarks, subjects, ...finalResults, updatedAt: Date.now()
    }
    const dbPath = `Institutes/${resolvedId}/marksheets`
    try {
      if (editingItem) await update(ref(database, `${dbPath}/${editingItem.id}`), data)
      else await push(ref(database, dbPath), { ...data, createdAt: Date.now(), resultId: `RES-${Date.now().toString().slice(-6)}` })
      toast({ title: "Node Synchronized", description: "Academic transcript published." })
      setIsModalOpen(false)
    } catch (err) { toast({ variant: "destructive", title: "Sync Error" }) }
  }

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
    autoTable(doc, { startY: 65, margin: { left: 10, right: 10 }, head: [['Candidate Details', 'Academic Info']], body: [[`Name: ${record.studentName.toUpperCase()}\nAdm No: ${record.enrollmentNo}\nRoll No: ${record.rollNo}`, `Class: ${record.courseName}\nSem: ${record.semester}\nYear: ${record.academicYear}`]], theme: 'grid', styles: { fontSize: 9, cellPadding: 5 } })
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 10, margin: { left: 10, right: 10 }, head: [['Sr', 'Subject', 'Theory Max', 'Obtained', 'Practical Max', 'Obtained', 'Grade', 'Result']], body: record.subjects.map((s: any, i: number) => [i + 1, s.name.toUpperCase(), s.theoryTotal, s.theoryObtain, s.practicalTotal, s.practicalObtain, s.grade, s.result]), theme: 'grid', headStyles: { fillColor: [40, 40, 40], halign: 'center' }, styles: { fontSize: 8, halign: 'center' } })
    const finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(0)
    doc.text(`GRAND TOTAL: ${record.grandObtained} / ${record.grandTotalMax}`, 15, finalY)
    doc.text(`PERCENTAGE: ${record.percentage}%`, 15, finalY + 10)
    doc.text(`RESULT: ${record.overallResult}`, 15, finalY + 20)
    doc.save(`Transcript_${record.studentName}.pdf`)
  }

  const filteredMarksheets = useMemo(() => {
    return marksheets.filter(m => m.studentName?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [marksheets, searchTerm])

  const resetForm = () => {
    setSelectedStudentId(""); setFatherName(""); setMotherName(""); setEnrollmentNo(""); setRollNo("");
    setCourseName(""); setSemester(""); setSection(""); setDob(""); setExamSeatNo("");
    setSubjects([{ id: '1', name: "", theoryTotal: 100, theoryObtain: 0, practicalTotal: 100, practicalObtain: 0, subjectTotal: 200, subjectObtain: 0, grade: "F", result: "Fail" }]);
  }

  const loadForEdit = (item: any) => {
    setSelectedStudentId(item.studentId); setFatherName(item.fatherName || ""); setMotherName(item.motherName || "");
    setEnrollmentNo(item.enrollmentNo || ""); setRollNo(item.rollNo || ""); setCourseName(item.courseName || "");
    setSemester(item.semester || ""); setSection(item.section || ""); setDob(item.dob || "");
    setExamSeatNo(item.examSeatNo || ""); setExamTitle(item.examName || ""); setAcademicYear(item.academicYear || "");
    setDeclarationDate(item.declarationDate || ""); setAttendancePercent(item.attendancePercent || "0");
    setRemarks(item.remarks || ""); setSubjects(item.subjects || []);
  }

  const mainContent = (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 font-public-sans text-black text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-headline uppercase leading-none">Transcript Registry</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Generate and manage official academic transcripts</p>
        </div>
        <Button onClick={() => { setEditingItem(null); resetForm(); setIsModalOpen(true); }} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-lg border-none active:scale-95 transition-all">
          <Plus className="h-4 w-4 mr-2" /> Create Marksheet
        </Button>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search Registry..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-11 h-11 bg-zinc-50 border-none rounded-xl text-sm font-bold shadow-inner" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100">
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14 pl-10">Candidate Identity</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">Academic Node</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14 text-center">Percentage</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14 text-center">Outcome</TableHead>
                <TableHead className="text-right pr-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (<TableRow key={i}><TableCell colSpan={5} className="p-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-200" /></TableCell></TableRow>))
              ) : filteredMarksheets.map((row) => (
                <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/30 group transition-none">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={row.studentPhoto} />
                        <AvatarFallback className="bg-zinc-100 text-zinc-400 font-black text-xs uppercase">{row.studentName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-800 uppercase tracking-tight">{row.studentName}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">ID: {row.enrollmentNo}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-zinc-600 uppercase">{row.courseName}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{row.examName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-lg text-zinc-800">{row.percentage}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none",
                      row.overallResult === 'PASS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>{row.overallResult}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(row)} className="h-9 w-9 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><FileDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(row); loadForEdit(row); setIsModalOpen(true); }} className="h-9 w-9 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Permanently remove record?")) remove(ref(database!, `Institutes/${resolvedId}/marksheets/${row.id}`)) }} className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl sm:max-w-[95vw] flex flex-col max-h-[90vh]">
          <div className="bg-[#1e3a8a] px-10 py-8 text-white relative shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-3xl font-black uppercase tracking-tight font-headline">Academic Transcript Provisioning</DialogTitle>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Official Evaluation Protocol</p>
            </DialogHeader>
            <DialogClose className="absolute right-8 top-8 p-2 hover:bg-white/10 rounded-full transition-all border-none outline-none"><X className="h-6 w-6 text-white" /></DialogClose>
          </div>
          <ScrollArea className="flex-1">
            <form onSubmit={handleSave} className="p-10 space-y-12">
              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b pb-3">1. Candidate Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold uppercase text-black tracking-widest ml-1">Target Candidate *</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId} required>
                      <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-black text-black text-[14px]"><SelectValue placeholder="Select Student" /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                        {students.map(s => <SelectItem key={s.id} value={s.id} className="font-bold text-[14px]">{s.studentName} ({s.admissionNo})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormGroup label="FATHER NAME" value={fatherName} onChange={setFatherName} />
                  <FormGroup label="MOTHER NAME" value={motherName} onChange={setMotherName} />
                  <FormGroup label="ENROLLMENT NO" value={enrollmentNo} onChange={setEnrollmentNo} />
                  <FormGroup label="ROLL NUMBER" value={rollNo} onChange={setRollNo} />
                  <FormGroup label="DOB" type="date" value={dob} onChange={setDob} />
                  <FormGroup label="COURSE NAME" value={courseName} onChange={setCourseName} />
                  <FormGroup label="SEMESTER / YEAR" value={semester} onChange={setSemester} />
                  <FormGroup label="SECTION" value={section} onChange={setSection} />
                  <FormGroup label="EXAM SEAT NO" value={examSeatNo} onChange={setExamSeatNo} />
                  <FormGroup label="ACADEMIC YEAR" value={academicYear} onChange={setAcademicYear} />
                  <FormGroup label="EXAM TITLE" value={examTitle} onChange={setExamTitle} />
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.3em]">2. Performance Matrix</h3>
                  <Button type="button" onClick={handleAddSubject} variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-blue-100 text-[#1e3a8a] hover:bg-blue-50">+ Add Subject Node</Button>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-zinc-100">
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-12">SUBJECT DESCRIPTION</TableHead>
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">THEORY MAX</TableHead>
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">THEORY OBT</TableHead>
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">PRACTICAL MAX</TableHead>
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">PRACTICAL OBT</TableHead>
                        <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">GRADE</TableHead>
                        <TableHead className="text-right pr-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">OUTCOME</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((s) => (
                        <TableRow key={s.id} className="border-zinc-50">
                          <TableCell className="w-[300px]"><Input value={s.name} onChange={e => updateSubject(s.id, 'name', e.target.value)} placeholder="e.g. Mathematics" className="h-11 rounded-xl font-bold uppercase text-[14px]" /></TableCell>
                          <TableCell><Input type="number" value={s.theoryTotal} onChange={e => updateSubject(s.id, 'theoryTotal', Number(e.target.value))} className="h-11 text-center font-bold text-[14px]" /></TableCell>
                          <TableCell><Input type="number" value={s.theoryObtain} onChange={e => updateSubject(s.id, 'theoryObtain', Number(e.target.value))} className="h-11 text-center font-black text-primary text-[14px]" /></TableCell>
                          <TableCell><Input type="number" value={s.practicalTotal} onChange={e => updateSubject(s.id, 'practicalTotal', Number(e.target.value))} className="h-11 text-center font-bold text-[14px]" /></TableCell>
                          <TableCell><Input type="number" value={s.practicalObtain} onChange={e => updateSubject(s.id, 'practicalObtain', Number(e.target.value))} className="h-11 text-center font-black text-primary text-[14px]" /></TableCell>
                          <TableCell className="text-center font-black text-lg">{s.grade}</TableCell>
                          <TableCell className="text-right pr-4">
                            <Badge className={cn(
                              "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase",
                              s.result === 'Pass' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>{s.result}</Badge>
                          </TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSubject(s.id)} className="text-rose-500 hover:bg-rose-50 transition-none outline-none border-none"><Trash2 className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-zinc-900 p-10 rounded-[40px] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 flex-1 w-full relative z-10">
                  <SummaryItem label="AGG. MAX" value={finalResults.grandTotalMax} />
                  <SummaryItem label="AGG. OBTAINED" value={finalResults.grandObtained} color="text-primary" />
                  <SummaryItem label="PERCENTAGE" value={`${finalResults.percentage}%`} />
                  <SummaryItem label="RESULT" value={finalResults.overallResult} color={finalResults.overallResult === 'PASS' ? "text-emerald-400" : "text-rose-400"} />
                </div>
                <Button type="submit" className="h-16 px-16 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all">
                  <Save className="w-5 h-5 mr-3" /> Commit Registry
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  )

  if (isPortal) return mainContent

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body overflow-x-hidden">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        {mainContent}
      </div>
    </div>
  )
}

function FormGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-bold uppercase text-black tracking-widest ml-1">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold text-black text-[14px]" />
    </div>
  )
}

function SummaryItem({ label, value, color }: any) {
  return (
    <div className="space-y-1 text-center">
      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
      <h4 className={cn("text-2xl font-black tracking-tight", color || "text-white")}>{value}</h4>
    </div>
  )
}

function ProfileTabTrigger({ value, label, icon }: any) {
  return (
    <TabsTrigger value={value} className="h-11 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all border border-transparent data-[state=active]:shadow-lg">{icon} {label}</TabsTrigger>
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
