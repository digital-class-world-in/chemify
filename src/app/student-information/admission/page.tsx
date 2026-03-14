
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  X, 
  Plus, 
  FileSpreadsheet,
  FileText,
  Search,
  Edit2,
  Trash2,
  Settings2,
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Check,
  GraduationCap,
  ChevronDown,
  Calendar,
  Mail,
  Lock,
  Save,
  Download,
  Upload,
  Filter,
  Eye,
  EyeOff,
  ImageIcon
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, set, remove, off, update, get } from "firebase/database"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { usePathname } from "next/navigation" 
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export default function StudentAdmissionPage() {
  const pathname = usePathname()
  const isPortal = (pathname.startsWith('/branch') && !pathname.startsWith('/branch-management')) || 
                   pathname.startsWith('/staff') || 
                   (pathname.startsWith('/student') && !pathname.startsWith('/student-information'))

  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [admissions, setAdmissions] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  
  // File states
  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null)
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null)
  
  // Filter states
  const [filterSession, setFilterSession] = useState("all")
  const [filterClass, setFilterClass] = useState("all")
  const [filterSection, setFilterSection] = useState("all")
  const [filterBatch, setFilterBatch] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterGender, setFilterGender] = useState("all")
  const [filterTransferTo, setFilterTransferTo] = useState("all")
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")

  // Fee Calculation States
  const [grandTotal, setGrandTotal] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)

  // Manage Dropdown States
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [activeManageField, setActiveManageField] = useState<{key: string, label: string} | null>(null)
  const [newOptionValue, setNewOptionValue] = useState("")
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({})

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { database } = useFirebase()
  const storage = getStorage()
  const { user } = useUser()
  const { resolvedId, branchId, isBranch, isStaff, staffId } = useResolvedId()

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
    return dateStr
  }

  const [nextAdmissionNo, setNextAdmissionNo] = useState<string>("1")
  const [nextRollNo, setNextRollNo] = useState<string>("1")

  useEffect(() => {
    if (!database || !resolvedId || editingStudent) return
    const admissionsRef = ref(database, `Institutes/${resolvedId}/admissions`)
    get(admissionsRef).then((snapshot) => {
      if (!snapshot.exists()) {
        setNextRollNo("1")
        setNextAdmissionNo("1")
        return
      }
      const allStudents = snapshot.val()
      const numbers = Object.values(allStudents)
        .map((s: any) => {
          const numPart = s.admissionNo?.toString().replace(/\D/g, '')
          return numPart ? parseInt(numPart, 10) : 0
        })
        .filter(n => !isNaN(n) && n > 0)
      const rollNumbers = Object.values(allStudents)
        .map((s: any) => {
          const numPart = s.rollNo?.toString().replace(/\D/g, '')
          return numPart ? parseInt(numPart, 10) : 0
        })
        .filter(n => !isNaN(n) && n > 0)

      setNextAdmissionNo(numbers.length === 0 ? "1" : (Math.max(...numbers) + 1).toString())
      setNextRollNo(rollNumbers.length === 0 ? "1" : (Math.max(...rollNumbers) + 1).toString())
    })
  }, [database, resolvedId, admissions, editingStudent])

  useEffect(() => {
    if (!database || !resolvedId) return
    const rootPath = `Institutes/${resolvedId}`
    setIsLoading(true)
    const unsubAdm = onValue(ref(database, `${rootPath}/admissions`), (snapshot) => {
      const data = snapshot.val()
      if (data) setAdmissions(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setAdmissions([])
      setIsLoading(false)
    })
    const unsubBatches = onValue(ref(database, `${rootPath}/batches`), (snapshot) => {
      const data = snapshot.val()
      if (data) setBatches(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setBatches([])
    })
    onValue(ref(database, `${rootPath}/profile/instituteName`), (s) => { if (s.exists()) setInstituteName(s.val()) })
    onValue(ref(database, `${rootPath}/dropdowns`), (snapshot) => {
      const data = snapshot.val() || {}
      const processed: Record<string, any[]> = {}
      Object.keys(data).forEach(key => { processed[key] = Object.keys(data[key]).map(id => ({ id, value: data[key][id].value })) })
      setDropdownData(processed)
    })
    return () => { unsubAdm(); unsubBatches(); }
  }, [database, resolvedId])

  useEffect(() => {
    if (editingStudent) {
      setGrandTotal(Number(editingStudent.totalFees) || 0)
      setDiscount(Number(editingStudent.discount) || 0)
    } else {
      setGrandTotal(0); setDiscount(0);
    }
  }, [editingStudent])

  const netFees = useMemo(() => Math.max(0, grandTotal - discount), [grandTotal, discount])

  const handleAddAdmission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolvedId || !database || isSubmitting) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    let finalAdmissionNo = data.admissionNo?.toString().trim() || (editingStudent ? editingStudent.admissionNo : nextAdmissionNo)
    let finalRollNo = data.rollNo?.toString().trim() || (editingStudent ? editingStudent.rollNo : nextRollNo)
    let finalStudentPhotoUrl = editingStudent?.studentPhotoUrl || ''
    let finalIdProofUrl = editingStudent?.idProofUrl || ''
    let finalAddressProofUrl = editingStudent?.addressProofUrl || ''
    
    const uploadPromises: Promise<void>[] = []
    if (studentPhotoFile) {
      const uploadPhoto = async () => {
        const path = `Institutes/${resolvedId}/admissions/photos/${Date.now()}-${studentPhotoFile.name.replace(/[^a-z0-9.-]/gi, '_')}`
        const fileRef = storageRef(storage, path)
        await uploadBytes(fileRef, studentPhotoFile)
        finalStudentPhotoUrl = await getDownloadURL(fileRef)
      }
      uploadPromises.push(uploadPhoto())
    }
    
    if (uploadPromises.length > 0) {
      try { await Promise.all(uploadPromises) } catch (err: any) { toast({ variant: "destructive", title: "Upload Failed" }) }
    }

    const dbPath = `Institutes/${resolvedId}/admissions`
    const studentData = { 
      ...data, 
      admissionNo: finalAdmissionNo, 
      rollNo: finalRollNo, 
      totalFees: grandTotal, 
      discount: discount, 
      netFees: netFees, 
      studentPhotoUrl: finalStudentPhotoUrl, 
      idProofUrl: finalIdProofUrl, 
      addressProofUrl: finalAddressProofUrl,
      branchId: isBranch ? branchId : (editingStudent?.branchId || null), 
      createdBy: isStaff ? staffId : isBranch ? branchId : 'admin', 
      updatedAt: Date.now(), 
      status: editingStudent?.status || 'Active', 
      loginStatus: true, 
      courseDurationMonths: data.courseDurationMonths ? Number(data.courseDurationMonths) : null,
    }

    try {
      const now = new Date().toISOString()
      let studentKey = editingStudent?.id;
      
      if (editingStudent) {
        await update(ref(database, `${dbPath}/${editingStudent.id}`), studentData)
      } else {
        const newRef = push(ref(database, dbPath))
        studentKey = newRef.key;
        await set(newRef, { ...studentData, createdAt: Date.now(), id: studentKey })
        
        // --- REAL-TIME NOTIFICATION TRIGGER ---
        const notification = {
          title: "Admission Confirmed",
          message: `Welcome to ${instituteName}! Your admission for ${data.courseName} is verified. Use your email to login to the portal.`,
          type: "Admission",
          read: false,
          timestamp: now
        }
        
        // Notify Student
        if (studentKey) {
          await push(ref(database, `Institutes/${resolvedId}/notifications/${studentKey}`), notification)
        }
        
        // Notify Admin
        await push(ref(database, `Institutes/${resolvedId}/notifications/admin`), {
          ...notification,
          title: "New Admission Recorded",
          message: `New candidate ${data.studentName} has been registered for ${data.courseName}.`
        })
      }
      
      setIsModalOpen(false); setEditingStudent(null);
      toast({ title: editingStudent ? "Student Updated" : "Admission Successful" })
    } catch (err: any) { 
      toast({ variant: "destructive", title: "Error", description: err.message }) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, maxSize: number, type: string, minSize: number = 0) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > maxSize) {
      toast({ variant: "destructive", title: "File too large", description: `${type} max size is ${Math.round(maxSize / (1024 * 1024))}MB` })
      e.target.value = ''
      return
    }
    setter(file)
  }

  const handleDelete = (id: string) => { if (confirm("Permanently delete this student record?")) { remove(ref(database!, `Institutes/${resolvedId}/admissions/${id}`)).then(() => toast({ title: "Record Deleted" })) } }

  const handleSaveOption = () => {
    if (!newOptionValue.trim() || !resolvedId || !database || !activeManageField) return
    const dbPath = `Institutes/${resolvedId}/dropdowns/${activeManageField.key}`
    if (editingOptionId) update(ref(database, `${dbPath}/${editingOptionId}`), { value: newOptionValue.trim() }).then(() => { setNewOptionValue(""); setEditingOptionId(null); })
    else push(ref(database, dbPath), { value: newOptionValue.trim() }).then(() => setNewOptionValue(""))
  }

  const downloadSampleCsv = () => {
    const headers = ["Admission_No", "Roll_No", "Student_Name", "Class", "Course", "Section", "Batch", "Session", "DOB", "Gender", "Religion", "Category", "Blood_Group", "Mobile", "Email", "Father_Name", "Mother_Name", "Father_Mobile", "Address", "Total_Fees", "Discount", "Password", "Course_Duration_Months"]
    const dummy = ["52", "56", "John Doe", "10", "Science", "A", "Morning Batch", "2024-25", "2010-05-15", "Male", "General", "General", "O+", "9876543210", "john.doe@test.com", "Robert Doe", "Mary Doe", "9876543210", "123 Street City", "50000", "500", "password123", "12"]
    const csvContent = "data:text/csv;charset=utf-8," + [headers, dummy].map(e => e.join(",")).join("\n")
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "student_admission_sample.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !resolvedId || !database) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); const dbPath = `Institutes/${resolvedId}/admissions`
      for (const row of data as any[]) {
        const studentData = {
          admissionNo: row.Admission_No || `ADM-${Date.now()}`, rollNo: row.Roll_No || "", studentName: row.Student_Name || "Imported Student", class: row.Class || "", course: row.Course || row.Class || "", section: row.Section || "", batch: row.Batch || "", session: row.Session || "", dob: row.DOB || "", gender: row.Gender || "Male", mobile: row.Mobile?.toString() || "", email: row.Email || "", fatherName: row.Father_Name || "", motherName: row.Mother_Name || "", fatherMobile: row.Father_Mobile || "", address: row.Address || "", totalFees: Number(row.Total_Fees) || 0, discount: Number(row.Discount) || 0, netFees: (Number(row.Total_Fees) || 0) - (Number(row.Discount) || 0), password: row.Password || "password123", courseDurationMonths: Number(row.Course_Duration_Months) || null, status: "Active", loginStatus: true, createdAt: Date.now(), updatedAt: Date.now(), branchId: isBranch ? branchId : null, createdBy: 'admin'
        }
        await push(ref(database, dbPath), studentData)
      }
      toast({ title: "Import Successful", description: `${data.length} records processed.` })
    }
    reader.readAsBinaryString(file); e.target.value = ""
  }

  const exportExcel = () => {
    if (!filteredAdmissions.length) return
    const ws = XLSX.utils.json_to_sheet(filteredAdmissions.map((a, i) => ({ "Sr No": i + 1, "Student Name": a.studentName, "Admission No": a.admissionNo, "Roll No": a.rollNo || '-', "Class": a.class || '-', "Course": a.courseName || '-', "Section": a.section || '-', "Batch": a.batch || '-', "Session": a.session || '-', "DOB": a.dob || '-', "Gender": a.gender || '-', "Admission Date": a.admissionDate, "Mobile": a.mobile, "Email": a.email, "Net Fees": a.netFees || 0 })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Students_Registry"); XLSX.writeFile(wb, `Student_Registry_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const exportPDF = () => {
    if (!filteredAdmissions.length) return
    const doc = new jsPDF('l', 'mm', [450, 210]); doc.setFontSize(20).setTextColor(13, 148, 136).text(instituteName, 14, 20); doc.setFontSize(10).setTextColor(100).text(`Student Master Registry - Generated: ${format(new Date(), "PPp")}`, 14, 28)
    const tableData = filteredAdmissions.map((a, i) => [i + 1, a.studentName, a.admissionNo, a.rollNo || '-', a.class || '-', a.courseName || '-', a.section || '-', a.batch || '-', a.mobile, a.email, a.gender, formatDateDisplay(a.dob), a.netFees || 0])
    autoTable(doc, { startY: 35, head: [['#', 'Name', 'Adm No', 'Roll', 'Class', 'Course', 'Sec', 'Batch', 'Mobile', 'Email', 'Gender', 'DOB', 'Fee']], body: tableData, theme: 'striped', headStyles: { fillColor: [13, 148, 136] }, styles: { fontSize: 8 } })
    doc.save(`Student_Registry_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const openManageModal = (key: string, label: string) => { setActiveManageField({ key, label }); setNewOptionValue(""); setEditingOptionId(null); setIsManageOpen(true); }

  const filteredAdmissions = useMemo(() => {
    let list = admissions
    if (isBranch && branchId) list = list.filter(a => a.branchId === branchId)
    return list.filter(a => {
      const matchesSearch = !searchTerm || 
        a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.admissionNo?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSession = filterSession === "all" || a.session === filterSession
      const matchesClass = filterClass === "all" || a.class === filterClass
      const matchesSection = filterSection === "all" || a.section === filterSection
      const matchesBatch = filterBatch === "all" || a.batch === filterBatch
      const matchesSource = filterSource === "all" || a.source === filterSource
      const matchesCategory = filterCategory === "all" || a.category === filterCategory
      const matchesGender = filterGender === "all" || a.gender === filterGender
      const matchesTransferTo = filterTransferTo === "all" || a.transferTo === filterTransferTo
      let matchesDate = true
      if (filterFromDate || filterToDate) {
        if (filterFromDate && a.admissionDate < filterFromDate) matchesDate = false
        if (filterToDate && a.admissionDate > filterToDate) matchesDate = false
      }
      return matchesSearch && matchesSession && matchesClass && matchesSection && matchesBatch && matchesSource && matchesCategory && matchesGender && matchesTransferTo && matchesDate
    }).reverse()
  }, [admissions, searchTerm, isBranch, branchId, filterSession, filterClass, filterSection, filterBatch, filterSource, filterCategory, filterGender, filterTransferTo, filterFromDate, filterToDate])

  const paginatedAdmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAdmissions.slice(start, start + itemsPerPage)
  }, [filteredAdmissions, currentPage])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      <Sidebar />
      <div className={cn("flex flex-col flex-1 min-w-0", !isPortal && "lg:pl-[300px]")}>
        <TopNav />
        <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
              <h2 className="text-[26px] font-normal text-zinc-800 font-headline tracking-tight leading-none uppercase">Admission Management ({filteredAdmissions.length})</h2>
              <p className="text-sm text-zinc-400 font-medium mt-1">Enrollment registry and student lifecycle tracking</p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) { setEditingStudent(null); } }}>
              <DialogTrigger asChild>
                <button onClick={() => { setEditingStudent(null); setGrandTotal(0); setDiscount(0); }} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-10 font-medium text-base border-none shadow-lg active:scale-95 transition-all">
                  Add New
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 border border-zinc-200 rounded-[32px] overflow-hidden bg-white shadow-2xl sm:max-w-[55vw]">
                <div className="bg-white px-10 py-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 z-50">
                  <DialogTitle className="text-xl font-medium text-zinc-800">{editingStudent ? 'Update Student Profile' : 'New Admission Registration'}</DialogTitle>
                  <DialogClose className="p-2 hover:bg-zinc-100 rounded-full border-none outline-none"><X className="h-5 w-5 text-zinc-400" /></DialogClose>
                </div>
                <ScrollArea className="max-h-[85vh]">
                  <form onSubmit={handleAddAdmission} className="p-10 space-y-12">
                    <div className="space-y-8">
                      <h3 className="text-sm font-bold text-[#0D9488] uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Academic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Admission No. *</Label><Input name="admissionNo" defaultValue={editingStudent?.admissionNo || nextAdmissionNo} required className="rounded-xl border-zinc-200 h-12 font-normal text-black text-sm" /></div>
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Roll No *</Label><Input name="rollNo" defaultValue={editingStudent?.rollNo || nextRollNo} required className="rounded-xl border-zinc-200 h-12 font-normal text-black text-sm" /></div>
                        
                        <FormSelect label="Class" name="class" defaultValue={editingStudent?.class} options={dropdownData['class'] || []} onManage={() => openManageModal('class', 'Class')} required />
                        <FormSelect label="Course" name="courseName" defaultValue={editingStudent?.courseName} options={dropdownData['course'] || []} onManage={() => openManageModal('course', 'Course')} required />
                        
                        <FormSelect label="Section" name="section" defaultValue={editingStudent?.section} options={dropdownData['section'] || []} onManage={() => openManageModal('section', 'Section')} />
                        <FormSelect label="Batch" name="batch" defaultValue={editingStudent?.batch} options={batches.map(b => ({ id: b.id, value: b.batchName, label: b.batchName }))} required />
                        <FormSelect label="Admission Session" name="session" defaultValue={editingStudent?.session} options={dropdownData['session'] || []} onManage={() => openManageModal('session', 'Session')} required />
                        <FormGroup label="Admission Date" name="admissionDate" type="date" defaultValue={editingStudent?.admissionDate || today} required />
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Course Duration (months)</Label><Input name="courseDurationMonths" type="number" defaultValue={editingStudent?.courseDurationMonths || ""} className="rounded-xl border-zinc-200 h-12" /></div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-sm font-bold text-[#6366F1] uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <FormGroup label="Full Name" name="studentName" defaultValue={editingStudent?.studentName} required />
                        <FormGroup label="Date Of Birth" name="dob" type="date" defaultValue={editingStudent?.dob} required />
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Gender</Label><Select name="gender" defaultValue={editingStudent?.gender || "Male"}><SelectTrigger className="h-12 rounded-xl border-zinc-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
                        <FormGroup label="Mobile Number" name="mobile" type="tel" defaultValue={editingStudent?.mobile} required />
                        <div className="md:col-span-2"><FormGroup label="Permanent Address" name="address" defaultValue={editingStudent?.address} /></div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Student Fee Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Grand Total Fee</Label><Input type="number" value={grandTotal} onChange={(e) => setGrandTotal(Number(e.target.value))} required className="h-12 rounded-xl border-zinc-200 font-bold" /></div>
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Applicable Discount</Label><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-12 rounded-xl border-zinc-200" /></div>
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Net Total Fee</Label><Input type="number" value={netFees} readOnly className="h-12 rounded-xl border-none bg-zinc-50 font-black text-[#0D9488] shadow-inner" /></div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-sm font-bold text-[#1e3a8a] uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Portal Credentials</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1.5"><Label className="text-[12px] font-black text-zinc-400 uppercase tracking-widest ml-1">Portal Login Email *</Label><Input name="email" type="email" defaultValue={editingStudent?.email} required className="h-12 rounded-xl border-zinc-200 font-bold" /></div>
                        <div className="space-y-1.5"><Label className="text-[12px] font-medium text-black ml-1">Access Password *</Label><Input name="password" type="text" defaultValue={editingStudent?.password || "password123"} required className="rounded-xl border-zinc-200 h-12 font-bold" /></div>
                      </div>
                    </div>

                    <div className="pt-4 pb-10">
                      <Button type="submit" disabled={isSubmitting} className="bg-primary hover:opacity-90 text-white rounded-xl h-14 px-12 font-black uppercase text-xs tracking-widest shadow-xl border-none active:scale-95 transition-all">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Finalize Admission
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* ... Rest of table and pagination UI ... */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="relative group w-full md:w-80">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search Registry..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 h-11 bg-white border-zinc-200 rounded-lg text-sm font-medium transition-none focus-visible:ring-primary shadow-sm" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={downloadSampleCsv} className="h-11 px-5 text-[#0D9488] border-[#0D9488]/20 rounded-xl transition-none gap-2 font-normal text-xs bg-white hover:bg-emerald-50 shadow-sm"><Download className="h-4 w-4" /> Sample Csv</Button>
                <input type="file" ref={fileInputRef} onChange={handleImportCsv} className="hidden" accept=".csv" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-11 px-5 text-indigo-600 border-indigo-100 rounded-xl transition-none gap-2 font-bold text-xs bg-white hover:bg-indigo-50 shadow-sm"><Upload className="h-4 w-4" /> Import Csv</Button>
                <Button variant="outline" onClick={exportExcel} className="h-11 px-5 text-emerald-600 border-emerald-100 rounded-xl transition-none gap-2 font-normal text-xs bg-white hover:bg-emerald-50 shadow-sm"><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
                <Button variant="outline" onClick={exportPDF} className="h-11 px-4 text-rose-600 border-rose-100 rounded-xl transition-none gap-2.5 font-bold text-xs bg-white hover:bg-rose-50 shadow-sm"><FileText className="h-4 w-4" /> Export Pdf</Button>
              </div>
            </div>

            <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
              <div className="overflow-x-auto scrollbar-thin">
                <Table className="min-w-[1800px]">
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100">
                      <TableHead className="pl-4 text-xs font-medium text-black h-14 w-16">SR NO</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">ACTION</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">STUDENT NAME</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">ADMISSION NO</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">CLASS</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">MOBILE</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">EMAIL</TableHead>
                      <TableHead className="text-xs font-medium text-black h-14">NET FEES</TableHead>
                      <TableHead className="text-right pr-4 text-xs font-medium text-black h-14">DATE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAdmissions.map((row, index) => (
                      <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-none group">
                        <TableCell className="text-sm font-medium text-black pl-4">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell><div className="flex items-center gap-1"><Button variant="ghost" size="icon" asChild title="View Profile" className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 transition-none"><Link href={`/student-information/admission/${row.id}`}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={() => { setEditingStudent(row); setIsModalOpen(true); }} className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                        <TableCell><span className="text-sm font-medium text-black uppercase font-headline whitespace-nowrap">{row.studentName}</span></TableCell>
                        <TableCell className="text-base font-medium text-black font-mono tracking-tighter">{row.admissionNo}</TableCell>
                        <TableCell className="text-sm font-medium text-black">{row.class}</TableCell>
                        <TableCell className="text-sm text-black">{row.mobile}</TableCell>
                        <TableCell className="text-sm text-black lowercase">{row.email}</TableCell>
                        <TableCell className="text-sm font-black text-emerald-600">₹{Number(row.netFees || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-4 text-xs text-black">{row.admissionDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-10 bg-white border-none shadow-2xl">
          <div className="flex items-center justify-between mb-8"><DialogTitle className="text-xl font-normal">Manage {activeManageField?.label}</DialogTitle></div>
          <div className="flex gap-2 mb-8"><Input value={newOptionValue} onChange={(e) => setNewOptionValue(e.target.value)} placeholder="Enter new..." className="rounded-xl h-12" /><Button onClick={handleSaveOption} className="bg-primary text-white rounded-xl px-8 h-12 border-none shadow-lg">Add</Button></div>
          <ScrollArea className="h-64 pr-4"><div className="space-y-2">{(dropdownData[activeManageField?.key || ''] || []).map(opt => (
            <div key={opt.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-all">
              <span className="text-sm font-normal text-zinc-700">{opt.value}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingOptionId(opt.id); setNewOptionValue(opt.value); }} className="text-blue-500 h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(ref(database!, `Institutes/${resolvedId}/dropdowns/${activeManageField!.key}/${opt.id}`))} className="text-rose-500 h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}</div></ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormGroup({ label, name, type = "text", required = false, defaultValue }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-black ml-1">{label} {required && "*"}</Label>
      <Input name={name} type={type} required={required} defaultValue={defaultValue} className="rounded-xl border-zinc-200 h-12 font-normal text-black text-sm" />
    </div>
  )
}

function FormSelect({ label, name, options, onManage, defaultValue, required = false }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <Label className="text-[12px] font-medium text-black">{label} {required && "*"}</Label>
        {onManage && <button type="button" onClick={onManage} className="text-[11px] font-bold text-blue-600 hover:underline">Manage <Settings2 className="w-2.5 h-2.5 inline" /></button>}
      </div>
      <Select name={name} defaultValue={defaultValue} required={required}>
        <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-normal text-zinc-800 focus:ring-primary transition-none bg-white text-[15px]"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">{options.map((opt: any) => (<SelectItem key={opt.id} value={opt.value} className="rounded-lg text-[15px] font-bold">{opt.value}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  )
}

function CriteriaRadioBox({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: any[] }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white flex items-center justify-between text-xs font-bold text-zinc-600 shadow-inner group hover:border-primary transition-all">
            <span className="truncate">{value === 'all' ? `Select` : value}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-primary" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 rounded-2xl overflow-hidden border-zinc-100 shadow-2xl">
          <div className="bg-zinc-50 p-4 border-b border-zinc-100 flex justify-between items-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Select {label}</p>
          </div>
          <ScrollArea className="h-64">
            <RadioGroup value={value} onValueChange={onChange} className="p-2 space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors group">
                <RadioGroupItem value="all" id={`${label}-all`} className="text-primary border-zinc-300" />
                <Label htmlFor={`${label}-all`} className="text-xs font-bold text-zinc-600 uppercase cursor-pointer flex-1">All {label}s</Label>
              </div>
              {options.map(opt => (
                <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors group">
                  <RadioGroupItem value={opt.value} id={`${label}-${opt.id}`} className="text-primary border-zinc-300" />
                  <Label htmlFor={`${label}-${opt.id}`} className="text-xs font-bold text-zinc-600 uppercase cursor-pointer flex-1">{opt.value}</Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}
