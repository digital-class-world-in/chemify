
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
  BookOpen
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, set, off, update, get } from "firebase/database"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/hooks/use-toast"

export default function StudentFeesPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  
  const [student, setStudent] = useState<any>(null)
  const [adminUid, setAdminUid] = useState<string | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [instituteProfile, setInstituteProfile] = useState<any>(null)

  useEffect(() => {
    if (!database || !user) return
    
    // Resolve Student Identity
    const instRef = ref(database, `Institutes`)
    onValue(instRef, (snap) => {
      const institutes = snap.val() || {}
      let foundStudent: { id: any } | null = null
      let foundAdmin = null

      Object.keys(institutes).forEach(id => {
        const adms = institutes[id].admissions || {}
        Object.keys(adms).forEach(aid => {
          if (adms[aid].email?.toLowerCase() === user.email?.toLowerCase()) {
            foundStudent = { ...adms[aid], id: aid }
            foundAdmin = id
          }
        })
      })

      if (foundStudent && foundAdmin) {
        setStudent(foundStudent)
        setAdminUid(foundAdmin)
        const rootPath = `Institutes/${foundAdmin}`
        
        onValue(ref(database, `${rootPath}/profile`), (s) => {
          setInstituteProfile(s.val())
        })

        onValue(ref(database, `${rootPath}/fees`), (s) => {
          const data = s.val() || {}
          setPayments(Object.values(data).filter((p: any) => p.studentId === foundStudent.id).reverse())
        })
      }
      setIsLoading(false)
    })
  }, [database, user])

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
    const dueAmount = totals.pending;

    doc.setDrawColor(0).setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    doc.setFontSize(10).setTextColor(100).setFont("helvetica", "normal").text("Office Copy", 105, 18, { align: 'center' });
    doc.line(10, 22, 200, 22);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(10.5, 23, 189, 10, 'F');
    doc.setFontSize(12).setTextColor(40).setFont("helvetica", "bold");
    doc.text("Payment Receipt", 105, 29, { align: 'center' });
    doc.line(10, 33, 200, 33);

    const instName = instituteProfile?.instituteName || "ACADEMIC INSTITUTE"
    doc.setDrawColor(230).setFillColor(255, 255, 255);
    doc.roundedRect(15, 38, 180, 45, 5, 5, 'FD');
    doc.setFontSize(16).setTextColor(40).setFont("helvetica", "bold");
    doc.text(instName.toUpperCase(), 105, 48, { align: 'center' });
    doc.text("your logo", 105, 60, { align: 'center' });

    doc.setFontSize(14).setTextColor(0).text("Issued to:", 15, 95);
    doc.setFontSize(10).setTextColor(0).setFont("helvetica", "bold");
    doc.text(`Name: ${student?.studentName || 'N/A'}`, 15, 105);
    doc.text(`Roll no.: ${student?.rollNo || '-'}`, 15, 112);
    doc.text(`Date: ${payment.date || '-'}`, 15, 119);
    doc.text(`Email: ${student?.email || '-'}`, 110, 105);
    doc.text(`Mob.: ${student?.mobile || '-'}`, 110, 112);
    doc.text(`Receipt No.: #${payment.receiptNo || '-'}`, 110, 119);

    autoTable(doc, {
      startY: 125,
      margin: { left: 15, right: 15 },
      head: [['Course/Class', 'Transaction Id', 'Payment Type', 'Amount']],
      body: [
        [student?.course || '-', payment.txId || '-', 'Online/Portal', `INR ${Number(payment.amount).toLocaleString()}`],
        ['', '', 'Transport Fee', `INR 0`],
        ['', '', 'Other Amount', `INR 0`],
        ['', '', 'Fine', `INR 0`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0], halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      columnStyles: { 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(0).setLineWidth(0.5);
    doc.rect(15, finalY, 40, 12); doc.setFontSize(10).text("Due Total:", 17, finalY + 8); doc.text(`INR ${dueAmount.toLocaleString()}`, 35, finalY + 8);
    doc.rect(145, finalY, 45, 12); doc.setFontSize(10).text("Total:", 147, finalY + 8); doc.setFont("helvetica", "bold").text(`INR ${Number(payment.amount).toLocaleString()}`, 165, finalY + 8);

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100);
    doc.text(`Website: ${instituteProfile?.slug ? `https://partner.digitalclassworld.com/${instituteProfile.slug}` : '-'}`, 105, finalY + 30, { align: 'center' });
    doc.text(`Address: ${instituteProfile?.address || '-'}`, 105, finalY + 37, { align: 'center' });
    doc.setFont("helvetica", "bold").text("Note: Once a fee submitted can not be refunded.", 105, finalY + 44, { align: 'center' });
    doc.setFont("helvetica", "normal").text("This is a computer-generated receipt and does not require a signature.", 105, finalY + 51, { align: 'center' });

    doc.save(`Receipt_${payment.receiptNo}.pdf`);
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
      fineAmount: 0,
      otherAmount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      paymentMode: paymentMethod.toUpperCase(),
      paymentOption: "Portal",
      txId: txId,
      receiptNo: receiptNo,
      status: "Successful",
      createdAt: Date.now()
    }
    try {
      await push(ref(database, `Institutes/${adminUid}/fees`), paymentData)
      await update(ref(database, `Institutes/${adminUid}/admissions/${student.id}`), { lastPaymentDate: new Date().toISOString() })
      generatePremiumReceipt(paymentData)
      toast({ title: "Payment Successful" })
      setIsPayModalOpen(false)
    } catch (e) {
      toast({ variant: "destructive", title: "Failed" })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Establishing Node Connection...</div>
  if (!student) return <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-widest">Enrollment record not found</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32">
      
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-[36px] bg-blue-50 flex items-center justify-center text-[#1e3a8a] shadow-inner">
              <Wallet className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{student?.studentName || "Candidate"}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 font-bold text-[10px] uppercase">Session: {student.session || '2024-25'}</Badge>
                <Badge className={cn(
                  "rounded-full px-4 py-1 text-[9px] font-black uppercase border-none",
                  totals.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>{totals.status} Status</Badge>
              </div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{student.course} • Section {student.section}</p>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance Remaining</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-300">₹</span>
              <span className={cn("text-5xl font-black tracking-tighter", totals.pending > 0 ? "text-rose-500" : "text-emerald-600")}>{totals.pending.toLocaleString()}</span>
            </div>
            {student.feeDueDate && <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Due on {student.feeDueDate}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <SummaryCard label="Total Academic Fee" value={`₹${totals.total.toLocaleString()}`} icon={<History className="text-zinc-400" />} />
        <SummaryCard label="Total Amount Paid" value={`₹${totals.paid.toLocaleString()}`} icon={<CheckCircle2 className="text-emerald-500" />} color="text-emerald-600" />
        <SummaryCard label="Discount / Relief" value="₹0" icon={<TrendingUp className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between"><h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.2em]">Fee Breakdown Matrix</h3><Info className="w-4 h-4 text-zinc-200" /></div>
            <div className="overflow-x-auto"><Table><TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-8 text-[10px] font-black uppercase">Category</TableHead><TableHead className="text-[10px] font-black uppercase text-center">Net Amount</TableHead><TableHead className="text-right pr-8 text-[10px] font-black uppercase">Paid</TableHead></TableRow></TableHeader><TableBody>{breakdown.map((item, i) => (<TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30 transition-all"><TableCell className="pl-8 py-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">{item.icon}</div><span className="text-sm font-bold text-zinc-700">{item.type}</span></div></TableCell><TableCell className="text-center font-bold text-zinc-400">₹{item.total.toLocaleString()}</TableCell><TableCell className="text-right pr-8 font-black text-emerald-600">₹{item.paid.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-xl rounded-[40px] bg-zinc-900 p-10 text-white relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none uppercase text-[9px] font-black tracking-widest px-3">Secure Checkout</Badge>
                <h3 className="text-2xl font-black uppercase tracking-tight">Immediate Payment</h3>
                <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-white">₹{totals.pending.toLocaleString()}</span></div>
              </div>
              {totals.pending > 0 ? (
                <div className="space-y-4">
                  <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                    <DialogTrigger asChild><Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all">Clear Dues Online</Button></DialogTrigger>
                    <DialogContent className="max-w-md p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl"><div className="bg-[#1e3a8a] p-10 text-white relative"><div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" /><DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white/40 border-none outline-none"><X className="h-6 w-6" /></DialogClose><div className="space-y-4"><Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Gateway</Badge><DialogTitle className="text-3xl font-black uppercase tracking-tight leading-none">Pay Online</DialogTitle></div></div><div className="p-10 space-y-8"><div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount</span><span className="text-xl font-black text-zinc-800">₹{totals.pending.toLocaleString()}</span></div><RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3"><PaymentOption value="upi" icon={<Smartphone className="w-4 h-4" />} label="UPI (Paytm, GPay)" /><PaymentOption value="card" icon={<CreditCard className="w-4 h-4" />} label="Credit / Debit Card" /></RadioGroup><Button onClick={handlePayment} disabled={isProcessing} className="w-full h-14 bg-[#1e3a8a] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none">{isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : 'Pay Securely Now'}</Button></div></DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-4 text-emerald-400"><CheckCircle2 className="w-6 h-6" /><p className="text-xs font-black uppercase tracking-widest">No outstanding balance</p></div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2"><History className="w-4 h-4 text-zinc-400" /><h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.2em]">Transaction Registry</h3></div>
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="overflow-x-auto"><Table><TableHeader className="bg-zinc-50"><TableRow><TableHead className="pl-8 text-[10px] font-black uppercase h-14">Date</TableHead><TableHead className="text-[10px] font-black uppercase">Receipt No</TableHead><TableHead className="text-[10px] font-black uppercase">Method</TableHead><TableHead className="text-[10px] font-black uppercase">Amount</TableHead><TableHead className="text-right pr-8 text-[10px] font-black uppercase">Receipt</TableHead></TableRow></TableHeader><TableBody>{payments.map((p, i) => (<TableRow key={i} className="border-zinc-50 hover:bg-zinc-50/30 transition-all"><TableCell className="pl-8 font-black text-zinc-400 font-mono text-xs">{p.date}</TableCell><TableCell className="text-sm font-bold text-zinc-700">{p.receiptNo || '-'}</TableCell><TableCell className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{p.paymentMode || p.method}</TableCell><TableCell className="text-sm font-black text-[#1e3a8a]">₹{Number(p.amount).toLocaleString()}</TableCell><TableCell className="text-right pr-8"><Button onClick={() => generatePremiumReceipt(p)} variant="ghost" className="h-9 px-4 rounded-xl bg-zinc-50 text-zinc-500 font-black text-[9px] uppercase tracking-widest hover:bg-[#1e3a8a] hover:text-white transition-all"><Printer className="w-3.5 h-3.5 mr-1.5" /> Print</Button></TableCell></TableRow>))}</TableBody></Table></div>
        </Card>
      </section>
    </main>
  )
}

function SummaryCard({ label, value, icon, color = "text-zinc-800" }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white p-8 group hover:shadow-md transition-all">
      <div className="flex flex-col gap-4"><div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center transition-colors group-hover:bg-white">{icon}</div><div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p><h4 className={cn("text-2xl font-black tracking-tight leading-none", color)}>{value}</h4></div></div>
    </Card>
  )
}

function PaymentOption({ value, icon, label }: any) {
  return (
    <Label htmlFor={value} className="flex items-center justify-between p-5 rounded-2xl border-2 border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-all [&:has([data-state=checked])]:border-[#1e3a8a] [&:has([data-state=checked])]:bg-blue-50/30 group">
      <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-[#1e3a8a] transition-all">{icon}</div><span className="text-sm font-bold text-zinc-700">{label}</span></div>
      <RadioGroupItem value={value} id={value} className="border-zinc-300 text-[#1e3a8a]" />
    </Label>
  )
}
