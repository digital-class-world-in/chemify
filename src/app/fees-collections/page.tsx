
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Eye, 
  Save, 
  Loader2
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, push, off, update, set } from "firebase/database"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { format } from "date-fns"

export default function FeesCollectionsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse font-public-sans">Initializing Financial Node...</div>}>
      <FeesContent />
    </Suspense>
  )
}

function FeesContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get("status") || "all"

  const isPortal = pathname?.startsWith('/staff') || pathname?.startsWith('/student') || (pathname?.startsWith('/branch') && !pathname?.startsWith('/branch-management'))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<any>(null)
  
  const [payments, setPayments] = useState<any[]>([])
  const [students, setAdmissions] = useState<any[]>([])
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [filterSession, setFilterSession] = useState("all")
  const [filterClass, setFilterClass] = useState("all")
  const [filterSection, setFilterSection] = useState("all")
  const [filterStatus, setFilterStatus] = useState(initialStatus)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { database } = useFirebase()
  const { resolvedId, branchId, isBranch, isStaff, staffId } = useResolvedId()

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  useEffect(() => {
    if (!database || !resolvedId) return
    
    const rootPath = `Institutes/${resolvedId}`
    const paymentsRef = ref(database, `${rootPath}/fees`)
    const studentsRef = ref(database, `${rootPath}/admissions`)
    const dropdownsRef = ref(database, `${rootPath}/dropdowns`)
    
    setIsLoading(true)
    
    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setPayments(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setPayments([])
    })

    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setAdmissions(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setAdmissions([])
      setIsLoading(false)
    })

    onValue(dropdownsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const processed: Record<string, any[]> = {}
      Object.keys(data).forEach(key => { 
        processed[key] = Object.keys(data[key]).map(id => ({ id, value: data[key][id].value })) 
      })
      setDropdownData(processed)
    })

    return () => {
      off(paymentsRef)
      off(studentsRef)
      off(dropdownsRef)
    }
  }, [database, resolvedId])

  const studentFinancials = useMemo(() => {
    let list = students
    if (isBranch && branchId) list = list.filter(s => s.branchId === branchId)

    return list.map(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id)
      const collected = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const total = Number(student.netFees) || 0
      const due = Math.max(0, total - collected)
      
      return {
        ...student,
        collectedFees: collected,
        dueFees: due,
        totalFees: total
      }
    })
  }, [students, payments, isBranch, branchId])

  const filteredData = useMemo(() => {
    return studentFinancials.filter(s => {
      const matchesSearch = !searchTerm || 
        s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.admissionNo?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSession = filterSession === 'all' || s.session === filterSession
      const matchesClass = filterClass === 'all' || s.class === filterClass
      const matchesSection = filterSection === 'all' || s.section === filterSection
      
      let matchesStatus = true
      if (filterStatus === 'paid') matchesStatus = s.dueFees <= 0
      else if (filterStatus === 'due') matchesStatus = s.dueFees > 0

      return matchesSearch && matchesSession && matchesClass && matchesSection && matchesStatus
    })
  }, [studentFinancials, searchTerm, filterSession, filterClass, filterSection, filterStatus])

  const handleCollectFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolvedId || !database || !selectedStudentForAction || isSubmitting) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const amount = formData.get("collectingAmount") as string
    const date = formData.get("date") as string
    const receiptNo = formData.get("receiptNo") || `RCP-${Date.now().toString().slice(-6)}`
    
    const paymentData = {
      studentId: selectedStudentForAction.id,
      studentName: selectedStudentForAction.studentName,
      amount: amount,
      date: date,
      receiptNo: receiptNo,
      paymentMode: formData.get("paymentMode") as string,
      updatedAt: Date.now()
    }
    
    try {
      const rootPath = `Institutes/${resolvedId}`
      await push(ref(database, `${rootPath}/fees`), paymentData)
      
      // --- REAL-TIME NOTIFICATION ---
      const notification = {
        title: "Fee Payment Received",
        message: `A payment of ₹${Number(amount).toLocaleString()} has been recorded for your account. Receipt: #${receiptNo}.`,
        type: "Fee",
        read: false,
        timestamp: new Date().toISOString()
      }
      
      // Notify Student
      await push(ref(database, `${rootPath}/notifications/${selectedStudentForAction.id}`), notification)
      
      // Notify Admin
      await push(ref(database, `${rootPath}/notifications/admin`), {
        ...notification,
        title: "New Fee Transaction",
        message: `Fee of ₹${amount} received from ${selectedStudentForAction.studentName} (${selectedStudentForAction.admissionNo}).`
      })

      toast({ title: "Payment Recorded" })
      setIsModalOpen(false);
    } catch (err) { toast({ variant: "destructive", title: "Error" }) }
    finally { setIsSubmitting(false) }
  }

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-public-sans text-black">
      {!isPortal && <Sidebar />}
      <div className={cn("flex flex-col flex-1 min-w-0", !isPortal && "lg:pl-[300px]")}>
        <TopNav />
        <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden text-[14px] font-public-sans text-black">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
              <h2 className="text-[26px] font-normal text-zinc-800 tracking-tight leading-none uppercase">Fees Management</h2>
              <p className="text-sm text-zinc-400 font-medium mt-1.5">Consolidated institutional financial ledger</p>
            </div>
          </div>

          <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8">
            <h3 className="text-lg font-normal text-zinc-800 tracking-tight uppercase mb-8">Select Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-black">
              <CriteriaBox label="Session" value={filterSession} onChange={setFilterSession} options={dropdownData['session'] || []} />
              <CriteriaBox label="Class" value={filterClass} onChange={setFilterClass} options={dropdownData['class'] || []} />
              <CriteriaBox label="Section" value={filterSection} onChange={setFilterSection} options={dropdownData['section'] || []} />
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-bold text-black text-[14px] uppercase"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Fully Paid</SelectItem><SelectItem value="due">Due</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex items-end"><div className="relative w-full"><Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300" /><Input placeholder="Search Name/ADM..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-11 rounded-xl pl-12 border-zinc-200 font-bold text-black text-[14px]" /></div></div>
            </div>
          </Card>

          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="overflow-x-auto scrollbar-thin">
              <Table className="min-w-[1400px]">
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-zinc-100 hover:bg-transparent">
                    <TableHead className="text-[13px] font-black text-black uppercase h-14 pl-4 w-16">#</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14 w-32 text-center">COLLECT FEE</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14 w-40 text-center">OUTSTANDING DUE</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">PAID FEES</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">TOTAL FEES</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">STUDENT NAME</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">ADMISSION NO</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">CLASS / COURSE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/20 transition-none group text-black">
                      <TableCell className="text-[14px] font-bold text-zinc-400 pl-4">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell className="text-center">
                        {row.dueFees <= 0 ? <Badge className="bg-emerald-50 text-emerald-600 border-none h-7 px-4 text-[10px] font-black uppercase">Fully Paid</Badge> : <Button onClick={() => { setSelectedStudentForAction(row); setIsModalOpen(true); }} className="bg-[#48CAE4] hover:bg-[#00B4D8] text-white rounded-lg h-8 px-4 text-[10px] font-black uppercase border-none transition-all">Collect Fee</Button>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={cn("py-2 px-4 rounded-md inline-block min-w-[100px] text-center shadow-lg", row.dueFees > 0 ? "bg-[#1e3a8a] text-white" : "bg-emerald-50 text-emerald-600 shadow-none border border-emerald-100")}>
                          <span className="font-black text-[14px]">₹ {Number(row.dueFees || 0).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[14px] font-bold text-emerald-600">₹ {Number(row.collectedFees || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-[14px] font-bold text-zinc-400">₹ {Number(row.totalFees || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-[14px] font-black text-black uppercase font-headline">{row.studentName}</TableCell>
                      <TableCell className="text-[14px] font-bold text-black font-mono tracking-tighter">{row.admissionNo}</TableCell>
                      <TableCell className="text-[14px] font-bold text-black uppercase">{row.course}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setSelectedStudentForAction(null); }}>
            <DialogContent className="max-w-xl p-0 border-none rounded-[32px] overflow-hidden bg-white shadow-2xl">
              <div className="bg-[#1e3a8a] px-10 py-8 text-white border-b flex items-center justify-between">
                <DialogTitle className="text-2xl font-normal text-white uppercase tracking-tight">Record Transaction</DialogTitle>
                <DialogClose className="p-2 hover:bg-white/10 rounded-full border-none outline-none"><X className="h-6 w-6 text-white" /></DialogClose>
              </div>
              <form onSubmit={handleCollectFee} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
                  <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">OUTSTANDING DUE</Label><Input value={selectedStudentForAction?.dueFees || 0} readOnly className="h-12 border-zinc-200 rounded-xl font-bold bg-zinc-50/50 text-rose-600" /></div>
                  <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">COLLECTING AMOUNT *</Label><Input name="collectingAmount" type="number" required defaultValue={selectedStudentForAction?.dueFees || 0} className="h-12 rounded-xl border-[#0D9488]/30 font-black text-[#0D9488] text-lg shadow-sm" /></div>
                  <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">TRANSACTION DATE</Label><Input name="date" type="date" required defaultValue={todayStr} className="h-12 border-zinc-200 rounded-xl font-bold text-xs" /></div>
                  <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">PAYMENT CHANNEL</Label><Select name="paymentMode" defaultValue="Online"><SelectTrigger className="h-12 rounded-xl border-zinc-200 font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Online">Online Transfer</SelectItem><SelectItem value="Cash">Cash Payment</SelectItem><SelectItem value="Cheque">Cheque / Draft</SelectItem></SelectContent></Select></div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-[#1e3a8a] hover:bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 border-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3" />} Confirm & Sync Ledger
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}

function CriteriaBox({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: any[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-bold text-black text-[14px] uppercase focus:ring-1"><SelectValue placeholder="All" /></SelectTrigger>
        <SelectContent className="rounded-xl border-zinc-100 shadow-xl"><SelectItem value="all" className="font-bold">All {label}s</SelectItem>{options.map(opt => <SelectItem key={opt.id} value={opt.value} className="font-bold">{opt.value}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}
