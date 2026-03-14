
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { 
  FileDown, 
  Clock, 
  Calendar, 
  Printer, 
  X, 
  Info,
  CalendarCheck,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  History,
  FileText,
  CheckCircle2,
  XCircle,
  Award
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function StudentOfflineExamListPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, staffId: studentId, isLoading: idLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [offlineMarks, setOfflineMarks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingExam, setViewingExam] = useState<any>(null)
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false)
  const [instituteName, setInstituteName] = useState("Your Institute")

  useEffect(() => {
    if (!database || !resolvedId || !studentId) {
      if (!idLoading && !studentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${resolvedId}`
    
    // 1. Fetch Institute Meta
    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.val()?.instituteName) setInstituteName(s.val().instituteName)
    })

    // 2. Fetch Student Profile
    onValue(ref(database, `${rootPath}/admissions/${studentId}`), (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: studentId })
      }
    })

    // 3. Fetch Assigned Offline Exams
    const examsRef = ref(database, `${rootPath}/offline-exams`)
    onValue(examsRef, (s) => {
      const data = s.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      const assigned = list.filter(e => e.assignedStudents?.[studentId])
      setExams(assigned)
    })

    // 4. Fetch Offline Marks Results
    const marksRef = ref(database, `${rootPath}/offline-marks`)
    const unsubMarks = onValue(marksRef, (s) => {
      const data = s.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      // Filter marks strictly by the resolved student admission key
      const myMarks = list.filter(m => m.studentId === studentId)
      setOfflineMarks(myMarks.reverse())
      setIsLoading(false)
    })

    return () => {
      off(examsRef)
      off(marksRef)
    }
  }, [database, resolvedId, studentId, idLoading])

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-[0.3em] animate-pulse">Establishing Secure Paper Registry...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 font-public-sans text-black">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight leading-none">Paper Assessments</h2>
          <p className="text-sm text-zinc-400 font-medium">Access your offline examination schedule and evaluated scorecards</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <CalendarCheck className="w-5 h-5 text-[#1e3a8a]" />
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Academic Status</p>
            <p className="text-sm font-black text-zinc-700 uppercase">Synchronized</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {exams.map((exam) => (
          <Card key={exam.id} className="border-none shadow-xl rounded-[32px] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="h-2 w-full bg-[#1e3a8a]" />
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge className="bg-blue-50 text-[#1e3a8a] border-none text-[9px] font-black uppercase tracking-widest mb-2 px-3 py-1">Assigned</Badge>
                  <h4 className="text-xl font-black text-zinc-800 uppercase tracking-tight leading-tight">{exam.title}</h4>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{exam.class} • Section {exam.section}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-[#1e3a8a] shadow-inner group-hover:bg-blue-50 transition-colors">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ExamMeta icon={<Calendar className="w-3.5 h-3.5" />} label="Exam Date" value={exam.examDate} />
                <ExamMeta icon={<Clock className="w-3.5 h-3.5" />} label="Start Time" value={exam.timing} />
                <ExamMeta icon={<TrendingUp className="w-3.5 h-3.5" />} label="Total Marks" value={exam.totalMarks || 100} />
                <ExamMeta icon={<FileText className="w-3.5 h-3.5" />} label="Papers" value={exam.sections?.length || 0} />
              </div>

              <Button 
                onClick={() => { setViewingExam(exam); setIsPaperModalOpen(true); }}
                className="w-full h-14 bg-[#1e3a8a] hover:bg-[#162e6a] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all active:scale-95 border-none"
              >
                View Question Paper <FileDown className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {exams.length === 0 && (
          <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
            <div className="w-20 h-20 bg-zinc-50 rounded-[28px] flex items-center justify-center mx-auto text-zinc-200">
              <History className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Dossier Empty</h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto font-medium uppercase tracking-widest leading-relaxed">No assigned offline examinations were found in your record.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🏅 RESULTS REGISTRY SECTION */}
      <section className="space-y-6 pt-10">
        <div className="flex items-center gap-3 px-2 border-b border-zinc-50 pb-3">
          <Award className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Academic Performance Registry (Offline)</h3>
        </div>
        
        <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="pl-10 text-[10px] font-black uppercase h-14">SR NO.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase h-14">Subject Description</TableHead>
                  <TableHead className="text-[10px] font-black uppercase h-14 text-center">Exam Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase h-14 text-center">Score Card</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase h-14">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offlineMarks.map((m, i) => (
                  <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/20 transition-all">
                    <TableCell className="pl-10 font-bold text-zinc-400">{i + 1}</TableCell>
                    <TableCell className="py-6">
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
                        <span className="text-[8px] font-black text-zinc-300 uppercase">Points Captured</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge className={cn(
                        "rounded-lg px-4 py-1.5 text-[9px] font-black uppercase border-none shadow-sm gap-2",
                        m.status === 'Pass' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {m.status === 'Pass' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {offlineMarks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-zinc-300 italic uppercase text-[10px] tracking-widest">
                      Your examination scores will be recorded here after manual evaluation and administrative upload.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      <Dialog open={isPaperModalOpen} onOpenChange={setIsPaperModalOpen}>
        <DialogContent className="max-w-[900px] p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
          <div className="bg-white px-10 py-6 border-b border-zinc-100 flex items-center justify-between print:hidden">
            <div>
              <DialogTitle className="text-xl font-black uppercase text-zinc-800 tracking-tight">Question Paper Preview</DialogTitle>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Official Academic Assessment</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => window.print()} className="bg-[#1e3a8a] hover:bg-[#162e6a] text-white h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-none transition-all shadow-lg">
                <Printer className="h-4 w-4 mr-2" /> Print Paper
              </Button>
              <DialogClose className="p-2 hover:bg-zinc-50 rounded-full transition-none outline-none border-none"><X className="h-6 w-6 text-zinc-400" /></DialogClose>
            </div>
          </div>
          <ScrollArea className="max-h-[80vh] print:max-h-none print:overflow-visible bg-zinc-50/30">
            <div className="p-16 print:p-0">
              <div className="bg-white border-4 border-zinc-900 p-16 min-h-[1000px] flex flex-col print:border-none print:p-0 print:shadow-none shadow-2xl relative">
                <div className="text-center space-y-4 border-b-4 border-zinc-900 pb-12 mb-12">
                  <h1 className="text-5xl font-black text-zinc-900 uppercase tracking-tight font-headline">{instituteName}</h1>
                  <div className="flex items-center justify-center gap-6 text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">
                    <span>Session 2024 - 2025</span>
                    <span className="w-2 h-2 bg-zinc-300 rounded-full" />
                    <span>Physical Assessment</span>
                  </div>
                  <h2 className="text-2xl font-black text-white bg-zinc-900 inline-block px-12 py-4 uppercase tracking-[0.2em]">{viewingExam?.title || "EXAMINATION"}</h2>
                </div>

                <div className="grid grid-cols-3 gap-16 mb-16 uppercase font-headline">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 tracking-widest">CANDIDATE NAME</p>
                    <p className="text-xl font-black text-zinc-800 border-b-2 border-zinc-200 pb-2">{student?.studentName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 tracking-widest">ROLL NUMBER</p>
                    <p className="text-xl font-black text-zinc-800 border-b-2 border-zinc-200 pb-2">{student?.rollNo || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 tracking-widest">CLASS / SECTION</p>
                    <p className="text-xl font-black text-zinc-800 border-b-2 border-zinc-200 pb-2">{viewingExam?.class} - {viewingExam?.section}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-20">
                  {viewingExam?.sections?.map((s: any, idx: number) => (
                    <div key={idx} className="space-y-10">
                      <div className="flex items-center justify-between border-b-4 border-zinc-900 pb-3">
                        <h3 className="text-xl font-black text-zinc-900 uppercase tracking-widest">{s.title}</h3>
                        <p className="text-sm font-black text-zinc-500 uppercase">[{s.questionCount} Q x {s.marksPerQuestion} M = {Number(s.questionCount) * Number(s.marksPerQuestion)} Marks]</p>
                      </div>
                      <div className="space-y-12">
                        {[...Array(Number(s.questionCount))].map((_, i) => (
                          <div key={i} className="flex gap-8 items-start">
                            <span className="text-xl font-black text-zinc-900 min-w-[40px] pt-1">Q.{i + 1}</span>
                            <div className="flex-1 border-b-2 border-zinc-100 border-dashed pb-10">
                              <p className="text-lg font-black text-zinc-200 uppercase tracking-[0.5em] italic">Write your answer here...</p>
                            </div>
                            <span className="text-sm font-black text-zinc-400">({s.marksPerQuestion})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-32 pt-12 border-t-2 border-zinc-100 flex justify-between items-end print:border-zinc-900">
                  <div className="text-center space-y-3">
                    <div className="w-48 h-0.5 bg-zinc-200 mx-auto" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Invigilator</p>
                  </div>
                  <div className="text-center space-y-6">
                    <div className="w-32 h-32 border-4 border-dashed border-zinc-100 rounded-[40px] flex items-center justify-center">
                      <span className="text-[10px] font-black text-zinc-100 uppercase -rotate-12 tracking-widest">Institutional Seal</span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Principal Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function ExamMeta({ icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50 group-hover:bg-white transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-zinc-300 group-hover:text-[#1e3a8a] transition-colors">{icon}</div>
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-black text-zinc-700">{value}</p>
    </div>
  )
}
