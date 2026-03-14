
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ShieldCheck, 
  Layers, 
  LayoutGrid, 
  Users, 
  Wallet, 
  UserCheck, 
  Award, 
  Library, 
  Package, 
  Receipt, 
  Megaphone, 
  Settings, 
  Database,
  Loader2,
  X,
  Globe,
  ClipboardList,
  GraduationCap,
  FileText,
  FileVideo,
  Video,
  Trash2,
  Clock,
  History,
  UserPlus,
  Settings2,
  MapPin,
  BellRing,
  CalendarDays,
  User,
  Mail,
  Info,
  Building2,
  ShieldAlert,
  ArrowRight,
  Download,
  ArrowLeft,
  Monitor,
  Newspaper,
  Printer,
  Smartphone,
  Search,
  CreditCard,
  TrendingUp,
  Landmark,
  Save,
  Phone,
  AlertCircle
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, update, off, get, push, set, remove } from "firebase/database"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const PERMISSION_GROUPS = [
  {
    category: "Core Control",
    modules: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    ]
  },
  {
    category: "Digital Assets",
    modules: [
      { id: 'website_mgmt', label: 'Website Manager', icon: Globe, submodules: [
        { id: 'homepage_setup', label: '↳ Homepage Setup' },
        { id: 'about_us', label: '↳ About Us Page' },
        { id: 'infra_setup', label: '↳ Infrastructure' },
        { id: 'courses_setup', label: '↳ Courses Setup' },
        { id: 'blog_seo', label: '↳ Blog & SEO' },
        { id: 'website_inquiry', label: '↳ Website Inquiry' },
        { id: 'contact_seo', label: '↳ Contact & SEO' },
      ]},
      { id: 'branch_mgmt', label: 'Branch Management', icon: MapPin, submodules: [
        { id: 'manage_branches', label: '↳ Manage Branches' },
        { id: 'branch_login', label: '↳ Branch Login Link' },
      ]},
    ]
  },
  {
    category: "Academic Node",
    modules: [
      { id: 'batch_management', label: 'Batch Management', icon: Layers },
      { id: 'live_classes', label: 'Live Classes', icon: Video },
      { id: 'front_office', label: 'Front Office', icon: ClipboardList, submodules: [
        { id: 'admission_enquiry', label: '↳ Admission Enquiry' },
        { id: 'visitor_books', label: '↳ Visitor Books' },
        { id: 'phone_calls_logs', label: '↳ Phone Call Logs' },
        { id: 'complains', label: '↳ Complaints' },
        { id: 'postal_service', label: '↳ Postal Service' },
      ]},
      { id: 'student_info', label: 'Student Info', icon: UserPlus, submodules: [
        { id: 'student_admission', label: '↳ Student Admission' },
        { id: 'leave_request_student', label: '↳ Leave Request' },
        { id: 'document_management', label: '↳ Document Management' },
        { id: 'student_id_cards', label: '↳ Student Id Cards' },
        { id: 'student_login', label: '↳ Student Login Link' },
      ]},
      { id: 'fees_collections', label: 'Fees & Collections', icon: Wallet },
      { id: 'attendance', label: 'Attendance', icon: UserCheck },
      { id: 'examination', label: 'Examination', icon: FileText, submodules: [
        { id: 'online_exam', label: '↳ Online Exam' },
        { id: 'offline_exam', label: '↳ Offline Exam' },
        { id: 'offline_marks', label: '↳ Offline Marks' },
      ]},
      { id: 'marksheet', label: 'Marksheet', icon: GraduationCap },
      { id: 'e_content', label: 'E-Content', icon: FileVideo },
      { id: 'library_management', label: 'E-Library', icon: Library },
      { id: 'inventory', label: 'Inventory', icon: Package },
    ]
  },
  {
    category: "Human Resources",
    modules: [
      { id: 'hr', label: 'Human Resources', icon: Users, submodules: [
        { id: 'employee_directory', label: '↳ Staff Directory' },
        { id: 'employee_id_cards', label: '↳ Employee Id Cards' },
        { id: 'staff_attendance', label: '↳ Staff Attendance' },
        { id: 'staff_performance', label: '↳ Staff Performance' },
        { id: 'leave_request_hr', label: '↳ Leave Request' },
        { id: 'payroll', label: '↳ Payroll' },
        { id: 'staff_login', label: '↳ Staff Login Link' },
      ]},
    ]
  },
  {
    category: "System Backend",
    modules: [
      { id: 'account_management', label: 'Accounts', icon: Receipt },
      { id: 'announcement', label: 'Announcement', icon: Megaphone },
      { id: 'certificates', label: 'Certificates', icon: Award },
      { id: 'notification', label: 'Notification', icon: BellRing },
      { id: 'billing', label: 'Billing & Accounts', icon: CreditCard },
      { id: 'payment_setting', label: 'Payment Setting', icon: Settings2 },
      { id: 'system_setting', label: 'System Setting', icon: Settings },
      { id: 'holiday_calendar', label: 'Holiday Calendar', icon: CalendarDays },
      { id: 'backup', label: 'Database Backup', icon: Database },
      { id: 'trash', label: 'Trash Bin', icon: Trash2 },
    ]
  }
]

