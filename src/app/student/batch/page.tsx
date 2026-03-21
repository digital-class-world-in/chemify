
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Layers, 
  Users, 
  UserCheck, 
  Info, 
  User, 
  ExternalLink,
  Check,
  Briefcase,
  ShieldCheck,
  MapPin,
  Clock,
  Timer,
  CalendarCheck,
  History as HistoryIcon
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import { useResolvedId } from "@/hooks/use-resolved-id"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function StudentBatchDetailsPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, staffId: studentId, isLoading: isIdLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [batch, setBatch] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("class-info")

  useEffect(() => {
    // Priority: Local session for speed
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('student_session') : null
    const session = sessionStr ? JSON.parse(sessionStr) : null
    const currentResolvedId = resolvedId || session?.adminUid
    const currentStudentId = studentId || session?.studentId

    if (!database || !currentResolvedId || !currentStudentId) {
      if (!isIdLoading && !currentStudentId) setIsLoading(false)
      return
    }
    
    const rootPath = `Institutes/${currentResolvedId}`
    
    // 1. Fetch Student Profile
    const studentRef = ref(database, `${rootPath}/admissions/${currentStudentId}`)
    onValue(studentRef, (snapshot) => {
      const studentData = snapshot.val()
      if (studentData) {
        setStudent(studentData)
        
        // 2. Fetch all batches to find mapping
        onValue(ref(database, `${rootPath}/batches`), (batchSnap) => {
          const batches = batchSnap.val() || {}
          const foundBatchKey = Object.keys(batches).find(k => 
            batches[k].batchName === studentData.batch || 
            (batches[k].assignedStudents && batches[k].assignedStudents[currentStudentId])
          )
          
          if (foundBatchKey) {
            setBatch({ ...batches[foundBatchKey], id: foundBatchKey })
          } else {
            setBatch(null)
          }
          setIsLoading(false)
        }, { onlyOnce: true })
      } else {
        setIsLoading(false)
      }
    })

    return () => off(studentRef)
  }, [database, resolvedId, studentId, isIdLoading])

  if (isIdLoading || isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-widest animate-pulse">Syncing Academic Registry...</div>
  
  if (!student || !batch) return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
        <Info className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">No Batch Assigned</h2>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto font-medium leading-relaxed">
          You are not currently linked to an active academic batch. Please contact the administration office.
        </p>
      </div>
    </div>
  )

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32">
      
      {/* 1️⃣ PAGE HEADER – CLASS OVERVIEW */}
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden">
        <div className="h-2 w-full bg-[#1e3a8a]" />
        <CardContent className="p-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-[32px] bg-blue-50 flex items-center justify-center text-[#1e3a8a] shadow-inner">
              <Layers className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{batch.courseName || student.course}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge className="bg-blue-50 text-[#1e3a8a] border-none font-bold text-[10px] uppercase px-3">Class: {batch.className || student.section || 'Regular'}</Badge>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase px-3">{student.session || '2024-25'}</Badge>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Current Batch: {batch.batchName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 pr-4 border-l border-zinc-100 pl-10 hidden xl:flex">
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Faculty Advisor</p>
              <p className="text-lg font-bold text-zinc-700 uppercase">{batch.faculty || 'Unassigned'}</p>
              <p className="text-[11px] text-primary font-bold uppercase">{batch.status || 'Active'}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-primary shadow-sm">
              <User className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2️⃣ TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
          <DashboardTabTrigger value="class-info" label="Batch Metadata" icon={<Info className="w-4 h-4" />} />
          <DashboardTabTrigger value="timetable" label="Weekly Schedule" icon={<CalendarCheck className="w-4 h-4" />} />
        </TabsList>

        <div className="mt-8">
          {/* 3️⃣ BATCH METADATA TAB */}
          <TabsContent value="class-info" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm rounded-[32px] bg-white p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <SectionHeader title="Batch Timeline" />
                  <div className="space-y-4">
                    <DetailRow label="Batch Identity" value={batch.batchName} />
                    <DetailRow label="Start Date" value={batch.startDate || 'N/A'} />
                    <DetailRow label="Completion (Est)" value={batch.endDate || 'Ongoing'} />
                    <DetailRow label="Operational Status" value={batch.status || 'Active'} />
                  </div>
                </div>
                <div className="space-y-8">
                  <SectionHeader title="Academic Mapping" />
                  <div className="space-y-4">
                    <DetailRow label="Linked Course" value={batch.courseName} />
                    <DetailRow label="Class Category" value={batch.className || '-'} />
                    <DetailRow label="Assigned Faculty" value={batch.faculty || 'TBA'} />
                    <DetailRow label="Session" value={student.session} />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 4️⃣ WEEKLY TIMETABLE TAB */}
          <TabsContent value="timetable" className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-4">
              {DAYS.map((day) => {
                const daySchedule = batch.timetable?.[day]
                const isEnabled = daySchedule?.enabled === true
                return (
                  <Card key={day} className={cn(
                    "border-none shadow-sm rounded-3xl transition-all group",
                    isEnabled ? "bg-white hover:shadow-xl" : "bg-zinc-50/50 opacity-60"
                  )}>
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-inner",
                          isEnabled ? "bg-primary text-white" : "bg-white text-zinc-300"
                        )}>
                          {day.substring(0, 3)}
                        </div>
                        <div>
                          <h4 className={cn("text-lg font-black uppercase tracking-tight", isEnabled ? "text-zinc-800" : "text-zinc-300")}>{day}</h4>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{isEnabled ? 'Academic Session Active' : 'No Classes Scheduled'}</p>
                        </div>
                      </div>

                      {isEnabled && (
                        <div className="flex items-center gap-10">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Time Slot</p>
                              <p className="text-base font-black text-zinc-700 font-mono tracking-tighter">{daySchedule.start} — {daySchedule.end}</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3 py-1">Verified Schedule</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-3">
      {title}
    </h3>
  )
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 group">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">{label}</span>
      <span className="text-sm font-black text-zinc-700 uppercase">{value || '-'}</span>
    </div>
  )
}
