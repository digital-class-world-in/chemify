
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Trash2, 
  Layers, 
  X, 
  Clock, 
  Calendar, 
  Edit2,
  Save,
  Loader2,
  MapPin,
  BookOpen,
  Settings2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, push, remove, off, update } from "firebase/database"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, isBefore, isAfter, parseISO } from "date-fns"
import { usePathname } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const INITIAL_TIMETABLE = DAYS.reduce((acc, day) => ({ 
  ...acc, 
  [day]: { enabled: false, start: "09:00", end: "11:00" } 
}), {})

export default function BatchManagementPage() {
  const pathname = usePathname()
  const isPortal = pathname?.startsWith('/staff') || pathname?.startsWith('/student') || (pathname?.startsWith('/branch') && !pathname?.startsWith('/branch-management'))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [batches, setBatches] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])
  const [timetable, setTimetable] = useState<Record<string, { enabled: boolean, start: string, end: string }>>(INITIAL_TIMETABLE)

  // Room Management State
  const [isManageRoomOpen, setIsManageRoomOpen] = useState(false)
  const [newRoomValue, setNewRoomValue] = useState("")

  const { database } = useFirebase()
  const { resolvedId, branchId, isBranch, isStaff, staffId } = useResolvedId()

  useEffect(() => {
    if (!database || !resolvedId) return
    
    const rootPath = `Institutes/${resolvedId}`
    const batchesRef = ref(database, `${rootPath}/batches`)
    const staffRef = ref(database, `${rootPath}/employees`)
    const dropdownsRef = ref(database, `${rootPath}/dropdowns`)
    
    setIsLoading(true)
    
    onValue(batchesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setBatches(Object.keys(data).map(key => ({ ...data[key], id: key })).reverse())
      else setBatches([])
      setIsLoading(false)
    })

    onValue(staffRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setStaffList(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setStaffList([])
    })

    onValue(dropdownsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const processed: Record<string, any[]> = {}
      Object.keys(data).forEach(key => { 
        processed[key] = Object.keys(data[key]).map(id => ({ id, value: data[key][id].value })) 
      })
      setDropdownData(processed)
    })

    return () => { off(batchesRef); off(staffRef); off(dropdownsRef); }
  }, [database, resolvedId])

  const calculateStatus = (batch: any) => {
    if (!batch.startDate || !batch.endDate) return "In Progress"
    
    try {
      const now = new Date()
      const startDate = parseISO(batch.startDate)
      const endDate = parseISO(batch.endDate)

      if (isBefore(now, startDate)) return "Not Started Yet"
      if (isAfter(now, endDate)) return "Completed"
      
      return "In Progress"
    } catch (e) {
      return "In Progress"
    }
  }

  const filteredBatches = useMemo(() => {
    let list = batches
    if (isBranch && branchId) list = list.filter(b => b.branchId === branchId)
    if (!searchTerm) return list
    const lowerSearch = searchTerm.toLowerCase()
    return list.filter(b => 
      b.batchName?.toLowerCase().includes(lowerSearch) ||
      b.courseName?.toLowerCase().includes(lowerSearch) ||
      b.batchTopic?.toLowerCase().includes(lowerSearch)
    )
  }, [batches, searchTerm, isBranch, branchId])

  const handleSaveBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolvedId || !database) return

    const formData = new FormData(e.currentTarget)
    const batchData: any = {
      batchName: formData.get("batchName"),
      batchTopic: formData.get("batchTopic"),
      roomNo: formData.get("roomNo"),
      className: formData.get("className"),
      courseName: formData.get("courseName"),
      faculty: formData.get("faculty"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      timetable: timetable,
      branchId: isBranch ? branchId : (selectedBatch?.branchId || null),
      createdBy: isStaff ? staffId : isBranch ? branchId : 'admin',
      updatedAt: Date.now()
    }

    if (selectedBatch?.id) {
      update(ref(database, `Institutes/${resolvedId}/batches/${selectedBatch.id}`), batchData)
        .then(() => { toast({ title: "Batch Updated" }); setIsModalOpen(false); setSelectedBatch(null); })
    } else {
      push(ref(database, `Institutes/${resolvedId}/batches`), { ...batchData, assignedStudents: {}, createdAt: Date.now() })
        .then(() => { toast({ title: "Batch Created" }); setIsModalOpen(false); })
    }
  }

  const handleUpdateDay = (day: string, field: 'enabled' | 'start' | 'end', value: any) => {
    setTimetable(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handleSaveRoom = () => {
    if (!newRoomValue.trim() || !resolvedId || !database) return
    const dbPath = `Institutes/${resolvedId}/dropdowns/roomNo`
    push(ref(database, dbPath), { value: newRoomValue.trim() }).then(() => {
      setNewRoomValue("")
      toast({ title: "Room Registered" })
    })
  }

  const mainContent = (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden font-public-sans text-black text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 font-headline tracking-tight leading-none uppercase">Batch Management ({filteredBatches.length})</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Schedule and monitor institutional academic nodes</p>
        </div>
        {!isPortal && (
          <Button onClick={() => { setSelectedBatch(null); setTimetable(INITIAL_TIMETABLE); setIsModalOpen(true); }} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-8 font-black text-xs uppercase tracking-widest border-none shadow-lg active:scale-95 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Add New Batch
          </Button>
        )}
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search Topic or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-11 bg-zinc-50 border-none rounded-xl text-sm font-bold shadow-inner transition-none focus-visible:ring-primary" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100">
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14 pl-10 w-20">#</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">BATCH IDENTITY</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">SCHEDULE & ROOM</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">FACULTY</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">STUDENTS</TableHead>
                <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">STATUS</TableHead>
                {!isPortal && <TableHead className="text-right pr-10 text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">ACTION</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7} className="p-10"><div className="h-12 w-full bg-zinc-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : filteredBatches.map((row, index) => {
                const status = calculateStatus(row)
                return (
                  <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-none group text-black font-public-sans">
                    <TableCell className="pl-10 text-[14px] font-bold text-zinc-300">{index + 1}</TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-primary shadow-inner"><Layers className="w-5 h-5" /></div>
                        <div>
                          <span className="text-sm font-black text-zinc-800 uppercase font-headline tracking-tight">{row.batchName}</span>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{row.batchTopic || 'No Topic Set'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-700 font-bold">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span className="text-sm uppercase">{row.roomNo || 'Open Space'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {row.startTime} - {row.endTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-zinc-500 uppercase">{row.faculty || '-'}</TableCell>
                    <TableCell className="text-center font-black text-zinc-800">{Object.keys(row.assignedStudents || {}).length}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none shadow-none transition-none",
                        status === 'In Progress' ? "bg-emerald-50 text-emerald-600" :
                        status === 'Completed' ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-400"
                      )}>{status}</Badge>
                    </TableCell>
                    {!isPortal && (
                      <TableCell className="text-right pr-10">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedBatch(row); setTimetable(row.timetable || INITIAL_TIMETABLE); setIsModalOpen(true); }} className="h-9 w-9 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm("Permanently remove batch node?")) remove(ref(database!, `Institutes/${resolvedId}/batches/${row.id}`)) }} className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ADD/EDIT BATCH MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
          <div className="bg-[#1e3a8a] px-10 py-8 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogTitle className="text-3xl font-black uppercase tracking-tight font-headline">{selectedBatch ? 'Update Configuration' : 'Initialize Batch'}</DialogTitle>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Institutional Node Provisioning</p>
            <DialogClose className="absolute right-8 top-8 p-2 hover:bg-white/10 rounded-full transition-all border-none outline-none"><X className="h-6 w-6" /></DialogClose>
          </div>
          <ScrollArea className="max-h-[85vh]">
            <form onSubmit={handleSaveBatch} className="p-10 space-y-12">
              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b pb-2">1. Identity & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-1.5"><Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Batch Identifier *</Label><Input name="batchName" defaultValue={selectedBatch?.batchName} required className="rounded-2xl border-zinc-100 bg-zinc-50/50 h-12 font-black text-zinc-800 text-base" /></div>
                  <div className="space-y-1.5"><Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Batch Topic</Label><Input name="batchTopic" defaultValue={selectedBatch?.batchTopic} placeholder="e.g. Advanced Calculus" className="rounded-2xl border-zinc-100 bg-zinc-50/50 h-12 font-bold" /></div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between px-1"><Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Academic Class</Label></div>
                    <Select name="className" defaultValue={selectedBatch?.className} required>
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-100 font-bold bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl">{(dropdownData['class'] || []).map(opt => <SelectItem key={opt.id} value={opt.value} className="font-bold text-[14px] uppercase">{opt.value}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Course Catalog</Label>
                    <Select name="courseName" defaultValue={selectedBatch?.courseName} required>
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-100 font-bold bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl">{(dropdownData['course'] || []).map(opt => <SelectItem key={opt.id} value={opt.value} className="font-bold text-[14px] uppercase">{opt.value}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between px-1">
                      <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Room No.</Label>
                      <button type="button" onClick={() => setIsManageRoomOpen(true)} className="text-[9px] font-black text-blue-600 hover:underline uppercase">Manage</button>
                    </div>
                    <Select name="roomNo" defaultValue={selectedBatch?.roomNo}>
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-100 font-bold bg-white"><SelectValue placeholder="Select Room" /></SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl">{(dropdownData['roomNo'] || []).map(opt => <SelectItem key={opt.id} value={opt.value} className="font-bold">{opt.value}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Assigned Faculty</Label>
                    <Select name="faculty" defaultValue={selectedBatch?.faculty} required>
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-100 font-bold bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl">{staffList.map(s => <SelectItem key={s.id} value={`${s.firstName} ${s.lastName}`} className="font-bold text-[14px] uppercase">{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] border-b pb-2">2. Timeline & Master Clock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-1.5"><Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Start Date</Label><Input name="startDate" type="date" defaultValue={selectedBatch?.startDate || today} required className="rounded-2xl h-12 border-zinc-100 font-bold" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">End Date</Label><Input name="endDate" type="date" defaultValue={selectedBatch?.endDate} required className="rounded-2xl h-12 border-zinc-100 font-bold" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Batch Start Time</Label><Input name="startTime" type="time" defaultValue={selectedBatch?.startTime || "09:00"} required className="rounded-2xl h-12 border-zinc-100 font-bold" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Batch End Time</Label><Input name="endTime" type="time" defaultValue={selectedBatch?.endTime || "11:00"} required className="rounded-2xl h-12 border-zinc-100 font-bold" /></div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] border-b pb-2">3. Weekly Day-Wise Protocol</h3>
                <div className="space-y-4">
                  {DAYS.map((day) => (
                    <div key={day} className={cn(
                      "flex items-center justify-between p-6 rounded-3xl border-2 transition-all",
                      timetable[day].enabled ? "bg-white border-primary/20 shadow-lg" : "bg-zinc-50 border-transparent opacity-60"
                    )}>
                      <div className="flex items-center gap-6">
                        <Switch checked={timetable[day].enabled} onCheckedChange={(v) => handleUpdateDay(day, 'enabled', v)} className="data-[state=checked]:bg-primary" />
                        <span className="text-sm font-black uppercase tracking-tight w-24">{day}</span>
                      </div>
                      
                      {timetable[day].enabled && (
                        <div className="flex items-center gap-4 animate-in slide-in-from-right-2 duration-300">
                          <div className="flex items-center gap-2">
                            <Label className="text-[9px] font-black text-zinc-400 uppercase">Start</Label>
                            <Input type="time" value={timetable[day].start} onChange={e => handleUpdateDay(day, 'start', e.target.value)} className="h-9 w-32 rounded-lg border-zinc-100 font-bold" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[9px] font-black text-zinc-400 uppercase">End</Label>
                            <Input type="time" value={timetable[day].end} onChange={e => handleUpdateDay(day, 'end', e.target.value)} className="h-9 w-32 rounded-lg border-zinc-100 font-bold" />
                          </div>
                        </div>
                      )}
                      
                      {!timetable[day].enabled && <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">Node Deactivated</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-zinc-100 pb-10">
                <Button type="submit" className="w-full h-16 bg-zinc-900 hover:bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Save className="w-5 h-5" /> {selectedBatch ? 'Synchronize All Updates' : 'Commit Batch Registry'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* MANAGE ROOMS MODAL */}
      <Dialog open={isManageRoomOpen} onOpenChange={setIsManageRoomOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-10 bg-white border-none shadow-2xl">
          <div className="flex items-center justify-between mb-8"><DialogTitle className="text-xl font-normal">Manage Classrooms</DialogTitle></div>
          <div className="flex gap-2 mb-8"><Input value={newRoomValue} onChange={(e) => setNewRoomValue(e.target.value)} placeholder="Enter room ID..." className="rounded-xl h-12" /><Button onClick={handleSaveRoom} className="bg-primary text-white rounded-xl px-8 h-12 border-none">Add</Button></div>
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-2">
              {(dropdownData['roomNo'] || []).map(opt => (
                <div key={opt.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-all group">
                  <span className="text-sm font-normal text-zinc-700">{opt.value}</span>
                  <button onClick={() => remove(ref(database!, `Institutes/${resolvedId}/dropdowns/roomNo/${opt.id}`))} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  )

  if (isPortal) return mainContent

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body overflow-x-hidden text-black">
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 min-w-0">
        <TopNav />
        {mainContent}
      </div>
    </div>
  )
}
  