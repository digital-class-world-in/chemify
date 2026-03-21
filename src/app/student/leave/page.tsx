
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CalendarDays, 
  Plus, 
  History, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Info, 
  AlertCircle,
  X,
  FileText,
  Loader2,
  Calendar,
  ChevronRight,
  PlusCircle,
  Save,
  ShieldCheck
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, off } from "firebase/database"
import { cn } from "@/lib/utils"
import { format, differenceInDays, parseISO, isAfter } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { TabsTrigger } from "@radix-ui/react-tabs"

const LEAVE_TYPES = [
  { id: 'Sick', label: 'Sick Leave', color: 'border-t-rose-500', total: 10 },
  { id: 'Casual', label: 'Casual Leave', color: 'border-t-blue-500', total: 10 },
  { id: 'Emergency', label: 'Emergency Leave', color: 'border-t-amber-500', total: 5 },
  { id: 'Annual', label: 'Annual Leave', color: 'border-t-[#1e3a8a]', total: 15 }
]

export default function StudentLeavePage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { toast } = useToast()
  const { resolvedId: adminUid, staffId: studentId, isLoading: idLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [leaveType, setLeaveType] = useState("Sick Leave")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!database || !adminUid || !studentId) {
      if (!idLoading && !studentId) setIsLoading(false)
      return
    }
    
    // Fetch Student Profile
    const studentRef = ref(database, `Institutes/${adminUid}/admissions/${studentId}`)
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: studentId })
      }
    }, { onlyOnce: true })

    // Fetch Leave History
    const historyRef = ref(database, `Institutes/${adminUid}/leave-requests`)
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data)
        .map(k => ({ ...data[k], id: k }))
        .filter(r => r.requesterId === studentId)
      setRequests(list.reverse())
      setIsLoading(false)
    })

    return () => {
      off(historyRef)
    }
  }, [database, adminUid, studentId, idLoading])

  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0
    try {
      const diff = differenceInDays(parseISO(toDate), parseISO(fromDate)) + 1
      return diff > 0 ? diff : 0
    } catch (e) {
      return 0
    }
  }, [fromDate, toDate])

  const leaveStats = useMemo(() => {
    const stats: Record<string, any> = {}
    
    LEAVE_TYPES.forEach(type => {
      const used = requests
        .filter(r => r.leaveType === type.label && r.status === 'Approved')
        .reduce((sum, r) => sum + (Number(r.totalDays) || 0), 0)
      
      stats[type.id] = {
        ...type,
        used,
        remaining: Math.max(0, type.total - used)
      }
    })
    
    return stats
  }, [requests])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!database || !adminUid || !student || isSubmitting) return

    if (totalDays <= 0) {
      toast({ variant: "destructive", title: "Invalid Duration", description: "To date must be after from date." })
      return
    }

    const typePrefix = leaveType.split(' ')[0]
    const selectedTypeStat = leaveStats[typePrefix]
    
    if (selectedTypeStat && selectedTypeStat.remaining < totalDays) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Balance", 
        description: `You only have ${selectedTypeStat.remaining} days available for ${leaveType}.` 
      })
      return
    }

    setIsSubmitting(true)
    const requestData = {
      requesterId: student.id,
      requesterName: student.studentName,
      admissionNo: student.admissionNo,
      course: student.course,
      role: "Student",
      leaveType,
      fromDate,
      toDate,
      totalDays,
      reason,
      status: "Pending",
      appliedDate: new Date().toISOString(),
      updatedAt: Date.now()
    }

    try {
      await push(ref(database, `Institutes/${adminUid}/leave-requests`), requestData)
      toast({ title: "Application Sent", description: "Your leave request is awaiting institutional review." })
      setIsApplyModalOpen(false)
      setFromDate(""); setToDate(""); setReason("");
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not connect to the database node." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-[0.2em] animate-pulse">Establishing Leave Node...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 font-public-sans text-black">
      
      {/* 📊 LEAVE BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(leaveStats).map((stat: any) => (
          <Card key={stat.id} className={cn(
            "border-none shadow-sm rounded-[32px] bg-white p-8 border-t-4 transition-all hover:shadow-xl duration-500",
            stat.color
          )}>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black text-zinc-800 uppercase tracking-widest">{stat.label}</h4>
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shadow-inner",
                  stat.remaining > 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                  {stat.remaining > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <BalanceBox label="Total" value={stat.total} />
                <BalanceBox label="Used" value={stat.used} color="text-amber-500" />
                <BalanceBox label="Left" value={stat.remaining} color="text-emerald-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight font-headline">Absence Protocol</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Institutional leave application and status hub</p>
        </div>
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a] hover:bg-[#162e6a] text-white rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all border-none gap-3">
              <Plus className="w-5 h-5" /> Initiate Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
            <div className="bg-[#1e3a8a] p-10 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white/40 border-none outline-none transition-colors"><X className="h-6 w-6" /></DialogClose>
              <div className="space-y-4">
                <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Official Request</Badge>
                <DialogTitle className="text-3xl font-black uppercase tracking-tight font-headline">Request Absence</DialogTitle>
                <p className="text-sm text-blue-200 font-medium">Verify your leave balance before submission.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Leave Category *</Label>
                  <Select value={leaveType} onValueChange={setLeaveType} required>
                    <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                      {LEAVE_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.label} className="font-bold text-xs uppercase py-3">
                          {type.label} ({leaveStats[type.id]?.remaining || 0} Days Available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Commencement Date</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Conclusion Date</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" />
                </div>
              </div>

              <div className="bg-[#1e3a8a] p-8 rounded-[32px] text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16" /></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Calculated Span</p>
                  <p className="text-2xl font-black">{totalDays} Working Day(s)</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Reason for Application</Label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide detailed context for institutional records..." required className="rounded-3xl border-zinc-100 bg-zinc-50/50 min-h-[120px] font-medium" />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || totalDays === 0}
                className="w-full h-16 bg-zinc-900 hover:bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 border-none gap-3"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Finalize Application
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 📜 LEAVE HISTORY LEDGER */}
      <Card className="border border-zinc-100 shadow-sm rounded-[40px] overflow-hidden bg-white">
        <div className="p-10 border-b border-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-zinc-200" />
            <h3 className="font-black text-zinc-800 uppercase text-[11px] tracking-[0.2em]">Application History Ledger</h3>
          </div>
          <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[9px] font-black tracking-widest px-3">Verified Sync</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100">
                <TableHead className="pl-10 text-[10px] font-black uppercase h-14">Submitted On</TableHead>
                <TableHead className="text-[10px] font-black uppercase h-14">Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase h-14">Academic Span</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center h-14">Days</TableHead>
                <TableHead className="text-[10px] font-black uppercase h-14">Institutional Reason</TableHead>
                <TableHead className="text-right pr-10 text-[10px] font-black uppercase h-14">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((row, i) => (
                <TableRow key={row.id} className="border-zinc-50 group hover:bg-zinc-50/30 transition-all text-black">
                  <TableCell className="pl-10 text-xs font-bold text-zinc-400 font-mono">{row.appliedDate ? format(new Date(row.appliedDate), "yyyy-MM-dd") : '-'}</TableCell>
                  <TableCell className="text-sm font-black text-zinc-700 uppercase">{row.leaveType}</TableCell>
                  <TableCell className="text-sm font-bold text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{row.fromDate}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-200" />
                      <span className="font-mono">{row.toDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-zinc-800">{row.totalDays}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-xs text-zinc-400 font-medium italic" title={row.reason}>"{row.reason}"</TableCell>
                  <TableCell className="text-right pr-10">
                    <Badge className={cn(
                      "rounded-lg px-4 py-1.5 text-[9px] font-black uppercase border-none shadow-none transition-all",
                      row.status === 'Approved' ? "bg-emerald-50 text-emerald-600" :
                      row.status === 'Rejected' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 rounded-[24px] flex items-center justify-center text-zinc-200 shadow-inner">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">Registry node is empty</p>
                  </div>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </main>
  )
}

function BalanceBox({ label, value, color }: any) {
  return (
    <div className="bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100/50 text-center group-hover:bg-white transition-colors">
      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("text-lg font-black tracking-tight", color || "text-zinc-700")}>{value}</p>
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