export default function InstituteDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { database } = useFirebase()
  const { user } = useUser()
  
  const [institute, setInstitute] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlanSaving, setIsPlanSaving] = useState(false)
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<'Deactivated' | 'Suspended' | 'Active'>('Active')
  const [statusReason, setStatusReason] = useState("")
  const [statusDate, setStatusDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  const [planDetails, setPlanDetails] = useState({
    totalPlanAmount: "",
    asmName: "",
    planType: "",
    activateDate: "",
    activateTime: "",
    expireDate: "",
    expireTime: "",
    nextRenewalDate: "",
    renewalAmount: "",
    customDomain: "",
    isWebsiteFirst: true
  })

  const [asms, setAsms] = useState<string[]>([])
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  useEffect(() => {
    if (!database || !id) return
    const rootPath = `Institutes/${id}`
    
    onValue(ref(database, rootPath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setInstitute(data)
        if (data.profile?.planDetails) {
          setPlanDetails(prev => ({ 
            ...prev, 
            ...data.profile.planDetails,
            isWebsiteFirst: data.profile.isWebsiteFirst !== undefined ? data.profile.isWebsiteFirst : true,
            totalPlanAmount: data.profile.planDetails.totalPlanAmount?.toString() || "",
            renewalAmount: data.profile.planDetails.renewalAmount?.toString() || ""
          }))
        } else {
          // Default state for new institutes
          setPlanDetails(prev => ({
            ...prev,
            isWebsiteFirst: data.profile?.isWebsiteFirst !== undefined ? data.profile.isWebsiteFirst : true
          }))
        }
        const aLogs = data.activityLogs ? Object.keys(data.activityLogs).map(k => ({ ...data[k], id: k })).reverse() : []
        setActivityLogs(aLogs)
      }
    })

    onValue(ref(database, `MasterProjects/${id}`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setProject(data)
        const pList = data.payments ? Object.keys(data.payments).map(k => ({ ...data[k], id: k })).reverse() : []
        setPaymentHistory(pList)
      }
    })

    get(ref(database, 'MasterConfig/ASMs')).then((asmSnap) => {
      if (asmSnap.exists()) setAsms(Object.values(asmSnap.val()).map((a: any) => a.value))
    })

    setIsLoading(false)
    return () => {
      off(ref(database, rootPath))
      off(ref(database, `MasterProjects/${id}`))
    }
  }, [database, id])

  const logActivity = async (action: string, description: string) => {
    if (!database || !id) return
    const logRef = ref(database, `Institutes/${id}/activityLogs`)
    await push(logRef, {
      action,
      user: user?.email || "Super Admin",
      description,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      timestamp: Date.now()
    })
  }

  const handleUpdateStatus = async () => {
    if (!database || !id) return
    setIsSubmitting(true)
    try {
      const updates: any = { 
        [`Institutes/${id}/profile/status`]: targetStatus,
        [`Institutes/${id}/profile/statusReason`]: statusReason,
        [`Institutes/${id}/profile/statusDate`]: statusDate,
        [`Institutes/${id}/profile/updatedAt`]: Date.now()
      }
      await update(ref(database), updates)
      await logActivity("STATUS_UPDATE", `Status set to ${targetStatus}. Reason: ${statusReason}`)
      toast({ title: `Node ${targetStatus}` })
      setIsStatusModalOpen(false)
      setStatusReason("")
    } catch (e) { toast({ variant: "destructive", title: "Error" }) }
    finally { setIsSubmitting(false) }
  }

  const handleSavePlanDetails = async () => {
    if (!database || !id) return
    setIsPlanSaving(true)
    try {
      const totalAmount = Number(planDetails.totalPlanAmount) || 0
      const currentPaid = Number(project?.receivedAmount || 0)
      
      const cleanPlanDetails = {
        ...planDetails,
        totalPlanAmount: totalAmount,
        renewalAmount: Number(planDetails.renewalAmount) || 0
      }

      const updates: any = {
        [`Institutes/${id}/profile/planDetails`]: cleanPlanDetails,
        [`Institutes/${id}/profile/currentPlan`]: planDetails.planType,
        [`Institutes/${id}/profile/customDomain`]: planDetails.customDomain || null,
        [`Institutes/${id}/profile/isWebsiteFirst`]: planDetails.isWebsiteFirst,
        [`Institutes/${id}/profile/netFees`]: totalAmount,
        [`Institutes/${id}/profile/plan_selected`]: true,
        [`Institutes/${id}/profile/status`]: 'Active',
        [`Institutes/${id}/profile/updatedAt`]: Date.now()
      }

      if (planDetails.customDomain) {
        const cleanDomain = planDetails.customDomain.toLowerCase().trim()
          .replace('https://', '')
          .replace('http://', '')
          .replace('www.', '')
          .split('/')[0] 
        
        if (cleanDomain && cleanDomain.length > 3) {
          const safeKey = cleanDomain.replace(/\./g, '_')
          updates[`Slugs/${safeKey}`] = id
        }
      }

      if (planDetails.expireDate) {
        const timeStr = planDetails.expireTime || "00:00"
        try {
          updates[`Institutes/${id}/profile/planExpiryDate`] = new Date(`${planDetails.expireDate}T${timeStr}`).toISOString()
        } catch (e) {
          console.warn("Invalid date format for expiry")
        }
      }

      updates[`MasterProjects/${id}`] = {
        ...(project || {}),
        businessName: institute?.profile?.instituteName || "Unknown",
        clientName: institute?.profile?.fullName || "Unknown",
        clientEmail: institute?.profile?.email || "",
        planType: planDetails.planType,
        customDomain: planDetails.customDomain || "",
        totalAmount: totalAmount,
        receivedAmount: currentPaid,
        dueAmount: Math.max(0, totalAmount - currentPaid),
        projectDate: planDetails.activateDate || today,
        expectedDeliveryDate: planDetails.expireDate || "",
        renewalDate: planDetails.nextRenewalDate || "",
        renewalAmount: Number(planDetails.renewalAmount) || 0,
        asmName: planDetails.asmName,
        status: "On Going",
        updatedAt: Date.now()
      }

      await update(ref(database), updates)
      await logActivity("PLAN_UPDATE", `Tier: ${planDetails.planType} | First Interaction: ${planDetails.isWebsiteFirst ? 'Website' : 'Login'}`)
      toast({ title: "Node Synchronized", description: "Plan and Domain settings updated." })
    } catch (e) { 
      console.error("Save Error:", e)
      toast({ variant: "destructive", title: "Sync Error", description: "Check field formats and connection." }) 
    }
    finally { setIsPlanSaving(false) }
  }

  const togglePermission = async (moduleId: string, submoduleId?: string) => {
    if (!database || !id) return
    let path = `Institutes/${id}/moduleAccess/${moduleId}`
    
    if (submoduleId) {
      const subPath = `${path}/submodules/${submoduleId}`
      const currentAccess = institute?.moduleAccess?.[moduleId]
      const currentSubVal = typeof currentAccess === 'object' ? currentAccess.submodules?.[submoduleId] : undefined
      const newSubVal = currentSubVal === false ? true : false
      await update(ref(database), { [subPath]: newSubVal })
      await logActivity("PERM_UPDATE", `Submodule ${submoduleId} toggled to ${newSubVal ? 'RESTRICTED' : 'ENABLED'}`)
    } else {
      const currentVal = institute?.moduleAccess?.[moduleId]
      const isModuleEnabled = typeof currentVal === 'object' ? currentVal.enabled !== false : currentVal !== false
      const newVal = !isModuleEnabled
      await update(ref(database), { [typeof currentVal === 'object' ? `${path}/enabled` : path]: newVal })
      await logActivity("PERM_UPDATE", `Main module ${moduleId} toggled to ${newVal ? 'ENABLED' : 'RESTRICTED'}`)
    }
    toast({ title: "Matrix Synced" })
  }

  const generatePremiumReceipt = (p: any) => {
    const doc = new jsPDF();
    const instName = institute?.profile?.instituteName || "INSTITUTE NODE";
    doc.setFillColor(186, 230, 253); 
    doc.triangle(210, 0, 210, 40, 170, 0, 'F');
    doc.triangle(0, 297, 0, 257, 40, 297, 'F');
    doc.setTextColor(239, 68, 68); 
    doc.setFontSize(22).setFont("helvetica", "bold").text("Digital Class", 20, 25);
    doc.setTextColor(100).setFontSize(8).setFont("helvetica", "normal").text("Educational World", 20, 30);
    doc.setTextColor(0).setFontSize(28).setFont("helvetica", "bold").text("INVOICE", 140, 25);
    doc.setFontSize(8).setTextColor(80).setFont("helvetica", "normal").text("Mohkar Educom India Pvt.Ltd\nEmail: sales@digitalclassworld.com\nWebsite: www.digitalclassworld.com\nLocation: Gujarat, India", 140, 32);
    doc.setTextColor(150).setFontSize(9).setFont("helvetica", "bold").text("RECEIVED FROM:", 20, 65);
    doc.setTextColor(0).setFontSize(12).text(institute?.profile?.fullName || "-", 20, 72);
    doc.setFontSize(8).setFont("helvetica", "normal").text(`Email: ${institute?.profile?.email || "-"}\nPhone: ${institute?.profile?.phone || "-"}`, 20, 78);
    autoTable(doc, { 
      startY: 105, 
      head: [['Sr No', 'Description', 'Amount', 'Receipt Date']], 
      body: [[1, `SaaS Subscription: ${planDetails.planType}`, `INR ${(Number(p.amount) || 0).toLocaleString()}`, p.date]], 
      theme: 'striped', 
      headStyles: { fillColor: [241, 245, 249], textColor: [100], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { textColor: [0, 0, 0], fontSize: 8 },
      columnStyles: { 2: { halign: 'right' } }
    });
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFillColor(248, 250, 252).rect(20, finalY, 170, 10, 'F');
    doc.setFontSize(9).setFont("helvetica", "bold").text("Total Payment", 120, finalY + 7);
    doc.text(`INR ${(Number(p.amount) || 0).toLocaleString()}`, 170, finalY + 7);
    doc.setTextColor(150).setFontSize(9).setFont("helvetica", "bold").text("COMPANY BANK DETAILS", 20, 240);
    doc.setTextColor(100).setFontSize(7).setFont("helvetica", "normal").text("MOHKAR EDUCOM INDIA PVT.LTD\nBank Name: Bank of Baroda\nAccount No: 27370200001147\nIFSC Code: BARB0SAIAHM\nBranch: Satellite Area Branch", 20, 246);
    doc.setTextColor(0).setFontSize(10).setFont("helvetica", "bold").text("Regards,\nTeam Digital Class", 160, 275, { align: 'center' });
    doc.save(`Invoice_${instName.replace(/\s+/g, '_')}_${p.date}.pdf`);
  };

  const financialSummary = {
    total: Number(project?.totalAmount || 0),
    paid: Number(project?.receivedAmount || 0),
    due: Math.max(0, (Number(project?.totalAmount || 0)) - (Number(project?.receivedAmount || 0)))
  }

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-32 font-public-sans text-[15px] font-bold text-black bg-white">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-800 transition-all shadow-sm"><ArrowLeft className="w-4 h-4" /></Button>
          <div><h2 className="text-2xl font-black text-zinc-800 uppercase tracking-tight font-headline">{institute?.profile?.instituteName}</h2><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Node Identifier: {id}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("rounded-xl px-4 py-2 text-[10px] font-black uppercase border-none shadow-sm", institute?.profile?.status === 'Active' ? "bg-emerald-50 text-emerald-600" : institute?.profile?.status === 'Suspended' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>{institute?.profile?.status || 'Active'}</Badge>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setTargetStatus('Deactivated'); setIsStatusModalOpen(true); }} size="sm" variant="outline" className="h-9 px-4 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 text-[10px] font-black uppercase">Deactivate</Button>
            <Button onClick={() => { setTargetStatus('Suspended'); setIsStatusModalOpen(true); }} size="sm" variant="outline" className="h-9 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase">Suspend</Button>
            <Button onClick={() => { setTargetStatus('Active'); setIsStatusModalOpen(true); }} size="sm" className="h-9 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase border-none shadow-md">Activate</Button>
          </div>
        </div>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
        <div className="p-8 border-b border-zinc-50 bg-zinc-50/30 flex items-center justify-between"><h3 className="text-xl font-bold text-zinc-800 font-headline">Advance Plan Management</h3><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Provisioning Node</p></div>
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Total Plan Amount (INR)</Label><Input value={planDetails.totalPlanAmount} onChange={e => setPlanDetails({...planDetails, totalPlanAmount: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">ASM Name</Label><Select value={planDetails.asmName} onValueChange={v => setPlanDetails({...planDetails, asmName: v})}><SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold"><SelectValue placeholder="Select ASM..." /></SelectTrigger><SelectContent>{asms.map((name, i) => <SelectItem key={i} value={name} className="font-bold">{name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Plan Type</Label><Select value={planDetails.planType} onValueChange={v => setPlanDetails({...planDetails, planType: v})}><SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold"><SelectValue placeholder="Select Plan..." /></SelectTrigger><SelectContent><SelectItem value="Starter Website" className="font-bold">Starter Website</SelectItem><SelectItem value="Cloud ERP" className="font-bold">Cloud ERP</SelectItem><SelectItem value="White Label Pro" className="font-bold">White Label Pro</SelectItem><SelectItem value="Enterprise" className="font-bold">Enterprise</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Custom Domain</Label><Input value={planDetails.customDomain} onChange={e => setPlanDetails({...planDetails, customDomain: e.target.value})} placeholder="e.g. school.com" className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-primary" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Activation Date</Label><div className="flex gap-2"><Input type="date" value={planDetails.activateDate} onChange={e => setPlanDetails({...planDetails, activateDate: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold" /><Input type="time" value={planDetails.activateTime} onChange={e => setPlanDetails({...planDetails, activateTime: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold w-32" /></div></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Expire Date</Label><div className="flex gap-2"><Input type="date" value={planDetails.expireDate} onChange={e => setPlanDetails({...planDetails, expireDate: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold" /><Input type="time" value={planDetails.expireTime} onChange={e => setPlanDetails({...planDetails, expireTime: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold w-32" /></div></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Next Renewal Date</Label><Input type="date" value={planDetails.nextRenewalDate} onChange={e => setPlanDetails({...planDetails, nextRenewalDate: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Renewal Amount</Label><Input value={planDetails.renewalAmount} onChange={e => setPlanDetails({...planDetails, renewalAmount: e.target.value})} className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold" /></div>
          </div>

          <div className="pt-10 border-t border-zinc-50">
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group transition-all hover:bg-white hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-zinc-100">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-800 uppercase">First Interaction: Login Page</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    If ON: / path leads to Login. If OFF: / path leads to Website. (Default: Website First)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", !planDetails.isWebsiteFirst ? "text-[#1e3a8a]" : "text-zinc-300")}>Login Page First</span>
                <Switch 
                  checked={!planDetails.isWebsiteFirst}
                  onCheckedChange={(v) => setPlanDetails({...planDetails, isWebsiteFirst: !v})}
                  className="data-[state=checked]:bg-[#1e3a8a]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6"><Button onClick={handleSavePlanDetails} disabled={isPlanSaving} className="bg-primary hover:opacity-90 text-white rounded-2xl h-14 px-12 font-black uppercase text-xs tracking-widest shadow-xl border-none gap-3">{isPlanSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />} Save & Sync Plan</Button></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-10">
          <Card className="border border-zinc-200 shadow-sm rounded-[32px] bg-white p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-zinc-50 pb-4"><ShieldCheck className="w-5 h-5 text-primary" /><h3 className="text-sm font-black uppercase text-zinc-700 tracking-widest">Master Identity Record</h3></div>
            <div className="space-y-2">
              <DetailRow icon={<Building2 className="w-4 h-4" />} label="INSTITUTE NAME" value={institute?.profile?.instituteName} />
              <DetailRow icon={<User className="w-4 h-4" />} label="OWNER / ADMIN NAME" value={institute?.profile?.fullName} />
              <DetailRow icon={<Mail className="w-4 h-4" />} label="OFFICIAL EMAIL" value={institute?.profile?.email} />
              <DetailRow icon={<Phone className="w-4 h-4" />} label="CONTACT PHONE" value={institute?.profile?.phone} />
              <DetailRow icon={<Globe className="w-4 h-4" />} label="SITE SLUG" value={institute?.profile?.slug} color="text-primary" />
              <DetailRow icon={<ShieldCheck className="w-4 h-4" />} label="ACTIVE TIER" value={institute?.profile?.currentPlan} color="text-indigo-600" />
            </div>
          </Card>

          <Card className="border border-zinc-200 shadow-sm rounded-[32px] bg-white p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-4"><div className="flex items-center gap-3"><Wallet className="w-5 h-5 text-emerald-500" /><h3 className="text-sm font-black uppercase tracking-widest text-zinc-800">Financial Ledger</h3></div><Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[9px] font-black">Synced Hub</Badge></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100"><p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Total Bill</p><p className="text-xl font-black text-zinc-800">₹{financialSummary.total.toLocaleString()}</p></div>
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Paid</p><p className="text-xl font-black text-emerald-600">₹{financialSummary.paid.toLocaleString()}</p></div>
              <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100"><p className="text-[9px] font-black text-rose-600 uppercase mb-1">Due</p><p className="text-xl font-black text-rose-600">₹{financialSummary.due.toLocaleString()}</p></div>
            </div>
            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <div className="flex items-center justify-between"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction History</p></div>
              <div className="space-y-2">
                {paymentHistory.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:bg-white hover:shadow-md transition-all">
                    <div><p className="text-[11px] font-black text-zinc-800 uppercase">₹{(Number(p.amount) || 0).toLocaleString()}</p><p className="text-[9px] font-bold text-zinc-400 uppercase">{p.date} • {p.method}</p></div>
                    <button onClick={() => generatePremiumReceipt(p)} className="p-2 hover:bg-zinc-100 rounded-lg text-emerald-600 border-none bg-transparent cursor-pointer"><Download className="w-4 h-4" /></button>
                  </div>
                ))}
                {paymentHistory.length === 0 && <p className="text-[10px] text-zinc-300 italic text-center py-4">No payments recorded</p>}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-10">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="p-10 border-b border-zinc-50 flex items-center justify-between"><div><div className="flex items-center gap-3 mb-2"><History className="w-6 h-6 text-zinc-800" /><h3 className="text-2xl font-black text-zinc-800 uppercase tracking-tight font-headline">Activity Log</h3></div><p className="text-sm text-zinc-400 font-medium">Internal audit trail for this node.</p></div></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-zinc-100">
                    <TableHead className="text-[13px] font-black text-black uppercase h-14 pl-10">When</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">User</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">Action</TableHead>
                    <TableHead className="text-[13px] font-black text-black uppercase h-14">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id} className="border-zinc-50 hover:bg-zinc-50/20 transition-none group text-black">
                      <TableCell className="pl-10 py-6 text-sm font-bold text-zinc-400">{log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : '-'}</TableCell>
                      <TableCell className="text-sm font-bold text-zinc-600">{log.user || 'admin'}</TableCell>
                      <TableCell><span className="text-[11px] font-black text-primary uppercase tracking-widest">{log.action || 'UPDATE'}</span></TableCell>
                      <TableCell><p className="text-[14px] text-zinc-700 font-bold leading-relaxed">{log.description}</p></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="border border-zinc-200 shadow-sm rounded-[32px] bg-white overflow-hidden">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-[#1e3a8a] border border-zinc-100 shadow-inner"><Settings className="w-5 h-5" /></div><div><h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Access Matrix</h3><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Feature Node Control</p></div></div></div>
            <ScrollArea className="h-[800px]">
              <div className="p-8 space-y-10">
                {PERMISSION_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-50 pb-2"><LayoutGrid className="w-4 h-4 text-zinc-300" /><h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">{group.category}</h4></div>
                    <div className="space-y-4">
                      {group.modules.map(m => {
                        const Icon = m.icon || LayoutGrid;
                        const currentAccess = institute?.moduleAccess?.[m.id];
                        const isModuleEnabled = typeof currentAccess === 'object' ? currentAccess.enabled !== false : currentAccess !== false;
                        return (
                          <div key={m.id} className="space-y-3">
                            <div className={cn("flex items-center justify-between p-5 rounded-[24px] border transition-all duration-300", isModuleEnabled ? "bg-white border-zinc-100 shadow-xl shadow-blue-900/5 scale-[1.02]" : "bg-zinc-50/50 border-transparent opacity-60 grayscale")}>
                              <div className="flex items-center gap-4"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner", isModuleEnabled ? "bg-blue-50 text-primary border border-zinc-100" : "bg-white text-zinc-300")}><Icon className="w-5 h-5" /></div><span className="text-[13px] font-black uppercase tracking-tight text-zinc-800">{m.label}</span></div>
                              <Switch checked={isModuleEnabled} onCheckedChange={() => togglePermission(m.id)} className="data-[state=checked]:bg-primary scale-90" />
                            </div>
                            {m.submodules && isModuleEnabled && (
                              <div className="pl-8 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                {m.submodules.map(sub => {
                                  const subAccess = (institute?.moduleAccess?.[m.id] as any)?.submodules?.[sub.id];
                                  const isSubRestricted = subAccess === false;
                                  return (<div key={sub.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/50 border border-transparent hover:border-zinc-100 transition-all"><span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">{sub.label}</span><Switch checked={!isSubRestricted} onCheckedChange={() => togglePermission(m.id, sub.id)} className="scale-75 data-[state=checked]:bg-indigo-500" /></div>);
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
          <div className={cn("p-10 text-white relative", targetStatus === 'Suspended' ? "bg-rose-600" : targetStatus === 'Active' ? "bg-emerald-600" : "bg-amber-500")}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white/40 border-none transition-all"><X className="h-6 w-6" /></DialogClose>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight">{targetStatus} Node</DialogTitle>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mandatory Reason</Label><Textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} required className="rounded-2xl border-zinc-100 bg-zinc-50 min-h-[120px] font-medium" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Effective Date</Label><Input type="date" value={statusDate} onChange={e => setStatusDate(e.target.value)} className="h-12 rounded-xl border-zinc-100 bg-zinc-50 font-bold" /></div>
            </div>
            <Button onClick={handleUpdateStatus} disabled={isSubmitting || !statusReason.trim()} className={cn("w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl border-none transition-all", targetStatus === 'Suspended' ? "bg-rose-600 hover:bg-rose-700" : targetStatus === 'Active' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-50 hover:bg-amber-600")}>Confirm Change</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function DetailRow({ label, value, color, icon }: any) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-zinc-50 last:border-0 group">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-white group-hover:text-primary transition-all shadow-inner">{icon || <Info className="w-5 h-5" />}</div>
      <div className="flex flex-col"><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span><span className={cn("text-sm font-black uppercase tracking-tight", color || "text-zinc-700")}>{value || '---'}</span></div>
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

function ProjectMeta({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-white group-hover:text-primary transition-all shadow-inner">{icon || <Info className="w-4 h-4" />}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-zinc-700 uppercase tracking-tight truncate">{value || '---'}</p>
      </div>
    </div>
  )
}
