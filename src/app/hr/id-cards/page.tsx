"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Download, 
  ExternalLink,
  Plus,
  X,
  Upload,
  User,
  ShieldCheck,
  CreditCard,
  Loader2
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toPng } from 'html-to-image'

export default function EmployeeIdCardsPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [instituteName, setInstituteName] = useState("Your Institute")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!database || !user) return
    const rootPath = `Institutes/${user.uid}`
    
    setIsLoading(true)
    
    const employeesRef = ref(database, `${rootPath}/employees`)
    const unsubscribeEmployees = onValue(employeesRef, (s) => {
      const data = s.val()
      if (data) {
        const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
        setEmployees(list)
        const depts = Array.from(new Set(list.map(e => e.department).filter(Boolean))) as string[]
        setDepartments(depts)
      } else {
        setEmployees([])
      }
      setIsLoading(false)
    })

    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubscribeProfile = onValue(profileRef, (s) => {
      if (s.val()?.instituteName) setInstituteName(s.val().instituteName)
    })

    return () => {
      off(employeesRef)
      off(profileRef)
    }
  }, [database, user])

  const filtered = employees.filter(e => {
    const nameMatch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    const idMatch = e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    const deptMatch = selectedDept === 'all' || e.department === selectedDept
    return (nameMatch || idMatch) && deptMatch
  })

  const handleDownloadPng = async (emp: any) => {
    setIsDownloading(emp.id)
    // Wait for DOM to ensure the hidden card is ready if needed, 
    // but here we target the hidden rendered element
    const node = document.getElementById(`id-card-capture-${emp.id}`)
    if (node) {
      try {
        const dataUrl = await toPng(node, { quality: 1.0, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `ID_CARD_${emp.firstName}_${emp.employeeId}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error("Download failed:", error);
      }
    }
    setIsDownloading(null)
  }

  const handleWhatsApp = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.lastName}`
    const phone = emp.phone?.replace(/\D/g, '') || ""
    const message = `Hello *${emp.firstName}*,\n\nYour Staff Identity details for *${instituteName}* are as follows:\n\n*Name:* ${fullName}\n*ID:* ${emp.employeeId}\n*Role:* ${emp.designation}\n*Dept:* ${emp.department}\n\nTeam\n*${instituteName}*`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#a0a0a00d] flex font-body">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 font-headline uppercase tracking-tight">Employee ID Cards</h2>
              <p className="text-sm text-zinc-500 font-medium">Process and design staff identity credentials</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-8 font-bold text-sm flex items-center gap-2 shadow-lg border-none transition-all active:scale-95">
                    <Plus className="h-4 w-4" /> Generate ID Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 border border-zinc-200 rounded-2xl overflow-hidden bg-white sm:max-w-[95vw]">
                  <div className="bg-white px-8 py-5 border-b border-zinc-100 flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-zinc-800">New ID Card Design</DialogTitle>
                    <DialogClose className="p-2 hover:bg-zinc-50 rounded-full transition-none border-none outline-none">
                      <X className="h-5 w-5 text-zinc-400" />
                    </DialogClose>
                  </div>
                  <DialogDescription className="sr-only">Fill the details below to generate a custom ID card design.</DialogDescription>
                  <ScrollArea className="max-h-[85vh]">
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Background Image</Label>
                          <Select defaultValue="frame1">
                            <SelectTrigger className="h-11 rounded-lg border-zinc-200"><SelectValue placeholder="Select Frame" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="frame1">Frame 1</SelectItem>
                              <SelectItem value="frame2">Frame 2</SelectItem>
                              <SelectItem value="frame3">Frame 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Institute Logo</Label>
                          <div className="relative group">
                            <Input type="file" className="h-11 rounded-lg border-zinc-200 file:hidden pr-10 cursor-pointer bg-zinc-50/50" />
                            <Upload className="absolute right-3 top-3 h-4 w-4 text-zinc-300 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Institute Name</Label>
                          <Input defaultValue={instituteName} className="h-11 rounded-lg border-zinc-200" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID Card Title</Label>
                          <Input placeholder="Staff Identity Card" className="h-11 rounded-lg border-zinc-200" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Header Color</Label>
                          <div className="flex items-center gap-3">
                            <Input type="color" defaultValue="#0D9488" className="w-12 h-11 p-1 rounded-lg border-zinc-200 cursor-pointer" />
                            <div className="h-1 w-full bg-primary rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Institute Contact Info</Label>
                        <Input placeholder="Address, Phone, Email for footer..." className="h-11 rounded-lg border-zinc-200" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Staff Name</Label>
                          <Input className="h-11 rounded-lg border-zinc-200" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Staff ID</Label>
                          <Input className="h-11 rounded-lg border-zinc-200" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Designation</Label>
                          <Input className="h-11 rounded-lg border-zinc-200" />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button type="button" className="bg-primary hover:opacity-90 text-white rounded-xl h-12 px-12 font-bold shadow-lg border-none transition-all active:scale-95">
                          Generate & Save Design
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-2xl bg-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Filter by Department</span>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="rounded-xl h-11 bg-zinc-50 border-none font-bold text-zinc-600 transition-none">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Search Staff Records</span>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <Input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search by Name or Employee ID..." 
                    className="pl-11 h-11 rounded-xl bg-zinc-50 border-none font-bold text-zinc-700 transition-none focus-visible:ring-primary" 
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-zinc-100 hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14 pl-8">SR NO.</TableHead>
                    <TableHead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14">Employee Name</TableHead>
                    <TableHead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14">Employee ID</TableHead>
                    <TableHead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14">Designation</TableHead>
                    <TableHead className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14">Department</TableHead>
                    <TableHead className="text-right pr-8 text-[11px] font-bold text-zinc-400 uppercase tracking-widest h-14">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell colSpan={6} className="p-4">
                          <div className="h-12 w-full bg-zinc-50 animate-pulse rounded-xl" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length > 0 ? (
                    filtered.map((emp, index) => (
                      <TableRow key={emp.id} className="border-zinc-50 hover:bg-zinc-50/20 transition-none group">
                        <TableCell className="text-sm font-medium text-zinc-500 pl-8">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-zinc-100">
                              <AvatarImage src={`https://picsum.photos/seed/${emp.id}/32/32`} />
                              <AvatarFallback className="text-[10px] font-bold bg-zinc-100 text-zinc-400">{emp.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-zinc-800 uppercase font-headline">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-primary font-mono">{emp.employeeId || '-'}</TableCell>
                        <TableCell className="text-sm text-zinc-500 font-bold uppercase">{emp.designation}</TableCell>
                        <TableCell className="text-sm text-zinc-500 font-medium">{emp.department}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={isDownloading === emp.id}
                              onClick={() => handleDownloadPng(emp)}
                              className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 transition-none"
                              title="Download PNG"
                            >
                              {isDownloading === emp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleWhatsApp(emp)}
                              className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 transition-none"
                              title="Share on WhatsApp"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-6 rounded-3xl bg-zinc-50">
                            <CreditCard className="h-10 w-10 text-zinc-300" />
                          </div>
                          <p className="text-sm font-medium text-zinc-400">No staff members found for identity processing.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Hidden containers for PNG capture */}
          <div className="fixed top-0 left-0 pointer-events-none opacity-0 -z-50 overflow-hidden h-0 w-0">
            {filtered.map(emp => (
              <div key={emp.id} id={`id-card-capture-${emp.id}`} className="w-[400px] bg-white rounded-3xl border border-zinc-100 shadow-2xl flex flex-col overflow-hidden">
                <div className="bg-primary p-8 text-center space-y-1 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <h3 className="text-white font-black uppercase text-sm tracking-[0.2em]">{instituteName}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Staff Identity</p>
                </div>
                <div className="p-10 flex flex-col items-center gap-8">
                  <div className="relative">
                    <Avatar className="h-32 w-32 rounded-3xl border-4 border-zinc-50 shadow-lg">
                      <AvatarImage src={`https://picsum.photos/seed/${emp.id}/128/128`} />
                      <AvatarFallback className="text-4xl font-black bg-zinc-100 text-zinc-300">{emp.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-md">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">{emp.firstName} {emp.lastName}</h4>
                    <p className="text-primary font-black text-sm uppercase tracking-widest">{emp.designation}</p>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-y-6 pt-8 border-t border-zinc-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Staff ID</p>
                      <p className="text-sm font-black text-zinc-700">{emp.employeeId || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-black text-zinc-700">{emp.department || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contact</p>
                      <p className="text-sm font-black text-zinc-700">{emp.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Joined On</p>
                      <p className="text-sm font-black text-zinc-700">{emp.joiningDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 p-6 border-t border-zinc-100 text-center">
                  <div className="h-10 w-full bg-zinc-200/50 rounded-xl flex items-center justify-center font-mono text-[10px] text-zinc-400 tracking-[0.5em]">
                    * * * * * STAFF SECURE * * * * *
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
