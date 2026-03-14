
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Trash2, 
  Edit2, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Upload, 
  X, 
  Filter, 
  Loader2, 
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, update, remove, off, set } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export default function OfflineMarksPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [marks, setMarks] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [instituteName, setInstituteName] = useState("Your Institute")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!database || !user?.uid) return
    const rootPath = `Institutes/${user.uid}`
    
    // Fetch Marks
    onValue(ref(database, `${rootPath}/offline-marks`), (snapshot) => {
      const data = snapshot.val() || {}
      setMarks(Object.keys(data).map(k => ({ ...data[k], id: k })).reverse())
      setIsLoading(false)
    })

    // Fetch Students for Sample CSV
    onValue(ref(database, `${rootPath}/admissions`), (snapshot) => {
      const data = snapshot.val() || {}
      setStudents(Object.keys(data).map(k => ({ ...data[k], id: k })))
    })

    onValue(ref(database, `${rootPath}/profile/instituteName`), (s) => {
      if (s.exists()) setInstituteName(s.val())
    })
  }, [database, user?.uid])

  const filteredMarks = useMemo(() => {
    return marks.filter(m => {
      const matchSearch = !searchTerm || 
        m.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchDate = true
      if (fromDate || toDate) {
        try {
          const examDate = parseISO(m.examDate)
          const start = fromDate ? startOfDay(parseISO(fromDate)) : null
          const end = toDate ? endOfDay(parseISO(toDate)) : null
          if (start && end) matchDate = isWithinInterval(examDate, { start, end })
          else if (start) matchDate = examDate >= start
          else if (end) matchDate = examDate <= end
        } catch (e) { matchDate = true }
      }
      return matchSearch && matchDate
    })
  }, [marks, searchTerm, fromDate, toDate])

  const paginated = filteredMarks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredMarks.length / itemsPerPage)

  const resetFilters = () => {
    setSearchTerm("")
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  const downloadSampleCSV = () => {
    if (students.length === 0) {
      toast({ variant: "destructive", title: "No students", description: "Register students first to generate a sample sheet." })
      return
    }
    const data = students.map(s => ({
      "Student ID": s.id,
      "Roll No": s.rollNo || '-',
      "Admission No": s.admissionNo || '-',
      "Name": s.studentName,
      "Class": s.course || s.class || '-',
      "Batch": s.batch || '-',
      "Subject": "Enter Subject",
      "Exam Date": format(new Date(), "yyyy-MM-dd"),
      "Max Marks": "100",
      "Min Marks": "33",
      "Obtained Marks": "0"
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Marking Sheet")
    XLSX.writeFile(wb, "offline_marks_template.csv")
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid || !database) return
    setIsSubmitting(true)
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname])
        const dbPath = `Institutes/${user.uid}/offline-marks`
        
        for (const row of data as any[]) {
          if (!row["Student ID"]) continue;

          const markData = {
            studentId: row["Student ID"],
            studentName: row["Name"] || "N/A",
            admissionNo: row["Admission No"] || "-",
            rollNo: row["Roll No"] || "-",
            class: row["Class"] || "-",
            batch: row["Batch"] || "-",
            subject: row["Subject"] || "General",
            examDate: row["Exam Date"] || format(new Date(), "yyyy-MM-dd"),
            maxMarks: Number(row["Max Marks"]) || 100,
            minMarks: Number(row["Min Marks"]) || 33,
            obtainedMarks: Number(row["Obtained Marks"]) || 0,
            status: Number(row["Obtained Marks"]) >= (Number(row["Min Marks"]) || 33) ? "Pass" : "Fail",
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          await push(ref(database, dbPath), markData)
        }
        toast({ title: "Import Successful", description: `${data.length} results recorded.` })
      } catch (err) {
        toast({ variant: "destructive", title: "Import Failed" })
      } finally {
        setIsSubmitting(false)
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ""
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredMarks.map((m, i) => ({
      "SR NO.": i + 1,
      "NAME": m.studentName,
      "ADM NO": m.admissionNo,
      "CLASS": m.class,
      "SUBJECT": m.subject,
      "EXAM DATE": m.examDate,
      "MAX MARKS": m.maxMarks,
      "OBTAINED MARKS": m.obtainedMarks,
      "RESULT": m.status
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Offline Marks")
    XLSX.writeFile(wb, `Offline_Marks_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20).setTextColor(13, 148, 136).text(instituteName, 14, 20)
    doc.setFontSize(12).setTextColor(100).text(`Offline Examination Results - ${format(new Date(), "PP")}`, 14, 30)
    
    const tableData = filteredMarks.map((m, i) => [
      i + 1, m.studentName, m.admissionNo, m.subject, m.examDate, m.maxMarks, m.obtainedMarks, m.status
    ])

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Name', 'ADM No', 'Subject', 'Date', 'Max', 'Obtained', 'Result']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }
    })
    doc.save(`Offline_Marks_Report.pdf`)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-public-sans text-black">
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 min-w-0 overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500 text-[14px]">
          
          <Card className="border border-zinc-100 shadow-sm rounded-2xl bg-white p-8">
            <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight mb-8">Select Criteria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">From Date</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-12 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">To Date</Label>
                <div className="flex gap-4">
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-12 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold flex-1" />
                  <Button onClick={resetFilters} className="bg-[#FF5C5C] hover:bg-rose-600 text-white rounded-xl px-8 h-12 font-bold uppercase text-[11px] tracking-widest border-none transition-all active:scale-95 shadow-lg">Reset</Button>
                  <Button className="bg-black hover:bg-zinc-800 text-white rounded-xl px-10 h-12 font-bold uppercase text-[11px] tracking-widest border-none transition-all active:scale-95 shadow-lg">Search</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Mark List</h3>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={downloadSampleCSV} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Download Sample CSV</button>
                  <span className="text-zinc-200">|</span>
                  <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-[#0D9488] hover:underline uppercase tracking-widest flex items-center gap-1.5">
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Import CSV Marks
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300" />
                  <Input 
                    placeholder="Search Data...." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-11 rounded-xl pl-12 border-zinc-100 bg-zinc-50/50 font-bold text-black" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportExcel} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border-none"><FileSpreadsheet className="w-5 h-5" /></button>
                  <button onClick={exportPDF} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border-none"><FileText className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-zinc-100">
                    <TableHead className="pl-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">SR NO.</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">NAME</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">ADM NO</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">SUBJECT</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">EXAM DATE</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">MAXIMUM MARKS</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">OBTAINED MARKS</TableHead>
                    <TableHead className="text-right pr-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={8} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-200" /></TableCell></TableRow>
                    ))
                  ) : paginated.map((row, index) => (
                    <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/20 transition-none group">
                      <TableCell className="pl-10 font-bold text-zinc-400">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell><span className="text-sm font-bold text-zinc-800 uppercase font-headline">{row.studentName}</span></TableCell>
                      <TableCell className="text-sm font-bold text-zinc-500 uppercase">{row.admissionNo}</TableCell>
                      <TableCell className="text-sm font-black text-primary uppercase">{row.subject}</TableCell>
                      <TableCell className="text-sm font-bold text-zinc-400 font-mono tracking-tighter">{row.examDate}</TableCell>
                      <TableCell className="font-bold text-zinc-400 text-center">{row.maxMarks}</TableCell>
                      <TableCell className="font-black text-[#1e3a8a] text-center">{row.obtainedMarks}</TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-zinc-300 hover:text-blue-600 transition-all border-none bg-transparent"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => remove(ref(database!, `Institutes/${user?.uid}/offline-marks/${row.id}`))} className="p-2 text-zinc-300 hover:text-rose-600 transition-all border-none bg-transparent"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMarks.length === 0 && !isLoading && (
                    <TableRow><TableCell colSpan={8} className="h-64 text-center text-zinc-300 italic uppercase tracking-widest">No marks recorded in registry</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-black transition-all">
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                      currentPage === i + 1 ? "bg-primary text-white shadow-xl scale-110" : "bg-white border border-zinc-100 text-zinc-400"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-black transition-all">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FormSelect({ label, name, options, onManage, defaultValue, required = false }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <Label className="text-[12px] font-medium text-black">{label} {required && "*"}</Label>
        <button type="button" onClick={onManage} className="text-[9px] font-bold text-blue-600 hover:underline">Manage <Settings2 className="w-2.5 h-2.5 inline" /></button>
      </div>
      <Select name={name} defaultValue={defaultValue} required={required}>
        <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-normal text-zinc-800 focus:ring-primary transition-none bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">{options.map((opt: any) => (<SelectItem key={opt.id} value={opt.value} className="rounded-lg">{opt.value}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  )
}
