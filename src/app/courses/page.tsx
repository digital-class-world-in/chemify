
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, Edit2, BookOpen, Clock, Wallet, X, GraduationCap } from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, set, remove, off, update } from "firebase/database"
import { toast } from "@/hooks/use-toast"

export default function CoursesManagementPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  
  const [courses, setCourses] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database || !user) return
    const dbRef = ref(database, `Institutes/${user.uid}/courses`)
    
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCourses(Object.keys(data).map(key => ({ ...data[key], id: key })).reverse())
      } else {
        setCourses([])
      }
      setIsLoading(false)
    })
    return () => off(dbRef)
  }, [database, user])

  const filtered = useMemo(() => {
    return courses.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [courses, searchTerm])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !database) return
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      duration: formData.get("duration") as string,
      fees: formData.get("fees") as string,
      description: formData.get("description") as string,
      updatedAt: Date.now()
    }

    const dbPath = `Institutes/${user.uid}/courses`
    if (editingItem) {
      update(ref(database, `${dbPath}/${editingItem.id}`), data)
    } else {
      push(ref(database, dbPath), { ...data, createdAt: Date.now() })
    }
    setIsModalOpen(false)
    setEditingItem(null)
    toast({ title: "Catalog Updated" })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-headline uppercase">Courses Catalog</h2>
              <p className="text-sm text-zinc-500 font-medium">Manage academic programs displayed on your public website</p>
            </div>
            <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-8 font-bold text-sm gap-2 border-none shadow-lg active:scale-95 transition-all">
              <Plus className="h-4 w-4" /> Add Program
            </Button>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-md p-0 border border-zinc-200 rounded-[32px] overflow-hidden bg-white shadow-2xl">
              <div className="bg-zinc-900 p-8 text-white flex justify-between items-center">
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">{editingItem ? 'Edit Program' : 'New Program'}</DialogTitle>
                <DialogClose className="p-2 hover:bg-white/10 rounded-full transition-colors border-none"><X className="h-5 w-5" /></DialogClose>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Program Name</Label><Input name="name" defaultValue={editingItem?.name} required className="rounded-xl h-12" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Duration</Label><Input name="duration" defaultValue={editingItem?.duration} placeholder="e.g. 6 Months" required className="rounded-xl h-12" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fees (₹)</Label><Input name="fees" type="number" defaultValue={editingItem?.fees} required className="rounded-xl h-12" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Description</Label><Textarea name="description" defaultValue={editingItem?.description} className="rounded-xl h-32" /></div>
                <Button type="submit" className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-900/20 active:scale-95 border-none">Save Program</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="relative group w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 h-11 bg-white border-zinc-200 rounded-full text-sm shadow-sm" />
          </div>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-zinc-100 hover:bg-transparent">
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14 pl-8">Program</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">Duration</TableHead>
                    <TableHead className="text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">Fees</TableHead>
                    <TableHead className="text-right pr-8 text-[11px] font-black text-zinc-400 uppercase tracking-widest h-14">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="border-zinc-50 hover:bg-zinc-50/20 transition-none group">
                      <TableCell className="pl-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-primary"><GraduationCap className="w-5 h-5" /></div>
                          <span className="text-sm font-bold text-zinc-800 uppercase font-headline">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-500">{item.duration}</TableCell>
                      <TableCell className="text-sm font-black text-zinc-700">₹{Number(item.fees).toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="h-9 w-9 text-blue-500 hover:bg-blue-50 rounded-xl transition-none"><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(ref(database!, `Institutes/${user?.uid}/courses/${item.id}`))} className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-none"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
