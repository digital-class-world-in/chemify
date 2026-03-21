
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Wallet, 
  CreditCard, 
  Calendar, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  History, 
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Landmark,
  ChevronRight,
  Info,
  BookOpen,
  Tag,
  Search
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, set, off, update, get } from "firebase/database"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { TabsTrigger } from "@radix-ui/react-tabs"

export default function StudentFeesPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { resolvedId: adminUid, staffId: studentId, isLoading: idLoading } = useResolvedId()
  
  const [student, setStudent] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)

  useEffect(() => {
    if (!database || !adminUid || !studentId) {
      if (!idLoading && !studentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${adminUid}`
    
    // Fetch Institute Profile
    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.exists()) setInstituteProfile(s.val())
    })

    // Fetch Student Record
    onValue(ref(database, `${rootPath}/admissions/${studentId}`), (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: studentId })
      }
    })

    // Fetch Payment History
    onValue(ref(database, `${rootPath}/fees`), (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.values(data).filter((p: any) => p.studentId === studentId).reverse()
      setPayments(list)
      setIsLoading(false)
    })
  }, [database, adminUid, studentId, idLoading])

  const totals = useMemo(() => {
    if (!student) return { total: 0, paid: 0, pending: 0, status: 'Pending' }
    const total = Number(student.netFees) || 0
    const paid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const pending = Math.max(0, total - paid)
    const status = pending === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending'
    return { total, paid, pending, status }
  }, [student, payments])

  const breakdown = useMemo(() => {
    if (!totals.total) return []
    const base = totals.total
    return [
      { type: "Tuition Fee", total: Math.round(base * 0.7), paid: Math.round(totals.paid * 0.7), icon: <BookOpen className="w-4 h-4" /> },
      { type: "Admission Fee", total: Math.round(base * 0.1), paid: Math.round(totals.paid * 0.1), icon: <ShieldCheck className="w-4 h-4" /> },
      { type: "Examination Fee", total: Math.round(base * 0.1), paid: Math.round(totals.paid * 0.1), icon: <FileText className="w-4 h-4" /> },
      { type: "Transport/Misc", total: Math.round(base * 0.1), paid: Math.round(totals.paid * 0.1), icon: <TrendingUp className="w-4 h-4" /> },
    ]
  }, [totals])

  const generatePremiumReceipt = (payment: any) => {
    const doc = new jsPDF();
    const instName = instituteProfile?.instituteName || "ACADEMIC INSTITUTE"
    
    doc.setDrawColor(0).setLineWidth(0.5).rect(10, 10, 190, 277);
    doc.setFontSize(10).setTextColor(100).text("Candidate Copy", 105, 18, { align: 'center' });
    
    doc.setFillColor(245, 245, 245).rect(10.5, 23, 189, 10, 'F');
    doc.setFontSize(12).setTextColor(40).setFont("helvetica", "bold").text("FEE PAYMENT RECEIPT", 105, 29, { align: 'center' });

    doc.setFontSize(16).setTextColor(0).text(instName.toUpperCase(), 105, 48, { align: 'center' });
    doc.setFontSize(9).setFont("helvetica", "normal").text(instituteProfile?.address || "-", 105, 54, { align: 'center' });

    doc.setFontSize(12).text("Student Details:", 15, 75);
    doc.setFontSize(10).text(`Name: ${student?.studentName || 'N/A'}`, 15, 85);
    doc.text(`Adm No: ${student?.admissionNo || '-'}`, 15, 92);
    doc.text(`Course: ${student?.course || '-'}`, 15, 99);
    doc.text(`Date: ${payment.date || '-'}`, 130, 85);
    doc.text(`Receipt: #${payment.receiptNo || '-'}`, 130, 92);

    autoTable(doc, {
      startY: 110,
      head: [['Description', 'Reference', 'Amount (INR)']],
      body: [[`Course Fees Payment (${student?.course})`, payment.txId || '-', `₹${Number(payment.amount).toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14).text(`Total Paid: ₹${Number(payment.amount).toLocaleString()}`, 130, finalY);
    doc.setFontSize(9).text("This is a system-generated receipt verified by the institutional node.", 105, 270, { align: 'center' });

    doc.save(`Fee_Receipt_${payment.receiptNo}.pdf`);
  }

  const handlePayment = async () => {
    if (!database || !adminUid || !student || isProcessing) return
    setIsProcessing(true)
    const amount = totals.pending
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`
    const txId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
    
    const paymentData = {
      studentId: student.id,
      studentName: student.studentName,
      amount: amount,
      date: format(new Date(), "yyyy-MM-dd"),
      paymentMode: paymentMethod.toUpperCase(),
      txId: txId,
      receiptNo: receiptNo,
      status: "Successful",
      createdAt: Date.now()
    }

    try {
      await push(ref(database, `Institutes/${adminUid}/fees`), paymentData)
      toast({ title: "Payment Recorded", description: "Your transaction has been synchronized." })
      setIsPayModalOpen(false)
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error" })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Establishing Node Connection...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 font-public-sans text-black">
      
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-[36px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Wallet className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student?.studentName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase">Session: {student.session || '2024-25'}</Badge>
                <Badge className={cn(
                  "rounded-full px-4 py-1 text-[9px] font-black uppercase border-none shadow-sm",
                  totals.status === 'Paid' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>{totals.status} Account</Badge>
              </div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{student.course} • Section {student.section}</p>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Outstanding Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-300">₹</span>
              <span className={cn("text-6xl font-black tracking-tighter", totals.pending > 0 ? "text-rose-500" : "text-emerald-600")}>{totals.pending.toLocaleString()}</span>
            </div>
            {student.feeDueDate && <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Next due on {student.feeDueDate}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard label="Annual Fee" value={`₹${totals.total.toLocaleString()}`} icon={<History className="text-zinc-400" />} />
        <SummaryCard label="Net Paid" value={`₹${totals.paid.toLocaleString()}`} icon={<CheckCircle2 className="text-emerald-500" />} color="text-emerald-600" />
        <SummaryCard label="Total Dues" value={`₹${totals.pending.toLocaleString()}`} icon={<AlertCircle className="text-rose-500" />} color="text-rose-600" />
        <SummaryCard label="Tax Relief" value="₹0" icon={<TrendingUp className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between"><h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.2em]">Academic Fee Matrix</h3><Info className="w-4 h-4 text-zinc-200" /></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Assessed</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Paid Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((item, i) => (
                    <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/20 transition-all">
                      <TableCell className="pl-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white transition-colors">{item.icon}</div>
                          <span className="text-sm font-bold text-zinc-700 uppercase">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-zinc-400 font-mono">₹{item.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-black text-emerald-600">₹{item.paid.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">Captured</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-2xl rounded-[40px] bg-zinc-900 p-10 text-white relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none uppercase text-[10px] font-black tracking-widest px-4 py-1">Authorization Pending</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Instant Checkout</h3>
                <p className="text-sm text-zinc-400 font-medium">Synchronized transaction portal for immediate due clearance.</p>
              </div>
              
              {totals.pending > 0 ? (
                <div className="space-y-6">
                  <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Amount Due</span>
                    <span className="text-3xl font-black text-white tracking-tighter">₹{totals.pending.toLocaleString()}</span>
                  </div>
                  <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all">Clear Dues Securely</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
                      <div className="bg-[#1e3a8a] p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white/40 border-none outline-none transition-colors"><X className="h-6 w-6" /></DialogClose>
                        <div className="space-y-4">
                          <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Gateway Hub</Badge>
                          <DialogTitle className="text-3xl font-black uppercase tracking-tight leading-none">Pay Online</DialogTitle>
                        </div>
                      </div>
                      <div className="p-10 space-y-10">
                        <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 flex justify-between items-center shadow-inner">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Session Payable</span>
                          <span className="text-2xl font-black text-zinc-800 tracking-tight">₹{totals.pending.toLocaleString()}</span>
                        </div>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-4">
                          <PaymentOption value="upi" icon={<Smartphone className="w-5 h-5" />} label="UPI (GooglePay, PhonePe)" />
                          <PaymentOption value="card" icon={<CreditCard className="w-5 h-5" />} label="Credit / Debit Card" />
                        </RadioGroup>
                        <Button 
                          onClick={handlePayment} 
                          disabled={isProcessing} 
                          className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl border-none active:scale-95 transition-all"
                        >
                          {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : 'Authorize & Pay Now'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="bg-emerald-500/10 p-8 rounded-[32px] border border-emerald-500/20 flex items-center gap-6 text-emerald-400 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-8 h-8" /></div>
                  <p className="text-sm font-black uppercase tracking-[0.1em]">All Dues Synchronized</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <section className="space-y-8 pt-10">
        <div className="flex items-center gap-3 px-2 border-b border-zinc-50 pb-4">
          <History className="w-5 h-5 text-zinc-400" />
          <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.2em]">Transaction Ledger History</h3>
        </div>
        
        <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="pl-10 text-[10px] font-black uppercase h-14">SR NO.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Receipt Identifier</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Payment Method</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Amount (INR)</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p, i) => (
                  <TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30 transition-all group">
                    <TableCell className="pl-10 font-bold text-zinc-300">{(i + 1).toString().padStart(2, '0')}</TableCell>
                    <TableCell className="font-black text-zinc-400 font-mono text-xs">{p.date}</TableCell>
                    <TableCell className="text-sm font-bold text-zinc-700 uppercase">{p.receiptNo || '-'}</TableCell>
                    <TableCell className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{p.paymentMode || 'PORTAL'}</TableCell>
                    <TableCell className="text-sm font-black text-emerald-600">₹ {Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Button onClick={() => generatePremiumReceipt(p)} variant="ghost" size="sm" className="h-9 px-5 rounded-xl bg-zinc-50 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                        <Printer className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-50 rounded-[24px] flex items-center justify-center text-zinc-200 shadow-inner">
                          <History className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">No payment history found in node</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </main>
  )
}

function SummaryCard({ label, value, icon, color = "text-zinc-800" }: any) {
  return (
    <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-lg transition-all duration-500">
      <div className="flex flex-col gap-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center transition-colors group-hover:bg-white shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className={cn("text-3xl font-black tracking-tighter leading-none", color)}>{value}</h4>
        </div>
      </div>
    </Card>
  )
}

function PaymentOption({ value, icon, label }: any) {
  return (
    <Label htmlFor={value} className="flex items-center justify-between p-6 rounded-3xl border-2 border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-all [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50/30 group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-all shadow-inner group-has-[[data-state=checked]]:bg-white">
          {icon}
        </div>
        <span className="text-sm font-black text-zinc-700 uppercase tracking-tight">{label}</span>
      </div>
      <RadioGroupItem value={value} id={value} className="border-zinc-300 text-primary h-5 w-5" />
    </Label>
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
