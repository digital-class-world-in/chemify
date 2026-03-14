
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Video, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  X, 
  Loader2,
  Save
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, push, remove, off, update } from "firebase/database"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function LiveClassesPage() {
  const pathname = usePathname()
  const isPortal = pathname?.startsWith('/staff') || pathname?.startsWith('/student') || (pathname?.startsWith('/branch') && !pathname?.startsWith('/branch-management'))

  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [classes, setClasses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [editingClass, setEditingClass] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { database } = useFirebase()
  const { resolvedId, branchId, isBranch, isStaff, staffId } = useResolvedId()

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  useEffect(() => {
    if (!database || !resolvedId) return
    
    const rootPath = `Institutes/${resolvedId}`
    const classesRef = ref(database, `${rootPath}/live-classes`)
    
    setIsLoading(true)
    const unsubscribe = onValue(classesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }))
        setClasses(list.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()))
      } else {
        setClasses([])
      }
      setIsLoading(false)
    })

    onValue(ref(database, `${rootPath}/batches`), (snapshot) => {
      const data = snapshot.val() || {}
      setBatches(Object.keys(data).map(k => ({ ...data[k], id: k })))
    })
    
    return () => off(classesRef)
  }, [database, resolvedId])

  const filteredClasses = useMemo(() => {
    let list = classes
    if (isBranch && branchId) list = list.filter(c => c.branchId === branchId)
    if (isStaff && staffId) list = list.filter(c => c.createdBy === staffId)

    if (!searchTerm) return list
    const lowerSearch = searchTerm.toLowerCase()
    return list.filter(c => 
      c.topic?.toLowerCase().includes(lowerSearch) ||
      c.targetBatch?.toLowerCase().includes(lowerSearch)
    )
  }, [classes, searchTerm, isBranch, branchId, isStaff, staffId])

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!resolvedId || !database || isSubmitting) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const classData = {
      topic: formData.get("topic") as string,
      platform: formData.get("platform") as string,
      targetClass: formData.get("targetClass") as string,
      targetSection: formData.get("targetSection") as string,
      targetBatch: formData.get("targetBatch") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      duration: formData.get("duration") as string,
      meetingUrl: formData.get("meetingUrl") as string,
      meetingId: formData.get("meetingId") as string,
      password: formData.get("password") as string,
      status: "Scheduled",
      branchId: isBranch ? branchId : (editingClass?.branchId || null),
      createdBy: isStaff ? staffId : isBranch ? branchId : 'admin',
      updatedAt: Date.now()
    }

    try {
      const dbPath = `Institutes/${resolvedId}/live-classes`
      if (editingClass) {
        await update(ref(database, `${dbPath}/${editingClass.id}`), classData)
        toast({ title: "Session Updated" })
      } else {
        await push(ref(database, dbPath), { ...classData, createdAt: Date.now() })
        toast({ title: "Session Scheduled" })
      }
      setIsModalOpen(false)
      setEditingClass(null)
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const mainContent = (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden font-public-sans text-black text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-[26px] font-normal uppercase tracking-tight leading-none">Live Virtual Classes</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Schedule and stream academic content across batches</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(o) => { setIsModalOpen(o); if(!o) setEditingClass(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingClass(null)} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-10 font-bold text-sm gap-2 border-none shadow-lg active:scale-95 transition-all">
              <Plus className="h-4 w-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-0 border border-zinc-200 rounded-[32px] overflow-hidden bg-white shadow-2xl">
            <div className="bg-white px-10 py-6 border-b border-zinc-100 flex items-center justify-between">
              <DialogTitle className="text-xl font-normal text-zinc-800 uppercase tracking-tight">
                {editingClass ? 'Refine Session' : 'Initialize Live Stream'}
              </DialogTitle>
              <DialogClose className="p-2 hover:bg-zinc-100 rounded-full border-none outline-none"><X className="h-5 w-5 text-zinc-400" /></DialogClose>
            </div>
            
            <ScrollArea className="max-h-[80vh]">
              <form onSubmit={handleAddClass} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Session Topic *</Label>
                    <Input name="topic" defaultValue={editingClass?.topic} required className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Platform *</Label>
                    <Select name="platform" defaultValue={editingClass?.platform || "Zoom"}>
                      <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Zoom" className="text-[14px] font-bold">Zoom Meeting</SelectItem>
                        <SelectItem value="Google Meet" className="text-[14px] font-bold">Google Meet</SelectItem>
                        <SelectItem value="MS Teams" className="text-[14px] font-bold">Microsoft Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Target Batch *</Label>
                    <Select name="targetBatch" defaultValue={editingClass?.targetBatch} required>
                      <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                      <SelectContent>
                        {batches.map(b => <SelectItem key={b.id} value={b.batchName} className="text-[14px] font-bold">{b.batchName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Class *</Label>
                    <Input name="targetClass" defaultValue={editingClass?.targetClass} required placeholder="e.g. Class 10" className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Section</Label>
                    <Input name="targetSection" defaultValue={editingClass?.targetSection} placeholder="e.g. A" className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Date *</Label>
                    <Input name="date" type="date" defaultValue={editingClass?.date || todayStr} required className="rounded-xl h-12 border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Start Time *</Label>
                    <Input name="time" type="time" defaultValue={editingClass?.time} required className="rounded-xl h-12 border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Duration (Min)</Label>
                    <Input name="duration" type="number" defaultValue={editingClass?.duration || "40"} className="rounded-xl h-12 border-zinc-200 font-bold text-black text-[14px]" />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[14px] font-bold uppercase text-black tracking-widest ml-1">Meeting URL *</Label>
                    <Input name="meetingUrl" type="url" defaultValue={editingClass?.meetingUrl} required placeholder="Paste full link here" className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[14px]" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-fit h-14 px-12 bg-primary hover:opacity-90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl border-none active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Authorize Stream
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search Sessions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white border-zinc-200 rounded-full text-sm font-medium shadow-sm transition-none focus-visible:ring-primary"
          />
        </div>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[1400px]">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14 pl-10 w-20">SR NO</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">ACTION</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">TOPIC</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">BATCH / CLASS</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">SCHEDULE</TableHead>
                <TableHead className="text-[13px] font-bold text-zinc-400 uppercase h-14">PLATFORM</TableHead>
                <TableHead className="text-right pr-10 text-[13px] font-bold text-zinc-400 uppercase h-14">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7} className="p-10"><div className="h-12 w-full bg-zinc-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : filteredClasses.map((row, index) => (
                <TableRow key={row.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-none group text-black font-public-sans">
                  <TableCell className="text-base font-bold text-zinc-300 pl-10">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingClass(row); setIsModalOpen(true); }} className="h-9 w-9 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete session?")) remove(ref(database!, `Institutes/${resolvedId}/live-classes/${row.id}`)) }} className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(row.meetingUrl, '_blank')} className="h-9 w-9 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><ExternalLink className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-[15px] font-black text-black uppercase tracking-tight">{row.topic}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-primary uppercase">{row.targetBatch}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{row.targetClass} • Sec {row.targetSection || 'A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-700 font-mono tracking-tighter">{row.date}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{row.time}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="rounded-lg border-zinc-100 text-zinc-400 text-[10px] font-bold uppercase">{row.platform}</Badge></TableCell>
                  <TableCell className="text-right pr-10">
                    <Badge className={cn(
                      "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none shadow-none",
                      row.date === todayStr ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>{row.date === todayStr ? 'Today' : 'Upcoming'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
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
