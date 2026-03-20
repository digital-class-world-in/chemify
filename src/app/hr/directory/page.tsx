"use client"
import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Plus, Search as SearchIcon, Trash2, Edit2, X, LayoutGrid, Video, Wallet,
  UserCheck, GraduationCap, FileVideo, Library, Package, Receipt, Megaphone,
  Award, BellRing, CalendarDays, Database, Users, ShieldCheck, Loader2,
  ChevronLeft, ChevronRight, Phone, Mail, Shield, Save, Download, Upload, FileText,
  Settings
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, push, set, remove, update } from "firebase/database"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const PERMISSION_GROUPS = [
  { category: "Main Modules", modules: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'batch_management', label: 'Batch Management', icon: LayoutGrid },
    { id: 'live_classes', label: 'Live Classes', icon: Video },
    { id: 'fees_collections', label: 'Fees Collections', icon: Wallet },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'marksheet', label: 'Marksheet', icon: GraduationCap },
    { id: 'e_content', label: 'E-Content', icon: FileVideo },
    { id: 'library_management', label: 'Library Management', icon: Library },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'account_management', label: 'Account Management', icon: Receipt },
    { id: 'announcement', label: 'Announcement', icon: Megaphone },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'notification', label: 'Notification', icon: BellRing },
    { id: 'billing', label: 'Billing & Accounts', icon: Wallet },
    { id: 'payment_setting', label: 'Payment Setting', icon: Shield },
    { id: 'system_setting', label: 'System Setting', icon: Database },
    { id: 'holiday_calendar', label: 'Holiday Calendar', icon: CalendarDays },
    { id: 'backup', label: 'Database Backup', icon: Database },
  ]},
  { category: "Student Info", modules: [
    { id: 'student_info', label: 'Student Info', icon: Users, submodules: [
      { id: 'student_admission', label: '↳ Student Admission' },
      { id: 'leave_request_student', label: '↳ Leave Request' },
    ]}
  ]},
  { category: "Human Resources", modules: [
    { id: 'human_resources', label: 'Human Resources', icon: Users, submodules: [
      { id: 'employee_directory', label: '↳ Employee Directory' },
      { id: 'staff_attendance', label: '↳ Staff Attendance' },
      { id: 'payroll', label: '↳ Payroll' },
    ]}
  ]}
]

