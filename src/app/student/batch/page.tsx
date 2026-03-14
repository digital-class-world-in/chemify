
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
  Timer
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"
import { useResolvedId } from "@/hooks/use-resolved-id"

export default function StudentBatchDetailsPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId, staffId: studentId, isLoading: isIdLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [batch, setBatch] = useState<any>(null)
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("class-info")

  useEffect(() => {
    if (!database || !resolvedId || !studentId) return
    
    const rootPath = `Institutes/${resolvedId}`
    
    // 1. Fetch Student Profile
    const studentRef = ref(database, `${rootPath}/admissions/${studentId}`)
    onValue(studentRef, (snapshot) => {
      const studentData = snapshot.val()
      if (studentData) {
        setStudent(studentData)
        
        // 2. Fetch all batches to find the one assigned to this student
        onValue(ref(database, `${rootPath}/batches`), (batchSnap) => {
          const batches = batchSnap.val() || {}
          // Look for batch by Name (mapped in Admission) or by assigned student ID
          const foundBatchKey = Object.keys(batches).find(k => 
            batches[k].batchName === studentData.batch || 
            (batches[k].assignedStudents && batches[k].assignedStudents[studentId])
          )
          
          if (foundBatchKey) {
            const batchData = batches[foundBatchKey]
            setBatch({ ...batchData, id: foundBatchKey })
            
            // 3. Extract Faculty from the Batch data
            const assignedStaff = batchData.assignedStaff || {}
            setFacultyList(Object.keys(assignedStaff).map(id => ({
              id,
              ...assignedStaff[id]
            })))
          } else {
            setBatch(null)
            setFacultyList([])
          }
          setIsLoading(false)
        }, { onlyOnce: true })
      } else {
        setIsLoading(false)
      }
    })

    return () => {
      off(studentRef)
    }
  }, [database, resolvedId, studentId])

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
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student.course}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge className="bg-blue-50 text-[#1e3a8a] border-none font-bold text-[10px] uppercase px-3">Section {student.section || 'A'}</Badge>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase px-3">{student.session || '2024-25'}</Badge>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Roll No: {student.rollNo || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 pr-4 border-l border-zinc-100 pl-10 hidden xl:flex">
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Current Batch</p>
              <p className="text-lg font-bold text-zinc-700 uppercase">{batch.batchName}</p>
              <p className="text-[11px] text-primary font-bold uppercase">Code: {batch.batchCode}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-primary shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2️⃣ QUICK INFO SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard icon={<Users className="text-emerald-500" />} title="Class Stream" value={student.stream || 'Academic'} />
        <SummaryCard icon={<UserCheck className="text-indigo-500" />} title="Faculty Count" value={`${facultyList.length} Teachers`} />
        <SummaryCard icon={<Clock className="text-rose-500" />} title="Joining Date" value={student.admissionDate} />
      </div>

      {/* 3️⃣ TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[24px] h-auto flex-wrap justify-start gap-2 shadow-sm border border-zinc-100">
          <DashboardTabTrigger value="class-info" label="Schedule Info" icon={<Info className="w-4 h-4" />} />
          <DashboardTabTrigger value="faculty" label="Assigned Faculty" icon={<User className="w-4 h-4" />} />
        </TabsList>

        <div className="mt-8">
          {/* 4️⃣ CLASS INFORMATION TAB */}
          <TabsContent value="class-info" className="mt-0 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm rounded-[32px] bg-white p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <SectionHeader title="Batch Timeline" />
                  <div className="space-y-4">
                    <DetailRow label="Batch Name" value={batch.batchName} />
                    <DetailRow label="Batch Code" value={batch.batchCode || '-'} />
                    <DetailRow label="Start Date" value={batch.startDate || '-'} />
                    <DetailRow label="End Date" value={batch.endDate || 'Ongoing'} />
                    <DetailRow label="Current Status" value={batch.status || 'Active'} />
                  </div>
                </div>
                <div className="space-y-8">
                  <SectionHeader title="Academic Mapping" />
                  <div className="space-y-4">
                    <DetailRow label="Primary Course" value={batch.courseName} />
                    <DetailRow label="Instruction Language" value="English" />
                    <DetailRow label="Session" value={student.session} />
                    <DetailRow label="Campus Location" value="Main Academic Block" />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 5️⃣ FACULTY TAB */}
          <TabsContent value="faculty" className="mt-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facultyList.length > 0 ? facultyList.map((t, i) => (
                <Card key={i} className="border-none shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-[28px] border-4 border-zinc-50 shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-2xl">{t.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-md border-2 border-white"><Check className="w-3 h-3 stroke-[4px]" /></div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight">{t.name}</h4>
                      <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">{t.role || 'Faculty Member'}</p>
                    </div>
                    <div className="w-full pt-6 border-t border-zinc-50">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Affiliation</p>
                      <p className="text-xs font-black text-zinc-700 uppercase">Academic Department</p>
                    </div>
                    <Badge className="bg-zinc-50 text-zinc-400 border-none px-4 py-1 text-[9px] font-black uppercase">Verified Faculty</Badge>
                  </div>
                </Card>
              )) : (
                <div className="col-span-full py-20 text-center space-y-4 bg-zinc-50/50 rounded-[40px] border-2 border-dashed border-zinc-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-zinc-200">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No faculty members currently assigned to this batch</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

function SummaryCard({ icon, title, value }: any) {
  return (
    <Card className="border-none shadow-sm rounded-[24px] bg-white p-6 group hover:shadow-md transition-all">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center transition-colors group-hover:bg-white group-hover:shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{title}</p>
          <h4 className="text-xl font-black text-zinc-800 tracking-tight">{value}</h4>
        </div>
      </div>
    </Card>
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
