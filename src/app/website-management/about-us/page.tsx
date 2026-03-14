
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Save, 
  Loader2,
  X,
  FileText,
  Target,
  ShieldCheck,
  ImageIcon,
  CheckCircle2,
  Info,
  Award
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, set, update } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AboutUsManagementPage() {
  const { database, storage } = useFirebase()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newMissionPoint, setNewMissionValue] = useState("")
  
  const [about, setAbout] = useState<any>({
    badge: "Institutional Overview",
    title: "Pioneering Academic Excellence",
    description1: "",
    description2: "",
    mission: [],
    rankingTitle: "Global Ranking",
    rankingSubtitle: "Top 10 Technical Institute",
    imageUrl: "https://images.unsplash.com/photo-1523050853064-8521a3930ff4?q=80&w=2070&auto=format&fit=crop"
  })

  useEffect(() => {
    if (!database || !user) return
    const rootPath = `Institutes/${user.uid}/website_settings/about`
    
    onValue(ref(database, rootPath), (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setAbout((prev: any) => ({ ...prev, ...data }))
      }
      setIsLoading(false)
    })
  }, [database, user])

  const handleUpdate = (field: string, value: any) => {
    setAbout((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleAddMission = () => {
    if (!newMissionPoint.trim()) return
    const updatedMission = [...(about.mission || []), newMissionPoint.trim()]
    handleUpdate('mission', updatedMission)
    setNewMissionValue("")
  }

  const handleRemoveMission = (idx: number) => {
    const updatedMission = [...(about.mission || [])]
    updatedMission.splice(idx, 1)
    handleUpdate('mission', updatedMission)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storage || !user) return
    
    setIsSaving(true)
    try {
      const fileName = `about-visual-${Date.now()}_${file.name}`
      const fileRef = storageRef(storage, `website/${user.uid}/${fileName}`)
      const uploadResult = await uploadBytes(fileRef, file)
      const url = await getDownloadURL(uploadResult.ref)
      handleUpdate('imageUrl', url)
      toast({ title: "Asset uploaded" })
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!database || !user) return
    setIsSaving(true)
    try {
      await update(ref(database, `Institutes/${user.uid}/website_settings/about`), about)
      toast({ title: "About us synchronized", description: "Public portal updated successfully." })
    } catch (e) {
      toast({ variant: "destructive", title: "Sync failed" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Establishing node connection...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-32 font-public-sans text-[15px] font-bold text-black">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
              <h2 className="text-[26px] font-normal text-black font-public-sans tracking-tight leading-none">About us page setup</h2>
              <p className="text-sm text-zinc-400 font-medium mt-1">Configure institutional mission, vision, and core narrative</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-10 font-bold text-sm gap-2 border-none shadow-lg active:scale-95">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />} {isSaving ? "Publishing..." : "Publish content"}
            </Button>
          </div>

          <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden p-10 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="space-y-6">
                  <h4 className="text-lg font-normal text-black font-public-sans flex items-center gap-2 border-b border-zinc-50 pb-2">
                    <FileText className="w-5 h-5 text-primary" /> Core narrative
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Section badge</Label>
                      <Input value={about.badge} onChange={(e) => handleUpdate('badge', e.target.value)} className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[15px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Main heading</Label>
                      <Input value={about.title} onChange={(e) => handleUpdate('title', e.target.value)} className="h-12 rounded-xl border-zinc-200 font-bold text-black text-[15px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Paragraph 1 (Primary)</Label>
                      <Textarea value={about.description1} onChange={(e) => handleUpdate('description1', e.target.value)} className="rounded-xl border-zinc-200 min-h-[100px] text-black font-bold text-[15px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Paragraph 2 (Secondary)</Label>
                      <Textarea value={about.description2} onChange={(e) => handleUpdate('description2', e.target.value)} className="rounded-xl border-zinc-200 min-h-[100px] text-black font-bold text-[15px]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-normal text-black font-public-sans flex items-center gap-2 border-b border-zinc-50 pb-2">
                    <Target className="w-5 h-5 text-primary" /> Mission registry
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        value={newMissionPoint} 
                        onChange={(e) => setNewMissionValue(e.target.value)}
                        placeholder="Add mission point..." 
                        className="h-11 rounded-xl font-bold text-black text-[15px]"
                      />
                      <Button onClick={handleAddMission} className="bg-primary text-white rounded-xl h-11 px-6"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(about.mission || []).map((point: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group">
                          <span className="text-[15px] font-bold text-zinc-700 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {point}
                          </span>
                          <button onClick={() => handleRemoveMission(i)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <h4 className="text-lg font-normal text-black font-public-sans flex items-center gap-2 border-b border-zinc-50 pb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Global ranking card
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Card title</Label>
                      <Input value={about.rankingTitle} onChange={(e) => handleUpdate('rankingTitle', e.target.value)} className="h-11 rounded-xl font-bold text-black text-[15px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Card subtitle</Label>
                      <Input value={about.rankingSubtitle} onChange={(e) => handleUpdate('rankingSubtitle', e.target.value)} className="h-11 rounded-xl font-bold text-black text-[15px]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-normal text-black font-public-sans flex items-center gap-2 border-b border-zinc-50 pb-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Visual asset
                  </h4>
                  <div className="space-y-4">
                    <div className="aspect-[4/3] rounded-[32px] overflow-hidden bg-zinc-50 border border-zinc-100 relative group">
                      <img src={about.imageUrl} className="w-full h-full object-cover" alt="Visual" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Label className="cursor-pointer bg-white text-black px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-xl text-[15px]">
                          Replace asset
                          <input type="file" className="hidden" onChange={handleImageUpload} />
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[15px] font-bold uppercase text-black tracking-widest ml-1">Asset URL</Label>
                      <Input 
                        value={about.imageUrl} 
                        onChange={(e) => handleUpdate('imageUrl', e.target.value)} 
                        className="h-11 rounded-xl text-black font-bold text-[15px]" 
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