export default function EmployeeDirectoryPage() {
  const pathname = usePathname()
  const isPortal = pathname?.startsWith('/branch') || pathname?.startsWith('/staff') ||
                   (pathname?.startsWith('/student') && !pathname?.startsWith('/student-information'))
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  // Filters
  const [filterDept, setFilterDept] = useState("all")
  const [filterDesignation, setFilterDesignation] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { database } = useFirebase()
  const { resolvedId, branchId, isBranch, isStaff, staffId } = useResolvedId()

  // Photo preview (local only)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // ─── Manage Department / Designation Dialog ───
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [manageField, setManageField] = useState<"department" | "designation" | null>(null)
  const [newOption, setNewOption] = useState("")
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)

  useEffect(() => {
    if (!database || !resolvedId) return

    const rootPath = `Institutes/${resolvedId}`

    onValue(ref(database, `${rootPath}/employees`), (snapshot) => {
      const data = snapshot.val()
      setItems(data ? Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, id })).reverse() : [])
      setIsLoading(false)
    })

    onValue(ref(database, `${rootPath}/dropdowns`), (snapshot) => {
      const data = snapshot.val() || {}
      const processed: Record<string, any[]> = {}
      Object.keys(data).forEach(key => {
        processed[key] = Object.entries(data[key]).map(([id, v]: [string, any]) => ({ id, value: v.value }))
      })
      setDropdownData(processed)
    })
  }, [database, resolvedId])

  const hasActiveFilters = useMemo(() =>
    filterDept !== "all" || filterDesignation !== "all" || fromDate || toDate || searchTerm,
  [filterDept, filterDesignation, fromDate, toDate, searchTerm])

  const filteredItems = useMemo(() => {
    let list = items
    if (isBranch && branchId) list = list.filter(item => item.branchId === branchId)

    return list.filter(item => {
      const name = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase()
      const matchSearch = !searchTerm ||
        name.includes(searchTerm.toLowerCase()) ||
        (item.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchDept = filterDept === 'all' || item.department === filterDept
      const matchDesignation = filterDesignation === 'all' || item.designation === filterDesignation
      let matchDate = true
      if (fromDate || toDate) {
        const joinDate = item.dateOfJoining || ''
        if (fromDate && joinDate < fromDate) matchDate = false
        if (toDate && joinDate > toDate) matchDate = false
      }
      return matchSearch && matchDept && matchDesignation && matchDate
    })
  }, [items, searchTerm, isBranch, branchId, filterDept, filterDesignation, fromDate, toDate])

  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  const resetFilters = () => {
    setFilterDept("all")
    setFilterDesignation("all")
    setFromDate("")
    setToDate("")
    setSearchTerm("")
    setCurrentPage(1)
  }

  // =============== CSV IMPORT / EXPORT ===============
  const downloadSampleCSV = () => {
    const csvContent = `employeeId,firstName,lastName,fatherName,motherName,staffEmail,gender,dateOfBirth,dateOfJoining,phone,emergencyContact,maritalStatus,department,designation,qualification,workExperience,address,permanentAddress,notes,basicSalary,epfNo,contractType,workShift,workLocation,accountTitle,bankAccountNumber,bankName,ifscCode,branchName,facebookUrl,twitterUrl,linkedinUrl,instagramUrl\nEMP001,John,Smith,Robert,Anita,john@school.com,Male,1995-05-15,2024-01-10,9876543210,9876543211,Married,Teaching,Teacher,M.Sc.,5 years,123 Street,456 Street,Good performer,45000,EPF123,Full Time,Morning,Main Campus,John Smith,123456789012,State Bank,SBIN0001234,Ahmedabad Branch,https://fb.com/john,https://twitter.com/john,https://linkedin.com/john,https://instagram.com/john`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_sample.csv'
    a.click()
    toast({ title: "Sample CSV Downloaded" })
  }

  const exportToCSV = () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "No data to export" })
      return
    }
    const headers = ["employeeId","firstName","lastName","fatherName","motherName","staffEmail","gender","dateOfBirth","dateOfJoining","phone","emergencyContact","maritalStatus","department","designation","qualification","workExperience","address","permanentAddress","notes","basicSalary","epfNo","contractType","workShift","workLocation","accountTitle","bankAccountNumber","bankName","ifscCode","branchName","facebookUrl","twitterUrl","linkedinUrl","instagramUrl"]
    const csvRows = [headers.join(",")]
    items.forEach(item => {
      const row = headers.map(h => `"${(item[h] || '').toString().replace(/"/g, '""')}"`).join(",")
      csvRows.push(row)
    })
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "employees_export.csv"
    link.click()
    toast({ title: "CSV Exported Successfully" })
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !database || !resolvedId) return
    const text = await file.text()
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map(h => h.replace(/"/g, ''))
    const dataRows = lines.slice(1)
    for (const row of dataRows) {
      if (!row.trim()) continue
      const values = row.split(",").map(v => v.replace(/^"|"$/g, ''))
      const employee: any = {}
      headers.forEach((h, i) => { employee[h] = values[i] || "" })
      const newRef = push(ref(database, `Institutes/${resolvedId}/employees`))
      const initialPermissions: Record<string, boolean> = { dashboard: true }
      PERMISSION_GROUPS.forEach(g => g.modules.forEach(m => {
        initialPermissions[m.id] = false
        if (m.submodules) m.submodules.forEach(sub => initialPermissions[sub.id] = false)
      }))
      await set(newRef, {
        ...employee,
        id: newRef.key,
        createdAt: Date.now(),
        loginStatus: true,
        role: 'Staff',
        moduleAccess: initialPermissions,
        branchId: isBranch ? branchId : null,
        createdBy: isStaff ? staffId : isBranch ? branchId : 'admin'
      })
    }
    toast({ title: `${dataRows.length} Employees Imported Successfully` })
    e.target.value = ""
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!database || !resolvedId || isSubmitting) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const data: any = Object.fromEntries(formData.entries())

    const photoFile = formData.get("photo") as File
    const photoName = photoFile?.name || editingItem?.photo || ""

    const dbPath = `Institutes/${resolvedId}/employees`

    try {
      const staffData = {
        ...data,
        photo: photoName,
        dateOfBirth: data.dateOfBirth,
        dateOfJoining: data.dateOfJoining,
        branchId: isBranch ? branchId : (editingItem?.branchId || null),
        createdBy: isStaff ? staffId : isBranch ? branchId : 'admin',
        updatedAt: Date.now()
      }

      if (editingItem?.id) {
        await update(ref(database, `${dbPath}/${editingItem.id}`), staffData)
        toast({ title: "Staff Updated Successfully" })
      } else {
        const initialPermissions: Record<string, boolean> = { dashboard: true }
        PERMISSION_GROUPS.forEach(g => {
          g.modules.forEach(m => {
            initialPermissions[m.id] = false
            if (m.submodules) m.submodules.forEach(sub => initialPermissions[sub.id] = false)
          })
        })
        const newRef = push(ref(database, dbPath))
        await set(newRef, {
          ...staffData,
          createdAt: Date.now(),
          loginStatus: true,
          role: 'Staff',
          moduleAccess: initialPermissions,
          id: newRef.key
        })
        toast({ title: "Staff Registered Successfully" })
      }

      setIsModalOpen(false)
      setEditingItem(null)
      setShowMoreDetails(false)
      setPhotoPreview(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePermission = async (moduleId: string, submoduleId?: string) => {
    if (!database || !resolvedId || !selectedStaffForPermissions) return
    const key = submoduleId || moduleId
    const currentVal = selectedStaffForPermissions.moduleAccess?.[key] ?? false
    const path = `Institutes/${resolvedId}/employees/${selectedStaffForPermissions.id}/moduleAccess/${key}`
    await set(ref(database, path), !currentVal)
    setSelectedStaffForPermissions((prev: any) => ({
      ...prev,
      moduleAccess: { ...prev.moduleAccess, [key]: !currentVal }
    }))
  }

  const handleBulkToggle = async (groupIdx: number, enable: boolean) => {
    if (!database || !resolvedId || !selectedStaffForPermissions) return
    const group = PERMISSION_GROUPS[groupIdx]
    const updates: any = {}
    group.modules.forEach(m => {
      updates[`moduleAccess/${m.id}`] = enable
      if (m.submodules) m.submodules.forEach(sub => updates[`moduleAccess/${sub.id}`] = enable)
    })
    await update(ref(database, `Institutes/${resolvedId}/employees/${selectedStaffForPermissions.id}`), updates)
    setSelectedStaffForPermissions((prev: any) => {
      const newAccess = { ...prev.moduleAccess }
      Object.keys(updates).forEach(k => newAccess[k.replace("moduleAccess/", "")] = enable)
      return { ...prev, moduleAccess: newAccess }
    })
    toast({ title: enable ? "Modules Enabled" : "Modules Restricted" })
  }

  // ─── Manage Department / Designation Functions ───
  const openManageDialog = (field: "department" | "designation") => {
    setManageField(field)
    setNewOption("")
    setEditingOptionId(null)
    setManageDialogOpen(true)
  }

  const saveOption = async () => {
    if (!database || !resolvedId || !manageField || !newOption.trim()) return
    const path = `Institutes/${resolvedId}/dropdowns/${manageField}`

    try {
      if (editingOptionId) {
        await set(ref(database, `${path}/${editingOptionId}`), { value: newOption.trim() })
        toast({ title: "Option updated" })
      } else {
        const newRef = push(ref(database, path))
        await set(newRef, { value: newOption.trim() })
        toast({ title: "Option added" })
      }
      setNewOption("")
      setEditingOptionId(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const deleteOption = async (id: string) => {
    if (!database || !resolvedId || !manageField || !confirm("Delete this option?")) return
    try {
      await remove(ref(database, `Institutes/${resolvedId}/dropdowns/${manageField}/${id}`))
      toast({ title: "Option deleted" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const startEditOption = (opt: { id: string; value: string }) => {
    setNewOption(opt.value)
    setEditingOptionId(opt.id)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      {!isPortal && <Sidebar />}
      <div className={cn("flex flex-col flex-1 min-w-0", !isPortal && "lg:pl-[300px]")}>
        <TopNav />
        <main className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-500 w-full overflow-x-hidden">

          {/* Header + Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl md:text-[26px] font-semibold text-zinc-800">Employee Directory</h2>
              <p className="text-sm text-zinc-500 mt-1">Manage staff records with full profile & access control</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="border-zinc-300 hover:bg-zinc-50 text-zinc-700 gap-2 h-10 px-4" onClick={downloadSampleCSV}>
                <FileText className="h-4 w-4" /> Sample CSV
              </Button>
              <label>
                <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5 text-primary gap-2 h-10 px-4 cursor-pointer" asChild>
                  <span><Upload className="h-4 w-4" /> Import CSV</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
              <Button variant="outline" size="sm" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 gap-2 h-10 px-4" onClick={exportToCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-50 text-amber-700 gap-2 h-10 px-4" onClick={() => window.print()}>
                <Download className="h-4 w-4" /> PDF Report
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2 h-10 px-5 shadow-sm" onClick={() => {
                setEditingItem(null)
                setIsModalOpen(true)
                setShowMoreDetails(false)
                setPhotoPreview(null)
              }}>
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-zinc-200 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-zinc-800">Filter Staff</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-rose-600 hover:text-rose-700">
                  <X className="h-4 w-4 mr-1" /> Reset
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-500">From Joining Date</Label>
                <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setCurrentPage(1) }} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-500">To Joining Date</Label>
                <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setCurrentPage(1) }} />
              </div>
              <div className="space-y-2 relative">
                <Label className="text-xs font-medium text-zinc-500">Department</Label>
                <div className="flex gap-2">
                  <Select value={filterDept} onValueChange={v => { setFilterDept(v); setCurrentPage(1) }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {(dropdownData.department || []).map(opt => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => openManageDialog("department")}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 relative">
                <Label className="text-xs font-medium text-zinc-500">Designation</Label>
                <div className="flex gap-2">
                  <Select value={filterDesignation} onValueChange={v => { setFilterDesignation(v); setCurrentPage(1) }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Designations</SelectItem>
                      {(dropdownData.designation || []).map(opt => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => openManageDialog("designation")}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-500">Search</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input placeholder="Name or ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }} className="pl-10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[2200px]">
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Joining</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Marital Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((row, idx) => (
                    <TableRow key={row.id} className="hover:bg-zinc-50/60">
                      <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedStaffForPermissions(row); setIsPermissionsOpen(true) }}>
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(row); setIsModalOpen(true); setShowMoreDetails(true) }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => confirm("Delete?") && remove(ref(database!, `Institutes/${resolvedId}/employees/${row.id}`))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback>{row.firstName?.[0]}{row.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{row.firstName} {row.lastName}</TableCell>
                      <TableCell className="font-mono">{row.employeeId}</TableCell>
                      <TableCell>{row.gender}</TableCell>
                      <TableCell>{row.dateOfBirth}</TableCell>
                      <TableCell>{row.dateOfJoining}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell className="text-zinc-600">{row.staffEmail}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>₹{Number(row.basicSalary || 0).toLocaleString()}</TableCell>
                      <TableCell>{row.maritalStatus}</TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow><TableCell colSpan={14} className="h-64 text-center text-zinc-400">No records found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>Prev</Button>
              {Array.from({length: totalPages}, (_, i) => (
                <Button key={i} variant={currentPage === i+1 ? "default" : "outline"} onClick={() => setCurrentPage(i+1)}>{i+1}</Button>
              ))}
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</Button>
            </div>
          )}

          {/* Add/Edit Employee Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-5xl p-0 rounded-3xl overflow-hidden">
              <div className="bg-[#1e3a8a] px-8 py-6 text-white flex items-center justify-between">
                <div>
                  <DialogTitle className="text-3xl font-bold">{editingItem ? "Update Employee" : "Add Employee"}</DialogTitle>
                  <p className="text-blue-200 text-sm">Complete Profile & Payroll Setup</p>
                </div>
                <DialogClose className="text-white hover:bg-white/10 p-2 rounded-full"><X className="h-6 w-6" /></DialogClose>
              </div>
              <ScrollArea className="max-h-[85vh]">
                <form onSubmit={handleSave} className="p-8 space-y-10">
                  {/* BASIC INFORMATION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">EMPLOYEE ID</Label>
                      <Input name="employeeId" defaultValue={editingItem?.employeeId} required className="mt-2" />
                    </div>
                    <div className="relative">
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">DEPARTMENT</Label>
                      <div className="flex gap-2 mt-2">
                        <Select name="department" defaultValue={editingItem?.department}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {(dropdownData.department || []).map(o => (
                              <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => openManageDialog("department")}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">DESIGNATION</Label>
                      <div className="flex gap-2 mt-2">
                        <Select name="designation" defaultValue={editingItem?.designation}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {(dropdownData.designation || []).map(o => (
                              <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => openManageDialog("designation")}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">FIRST NAME</Label><Input name="firstName" defaultValue={editingItem?.firstName} required className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">LAST NAME</Label><Input name="lastName" defaultValue={editingItem?.lastName} required className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">FATHER NAME</Label><Input name="fatherName" defaultValue={editingItem?.fatherName} className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">MOTHER NAME</Label><Input name="motherName" defaultValue={editingItem?.motherName} className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">EMAIL (LOGIN USERNAME)</Label><Input name="staffEmail" type="email" defaultValue={editingItem?.staffEmail} required className="mt-2" /></div>
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">GENDER</Label>
                      <Select name="gender" defaultValue={editingItem?.gender}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">DATE OF BIRTH</Label><Input name="dateOfBirth" type="date" defaultValue={editingItem?.dateOfBirth} className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">DATE OF JOINING</Label><Input name="dateOfJoining" type="date" defaultValue={editingItem?.dateOfJoining} className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">PHONE</Label><Input name="phone" defaultValue={editingItem?.phone} required className="mt-2" /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">EMERGENCY CONTACT</Label><Input name="emergencyContact" defaultValue={editingItem?.emergencyContact} className="mt-2" /></div>
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">MARITAL STATUS</Label>
                      <Select name="maritalStatus" defaultValue={editingItem?.maritalStatus}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">PHOTO</Label>
                      <Input type="file" name="photo" accept="image/*" className="mt-2" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setPhotoPreview(URL.createObjectURL(file))
                      }} />
                      {photoPreview && <img src={photoPreview} alt="preview" className="mt-3 w-24 h-24 object-cover rounded-xl border" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">ADDRESS</Label>
                      <Textarea name="address" defaultValue={editingItem?.address} className="mt-2 h-28" placeholder="Address..." />
                    </div>
                    <div>
                      <Label className="text-xs font-bold tracking-widest text-zinc-500">PERMANENT ADDRESS</Label>
                      <Textarea name="permanentAddress" defaultValue={editingItem?.permanentAddress} className="mt-2 h-28" placeholder="Permanent Address..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">QUALIFICATION</Label><Textarea name="qualification" defaultValue={editingItem?.qualification} className="mt-2" placeholder="Qualification..." /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">WORK EXPERIENCE</Label><Textarea name="workExperience" defaultValue={editingItem?.workExperience} className="mt-2" placeholder="Work Experience..." /></div>
                    <div><Label className="text-xs font-bold tracking-widest text-zinc-500">NOTES</Label><Textarea name="notes" defaultValue={editingItem?.notes} className="mt-2" placeholder="Notes..." /></div>
                  </div>

                  {!showMoreDetails && (
                    <Button type="button" onClick={() => setShowMoreDetails(true)} className="w-full h-14 text-lg font-medium border-2 border-dashed border-zinc-300 hover:border-primary flex items-center gap-3">
                      Add More Details <span className="text-2xl">+</span>
                    </Button>
                  )}

                  {showMoreDetails && (
                    <div className="border border-zinc-200 rounded-3xl p-8 space-y-12">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-semibold">More Details</h3>
                        <Button type="button" variant="ghost" onClick={() => setShowMoreDetails(false)}>Hide</Button>
                      </div>

                      {/* Payroll */}
                      <div>
                        <h4 className="text-lg font-semibold mb-6">Payroll</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div><Label>EPF NO.</Label><Input name="epfNo" defaultValue={editingItem?.epfNo} className="mt-2" /></div>
                          <div><Label>BASIC SALARY</Label><Input name="basicSalary" type="number" defaultValue={editingItem?.basicSalary} className="mt-2" /></div>
                          <div>
                            <Label>CONTRACT TYPE</Label>
                            <Select name="contractType" defaultValue={editingItem?.contractType}>
                              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>WORK SHIFT</Label><Input name="workShift" defaultValue={editingItem?.workShift} className="mt-2" /></div>
                          <div><Label>WORK LOCATION</Label><Input name="workLocation" defaultValue={editingItem?.workLocation} className="mt-2" /></div>
                        </div>
                      </div>

                      {/* Bank Account Details */}
                      <div>
                        <h4 className="text-lg font-semibold mb-6">Bank Account Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div><Label>ACCOUNT TITLE</Label><Input name="accountTitle" defaultValue={editingItem?.accountTitle} className="mt-2" /></div>
                          <div><Label>BANK ACCOUNT NUMBER</Label><Input name="bankAccountNumber" defaultValue={editingItem?.bankAccountNumber} className="mt-2" /></div>
                          <div><Label>BANK NAME</Label><Input name="bankName" defaultValue={editingItem?.bankName} className="mt-2" /></div>
                          <div><Label>IFSC CODE</Label><Input name="ifscCode" defaultValue={editingItem?.ifscCode} className="mt-2" /></div>
                          <div><Label>BRANCH NAME</Label><Input name="branchName" defaultValue={editingItem?.branchName} className="mt-2" /></div>
                        </div>
                      </div>

                      {/* Social Links */}
                      <div>
                        <h4 className="text-lg font-semibold mb-6">Social Links</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><Label>FACEBOOK URL</Label><Input name="facebookUrl" defaultValue={editingItem?.facebookUrl} className="mt-2" /></div>
                          <div><Label>TWITTER URL</Label><Input name="twitterUrl" defaultValue={editingItem?.twitterUrl} className="mt-2" /></div>
                          <div><Label>LINKEDIN URL</Label><Input name="linkedinUrl" defaultValue={editingItem?.linkedinUrl} className="mt-2" /></div>
                          <div><Label>INSTAGRAM URL</Label><Input name="instagramUrl" defaultValue={editingItem?.instagramUrl} className="mt-2" /></div>
                        </div>
                      </div>

                      {/* Upload Documents */}
                      <div>
                        <h4 className="text-lg font-semibold mb-6">Upload Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {[
                            { title: "Resume", name: "resume" },
                            { title: "Joining Letter", name: "joiningLetter" },
                            { title: "Resignation Letter", name: "resignationLetter" },
                            { title: "Other Document", name: "otherDocument" }
                          ].map((doc, i) => (
                            <div key={i} className="border rounded-2xl p-5">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-sm">#{i+1}</div>
                                <div className="font-medium">{doc.title}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex-1 cursor-pointer bg-white border border-zinc-200 rounded-xl px-5 py-3 text-sm flex items-center justify-between hover:bg-zinc-50">
                                  Choose file
                                  <Input type="file" name={doc.name} className="hidden" />
                                </label>
                                <div className="text-xs text-zinc-400">No file chosen</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-zinc-900 hover:bg-black text-white text-lg font-semibold rounded-2xl">
                    {isSubmitting ? <Loader2 className="animate-spin mr-3" /> : null}
                    {editingItem ? "Update Employee Profile" : "Submit & Register Employee"}
                  </Button>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Manage Department / Designation Dialog */}
          <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  Manage {manageField === "department" ? "Departments" : "Designations"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={`New ${manageField}`}
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                  />
                  <Button onClick={saveOption} disabled={!newOption.trim()}>
                    {editingOptionId ? "Update" : "Add"}
                  </Button>
                </div>

                <ScrollArea className="h-64 rounded border">
                  {(dropdownData[manageField || ""] || []).map(opt => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 border-b last:border-b-0"
                    >
                      <span>{opt.value}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditOption(opt)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => deleteOption(opt.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(dropdownData[manageField || ""] || []).length === 0 && (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      No {manageField}s added yet
                    </div>
                  )}
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Permissions Dialog */}
          <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
            <DialogContent className="max-w-lg">
              <DialogTitle>Access Control - {selectedStaffForPermissions?.firstName}</DialogTitle>
              <ScrollArea className="h-[70vh]">
                {PERMISSION_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="mb-8">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-semibold">{group.category}</h4>
                      <div className="flex gap-4 text-xs">
                        <button onClick={() => handleBulkToggle(gIdx, true)} className="text-emerald-600">Enable All</button>
                        <button onClick={() => handleBulkToggle(gIdx, false)} className="text-rose-600">Disable All</button>
                      </div>
                    </div>
                    {group.modules.map(m => (
                      <div key={m.id} className="mb-4 border rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{m.label}</span>
                          <Switch checked={selectedStaffForPermissions?.moduleAccess?.[m.id] ?? false} onCheckedChange={() => togglePermission(m.id)} />
                        </div>
                        {m.submodules && selectedStaffForPermissions?.moduleAccess?.[m.id] && (
                          <div className="pl-8 mt-4 space-y-3">
                            {m.submodules.map(s => (
                              <div key={s.id} className="flex justify-between text-sm">
                                <span>{s.label}</span>
                                <Switch checked={selectedStaffForPermissions?.moduleAccess?.[s.id] ?? false} onCheckedChange={() => togglePermission(m.id, s.id)} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </ScrollArea>
              <Button onClick={() => setIsPermissionsOpen(false)} className="w-full">Close</Button>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  )
}
