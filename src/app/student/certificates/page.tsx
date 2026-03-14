"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Award, 
  Download, 
  Eye, 
  Search, 
  History, 
  ShieldCheck, 
  Loader2, 
  X, 
  Maximize, 
  ZoomIn, 
  ZoomOut,
  Calendar,
  FileText
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { toPng } from 'html-to-image'
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Layer {
  id: string
  type: 'text' | 'box' | 'line' | 'image' | 'qr'
  label: string
  key?: string
  x: number 
  y: number 
  width?: number 
  height?: number 
  fontSize?: number 
  color?: string
  bgColor?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  content?: string
  opacity?: number
}

export default function StudentCertificatesPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const [student, setStudent] = useState<any>(null)
  const [awards, setAwards] = useState<any[]>([])
  const [templates, setTemplates] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  const [viewingAward, setViewingAward] = useState<any>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!database || !user) return
    
    const instRef = ref(database, `Institutes`)
    onValue(instRef, (snap) => {
      const institutes = snap.val() || {}
      let foundStudent = null
      let adminUid = null

      Object.keys(institutes).forEach(id => {
        const adms = institutes[id].admissions || {}
        Object.keys(adms).forEach(aid => {
          if (adms[aid].email?.toLowerCase() === user.email?.toLowerCase()) {
            foundStudent = { ...adms[aid], id: aid }
            adminUid = id
          }
        })
      })

      if (foundStudent && adminUid) {
        setStudent(foundStudent)
        const rootPath = `Institutes/${adminUid}`
        
        // Fetch Awards
        onValue(ref(database, `${rootPath}/awarded-certificates/${foundStudent.id}`), (s) => {
          const data = s.val() || {}
          setAwards(Object.values(data).reverse())
        })

        // Fetch Templates
        onValue(ref(database, `${rootPath}/certificate-templates`), (s) => {
          const data = s.val() || {}
          setTemplates(data)
        })
      }
      setIsLoading(false)
    })
  }, [database, user])

  const filteredAwards = useMemo(() => {
    if (!searchTerm) return awards
    const lower = searchTerm.toLowerCase()
    return awards.filter(a => a.name?.toLowerCase().includes(lower))
  }, [awards, searchTerm])

  const currentTemplate = useMemo(() => {
    if (!viewingAward) return null
    return templates[viewingAward.templateId]
  }, [viewingAward, templates])

  const handleDownload = async () => {
    if (!canvasRef.current || !viewingAward || !currentTemplate) return
    setIsDownloading(true)
    try {
      const originalZoom = zoomLevel
      setZoomLevel(1)
      await new Promise(r => setTimeout(r, 100))
      
      const dataUrl = await toPng(canvasRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, 
        width: currentTemplate?.frameSize?.width, 
        height: currentTemplate?.frameSize?.height 
      })
      const link = document.createElement('a')
      link.download = `Certificate_${viewingAward.name}_${student.studentName}.png`
      link.href = dataUrl
      link.click()
      setZoomLevel(originalZoom)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  const renderLayer = (l: Layer) => {
    let content = l.content || ""
    if (l.type === 'text' && l.key) {
      const issueDate = viewingAward?.issuedDate ? format(new Date(viewingAward.issuedDate), "do MMM, yyyy") : ""
      const data: any = { 
        studentName: student?.studentName, 
        course: student?.course, 
        admissionNo: student?.admissionNo,
        issueDate: issueDate
      }
      content = data[l.key] || l.content || ""
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${l.x}%`,
      top: `${l.y}%`,
      transform: 'translate(-50%, -50%)',
      opacity: (l.opacity || 100) / 100,
      fontSize: `${l.fontSize}px`,
      color: l.color,
      backgroundColor: l.bgColor,
      fontWeight: l.fontWeight as any,
      fontStyle: l.fontStyle,
      fontFamily: l.fontFamily,
      textAlign: l.textAlign as any,
      whiteSpace: 'nowrap',
      width: l.type !== 'text' ? `${l.width}px` : undefined,
      height: l.type !== 'text' ? `${l.height}px` : undefined,
      border: l.type === 'box' ? `1px solid ${l.color}` : undefined,
      zIndex: 10
    }

    if (l.type === 'image' || l.type === 'qr') {
      return (
        <div key={l.id} style={style}>
          {l.content ? <img src={l.content} alt={l.label} className="w-full h-full object-contain" /> : null}
        </div>
      )
    }

    if (l.type === 'line') {
      return <div key={l.id} style={{ ...style, height: '2px', backgroundColor: l.color }} />
    }

    return <div key={l.id} style={style}>{content}</div>
  }

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-[0.2em] animate-pulse">Establishing Academic Credentials...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32">
      
      {/* 🏅 HEADER */}
      <Card className="border-none shadow-xl rounded-[40px] bg-white overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[28px] bg-blue-50 flex items-center justify-center text-[#1e3a8a] shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight">Awards & Certificates</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Verified Institutional Credentials</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search awards..." 
              className="pl-12 h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 focus-visible:ring-primary shadow-inner text-sm font-bold" 
            />
          </div>
        </div>
      </Card>

      {/* 🏅 AWARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAwards.map((award) => (
          <Card key={award.templateId} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="h-48 bg-zinc-50 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
              <Award className="w-16 h-16 text-[#1e3a8a]/10 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-zinc-900/40 backdrop-blur-sm">
                <Button 
                  onClick={() => { setViewingAward(award); setIsViewerOpen(true); }}
                  className="bg-white text-zinc-900 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl border-none hover:bg-[#1e3a8a] hover:text-white transition-all"
                >
                  <Eye className="w-4 h-4 mr-2" /> View Certificate
                </Button>
              </div>
              <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-emerald-600 border-none text-[8px] font-black uppercase px-3 shadow-md">Verified</Badge>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight group-hover:text-primary transition-colors">{award.name}</h4>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> {student.studentName}
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Issued On</span>
                  <p className="text-xs font-bold text-zinc-500">{award.issuedDate ? format(new Date(award.issuedDate), "PPP") : "-"}</p>
                </div>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-zinc-50 text-zinc-400 hover:text-primary transition-all">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAwards.length === 0 && (
          <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
            <div className="w-20 h-20 bg-zinc-50 rounded-[28px] flex items-center justify-center mx-auto text-zinc-200">
              <History className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">No Awards Yet</h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto font-medium uppercase tracking-widest leading-relaxed">Institutional awards and certifications will appear here once issued by the faculty.</p>
            </div>
          </div>
        )}
      </div>

      {/* 📥 CERTIFICATE VIEWER MODAL */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 border-none rounded-[40px] overflow-hidden bg-zinc-900 shadow-2xl flex flex-col">
          <div className="h-20 bg-white/5 border-b border-white/5 px-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Award className="w-5 h-5" /></div>
              <div>
                <h3 className="text-white font-black uppercase tracking-tight leading-none text-sm">{viewingAward?.name}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Verified Credential</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/5 rounded-xl px-4 py-2 flex items-center gap-6 text-white/40">
                <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="hover:text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-[10px] font-black uppercase">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))} className="hover:text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
              </div>
              <Button onClick={handleDownload} disabled={isDownloading} className="bg-primary text-white h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-none shadow-xl">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Export PNG
              </Button>
              <DialogClose className="rounded-full w-10 h-10 p-0 text-white/40 hover:bg-white/10 hover:text-white transition-colors border-none outline-none"><X className="w-6 h-6" /></DialogClose>
            </div>
          </div>
          
          <div className="flex-1 bg-zinc-800 overflow-auto relative flex flex-col items-center p-20 scrollbar-none">
            {currentTemplate ? (
              <div 
                className="relative transition-all duration-300 origin-center"
                style={{ 
                  width: `${currentTemplate.frameSize.width}px`, 
                  height: `${currentTemplate.frameSize.height}px`,
                  transform: `scale(${zoomLevel})`
                }}
              >
                <div 
                  ref={canvasRef}
                  className="absolute inset-0 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                  style={{
                    backgroundImage: `url("${currentTemplate.backgroundUrl}")`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {currentTemplate.layers?.map((l: Layer) => renderLayer(l))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">Syncing HD Template...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </main>
  )
}

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white p-6 group hover:shadow-md transition-all">
      <div className="flex flex-col gap-4">
        <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center transition-colors group-hover:bg-white group-hover:shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{label}</p>
          <h4 className="text-xl font-black text-zinc-800 tracking-tight">{value}</h4>
        </div>
      </div>
    </Card>
  )
}
