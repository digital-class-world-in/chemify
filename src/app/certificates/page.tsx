
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Award, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  X, 
  Square, 
  Minus, 
  QrCode, 
  ImageIcon,
  Loader2,
  Trash2,
  Save,
  Edit2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Info,
  ZoomIn,
  ZoomOut,
  Settings2,
  ArrowLeft,
  Layers,
  CloudUpload,
  MousePointer2,
  Move,
  Maximize2,
  Link as LinkIcon
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off, push, set, update, remove } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { usePathname } from "next/navigation"

interface Layer {
  id: string
  type: 'text' | 'box' | 'line' | 'image' | 'qr'
  label: string
  key?: string
  x: number 
  y: number 
  width: number 
  height: number 
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

const DYNAMIC_KEYS = [
  { id: 'studentName', label: 'Student Name' },
  { id: 'course', label: 'Course Name' },
  { id: 'admissionNo', label: 'Admission No' },
  { id: 'issueDate', label: 'Date of Issue' },
  { id: 'instituteName', label: 'Institute Name' },
]

const DEFAULT_FRAMES = [
  { id: 'blank', label: 'Blank White', url: '' },
  { id: 'classic', label: 'Classic Border', url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=2070&auto=format&fit=crop' },
  { id: 'modern', label: 'Modern Geometric', url: 'https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?q=80&w=2070&auto=format&fit=crop' },
  { id: 'elegant', label: 'Elegant Gold', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=2070&auto=format&fit=crop' },
]

export default function CertificatesPage() {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/staff') || pathname.startsWith('/student') || pathname.startsWith('/branch')

  const { database, storage } = useFirebase()
  const { user } = useUser()
  const { resolvedId } = useResolvedId()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [view, setView] = useState<'list' | 'design'>('list')
  const [templates, setTemplates] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  
  // Designer State
  const [projectName, setProjectName] = useState("New Certificate")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0.6)
  const [backgroundUrl, setBackgroundUrl] = useState("")
  const [frameSize, setFrameSize] = useState({ width: 1123, height: 794 }) 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Interaction State
  const [interactionMode, setInteractionMode] = useState<'none' | 'dragging' | 'resizing'>('none')
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })

  useEffect(() => {
    if (!database || !resolvedId) return
    const rootPath = `Institutes/${resolvedId}`
    
    const unsubTemplates = onValue(ref(database, `${rootPath}/certificate-templates`), (snapshot) => {
      const data = snapshot.val()
      if (data) setTemplates(Object.keys(data).map(key => ({ ...data[key], id: key })).reverse())
      else setTemplates([])
      setIsLoading(false)
    })

    const unsubStudents = onValue(ref(database, `Institutes/${resolvedId}/admissions`), (snapshot) => {
      const data = snapshot.val()
      if (data) setStudents(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setStudents([])
    })

    return () => {
      off(ref(database, `${rootPath}/certificate-templates`))
      off(ref(database, `Institutes/${resolvedId}/admissions`))
    }
  }, [database, resolvedId])

  useEffect(() => {
    if (selectedLayerId) {
      setIsSidebarOpen(true)
    }
  }, [selectedLayerId])

  const addLayer = (type: Layer['type']) => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type,
      label: `New ${type}`,
      x: 50,
      y: 50,
      width: type === 'image' ? 200 : type === 'line' ? 400 : 250,
      height: type === 'image' ? 200 : type === 'line' ? 4 : 50,
      fontSize: 24,
      color: "#000000",
      content: type === 'text' ? "Institutional Text" : "",
      textAlign: 'center',
      fontWeight: 'normal',
      opacity: 100
    }
    setLayers([...layers, newLayer])
    setSelectedLayerId(newLayer.id)
    setIsSidebarOpen(true)
  }

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id))
    setSelectedLayerId(null)
  }

  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation()
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    setSelectedLayerId(layerId)
    setIsSidebarOpen(true)
    setInteractionMode('dragging')
    setStartPos({ x: e.clientX, y: e.clientY, width: layer.width, height: layer.height, left: layer.x, top: layer.y })
  }

  const handleHandleMouseDown = (e: React.MouseEvent, layerId: string, handle: string) => {
    e.stopPropagation()
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    setSelectedLayerId(layerId)
    setIsSidebarOpen(true)
    setInteractionMode('resizing')
    setResizeHandle(handle)
    setStartPos({ x: e.clientX, y: e.clientY, width: layer.width, height: layer.height, left: layer.x, top: layer.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionMode === 'none' || !selectedLayerId || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const deltaX = (e.clientX - startPos.x) / zoomLevel
    const deltaY = (e.clientY - startPos.y) / zoomLevel

    if (interactionMode === 'dragging') {
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100
      updateLayer(selectedLayerId, {
        x: Math.min(100, Math.max(0, xPercent)),
        y: Math.min(100, Math.max(0, yPercent))
      })
    } else if (interactionMode === 'resizing') {
      const layer = layers.find(l => l.id === selectedLayerId)
      if (!layer) return

      let newWidth = startPos.width
      let newHeight = startPos.height
      let newX = startPos.left
      let newY = startPos.top

      if (resizeHandle?.includes('right')) {
        newWidth = Math.max(10, startPos.width + deltaX)
        newX = startPos.left + (deltaX / 2 / frameSize.width * 100)
      } else if (resizeHandle?.includes('left')) {
        newWidth = Math.max(10, startPos.width - deltaX)
        newX = startPos.left + (deltaX / 2 / frameSize.width * 100)
      }

      if (resizeHandle?.includes('bottom')) {
        newHeight = Math.max(10, startPos.height + deltaY)
        newY = startPos.top + (deltaY / 2 / frameSize.height * 100)
      } else if (resizeHandle?.includes('top')) {
        newHeight = Math.max(10, startPos.height - deltaY)
        newY = startPos.top + (deltaY / 2 / frameSize.height * 100)
      }

      updateLayer(selectedLayerId, { 
        width: newWidth, 
        height: newHeight,
        x: Math.min(100, Math.max(0, newX)),
        y: Math.min(100, Math.max(0, newY))
      })
    }
  }

  const handleMouseUp = () => {
    setInteractionMode('none')
    setResizeHandle(null)
  }

  const sanitizeForFirebase = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      value === undefined ? null : value
    ));
  };

  const handleSaveProject = async () => {
    if (!database || !resolvedId) return
    setIsSaving(true)
    const rootPath = `Institutes/${resolvedId}/certificate-templates`
    const projectData = sanitizeForFirebase({
      name: projectName,
      layers,
      backgroundUrl,
      frameSize,
      updatedAt: Date.now()
    })

    try {
      if (editingId) {
        await update(ref(database, `${rootPath}/${editingId}`), projectData)
      } else {
        const newRef = push(ref(database, rootPath))
        await set(newRef, { ...projectData, createdAt: Date.now() })
      }
      toast({ title: "Design Saved", description: "Template updated in your registry." })
      setView('list')
    } catch (e) {
      console.error("Save Error:", e)
      toast({ variant: "destructive", title: "Save Failed", description: "Could not sync design node." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'background' | 'layer') => {
    const file = e.target.files?.[0]
    if (!file || !storage || !resolvedId) return
    
    if (target === 'background') {
      setIsUploadingBackground(true)
      toast({ title: "Uploading Frame...", description: "Processing high-resolution institutional asset." })
    }

    try {
      const fileName = `cert-${target}-${Date.now()}_${file.name.replace(/[^a-z0-9.-]/gi, '_')}`
      const fileRef = storageRef(storage, `certificate-templates/${resolvedId}/${fileName}`)
      const uploadResult = await uploadBytes(fileRef, file)
      const url = await getDownloadURL(uploadResult.ref)
      
      if (target === 'background') {
        setBackgroundUrl(url)
        toast({ title: "Frame Applied", description: "Custom background skin is now active." })
      } else if (selectedLayerId) {
        updateLayer(selectedLayerId, { content: url })
        toast({ title: "Image Layer Updated" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Check your internet connection or file format." })
    } finally {
      setIsUploadingBackground(false)
    }
  }

  const openEditor = (project: any = null) => {
    if (project) {
      setEditingId(project.id)
      setProjectName(project.name)
      setLayers(project.layers || [])
      setBackgroundUrl(project.backgroundUrl || "")
      setFrameSize(project.frameSize || { width: 1123, height: 794 })
    } else {
      setEditingId(null)
      setProjectName("New Design")
      setLayers([])
      setBackgroundUrl("")
      setFrameSize({ width: 1123, height: 794 })
    }
    setView('design')
  }

  const selectedLayer = useMemo(() => 
    layers.find(l => l.id === selectedLayerId), 
  [layers, selectedLayerId])

  const renderLayer = (l: Layer) => {
    let content = l.content || ""
    if (l.type === 'text' && l.key && selectedPreviewStudent) {
      const data: any = { 
        studentName: selectedPreviewStudent.studentName, 
        course: selectedPreviewStudent.course, 
        admissionNo: selectedPreviewStudent.admissionNo,
        issueDate: format(new Date(), "do MMM, yyyy"),
        instituteName: "Global Academic Center"
      }
      content = data[l.key] || l.content || ""
    } else if (l.type === 'text' && l.key) {
      content = `{${DYNAMIC_KEYS.find(k => k.id === l.key)?.label}}`
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${l.x}%`,
      top: `${l.y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: selectedLayerId === l.id ? 50 : 10,
      opacity: (l.opacity || 100) / 100,
      width: `${l.width}px`,
      height: `${l.height}px`,
    }

    const isSelected = selectedLayerId === l.id

    return (
      <div
        key={l.id}
        onMouseDown={(e) => handleMouseDown(e, l.id)}
        onClick={(e) => {
          e.stopPropagation(); 
          setSelectedLayerId(l.id);
        }}
        className={cn(
          "absolute cursor-move transition-shadow",
          isSelected && "ring-2 ring-primary ring-offset-2 z-50 shadow-2xl"
        )}
        style={style}
      >
        {l.type === 'text' && (
          <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none text-black">
            <p className="whitespace-nowrap" style={{
              fontSize: `${l.fontSize}px`,
              color: l.color,
              textAlign: l.textAlign,
              fontWeight: l.fontWeight as any,
              fontStyle: l.fontStyle,
              fontFamily: l.fontFamily || 'serif'
            }}>
              {content}
            </p>
          </div>
        )}
        {l.type === 'image' && (
          <div className="w-full h-full bg-zinc-50 flex items-center justify-center rounded-sm overflow-hidden border border-zinc-100 pointer-events-none">
            {l.content ? <img src={l.content} alt="Asset" className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-zinc-200" />}
          </div>
        )}
        {l.type === 'box' && <div className="w-full h-full border-2 pointer-events-none" style={{ borderColor: l.color, backgroundColor: l.bgColor }} />}
        {l.type === 'line' && <div className="w-full h-full pointer-events-none" style={{ backgroundColor: l.color }} />}
        {l.type === 'qr' && <div className="w-full h-full bg-white p-2 border border-zinc-100 flex items-center justify-center pointer-events-none"><QrCode className="w-full h-full text-zinc-800 opacity-20" /></div>}

        {isSelected && (
          <>
            <ResizeHandle position="top-left" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'top-left')} />
            <ResizeHandle position="top-right" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'top-right')} />
            <ResizeHandle position="bottom-left" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'bottom-left')} />
            <ResizeHandle position="bottom-right" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'bottom-right')} />
            <ResizeHandle position="top" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'top')} />
            <ResizeHandle position="bottom" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'bottom')} />
            <ResizeHandle position="left" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'left')} />
            <ResizeHandle position="right" onMouseDown={(e) => handleHandleMouseDown(e, l.id, 'right')} />
          </>
        )}
      </div>
    )
  }

  if (view === 'design') {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col font-body overflow-hidden select-none">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => setView('list')} className="text-zinc-400 hover:text-zinc-900 p-0 h-8 w-8 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Input 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                className="bg-transparent border-none text-zinc-900 font-bold h-8 w-64 focus-visible:ring-0 px-0 text-lg uppercase tracking-tight" 
              />
              <Badge className="bg-zinc-50 text-zinc-400 border-none text-[8px] font-black uppercase tracking-widest px-2">Design Workspace</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-3 py-1.5 mr-4 text-zinc-400 border border-zinc-100">
              <button onClick={() => setZoomLevel(prev => Math.max(0.1, prev - 0.1))} className="hover:text-zinc-900 transition-colors border-none bg-transparent cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[10px] font-black w-10 text-center text-zinc-600">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))} className="hover:text-zinc-900 transition-colors border-none bg-transparent cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={cn("h-10 w-10 p-0 rounded-xl transition-all", isSidebarOpen ? "bg-primary text-white" : "bg-zinc-50 text-zinc-400")}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
            <Button onClick={handleSaveProject} disabled={isSaving} className="bg-primary hover:opacity-90 text-white rounded-xl h-10 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg border-none">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Sync Design
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <aside className="w-20 bg-white border-r border-zinc-200 flex flex-col items-center py-8 gap-8 shrink-0 z-40">
            <ToolButton icon={<Plus className="w-5 h-5" />} label="Text" onClick={() => addLayer('text')} />
            <ToolButton icon={<ImageIcon />} label="Media" onClick={() => addLayer('image')} />
            <ToolButton icon={<Square />} label="Shape" onClick={() => addLayer('box')} />
            <ToolButton icon={<Minus />} label="Rule" onClick={() => addLayer('line')} />
            <ToolButton icon={<QrCode />} label="Secure" onClick={() => addLayer('qr')} />
          </aside>

          <main 
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={() => setSelectedLayerId(null)} 
            className="flex-1 bg-zinc-100 relative overflow-auto scrollbar-none flex flex-col items-center p-20"
          >
            <div 
              ref={canvasRef}
              className="relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-300 origin-top bg-white overflow-hidden"
              style={{ 
                width: `${frameSize.width}px`, 
                height: `${frameSize.height}px`,
                transform: `scale(${zoomLevel})`,
                backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {layers.map((l) => renderLayer(l))}
            </div>
          </main>

          <aside className={cn(
            "bg-white border-l border-zinc-200 shrink-0 flex flex-col h-full transition-all duration-300 z-40 overflow-hidden shadow-2xl",
            isSidebarOpen ? "w-80" : "w-0 border-l-0"
          )}>
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between min-w-[320px]">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{selectedLayer ? 'Element Attributes' : 'Global Settings'}</h4>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-300 hover:text-zinc-900 p-1 border-none bg-transparent outline-none cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <ScrollArea className="flex-1 min-w-[320px]">
              <div className="p-6 space-y-10">
                {!selectedLayer ? (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Student Data Sync</Label>
                      <Select 
                        value={selectedPreviewStudent?.id || "none"} 
                        onValueChange={(val) => setSelectedPreviewStudent(students.find(s => s.id === val))}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50 font-bold text-zinc-700">
                          <SelectValue placeholder="Live Data Preview" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                          <SelectItem value="none">No Preview (Raw Keys)</SelectItem>
                          {students.map(s => <SelectItem key={s.id} value={s.id}>{s.studentName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Default Designs</h5>
                      <div className="grid grid-cols-2 gap-3">
                        {DEFAULT_FRAMES.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setBackgroundUrl(f.url)}
                            className={cn(
                              "group p-2 rounded-xl border-2 transition-all flex flex-col gap-2 bg-transparent outline-none cursor-pointer",
                              backgroundUrl === f.url ? "border-primary bg-primary/5" : "border-zinc-100 hover:border-primary/20"
                            )}
                          >
                            <div className="aspect-[1.4/1] bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 relative">
                              {f.url ? <img src={f.url} alt={f.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white" />}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest truncate">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Or Paste Frame URL</Label>
                        {isUploadingBackground && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                      </div>
                      <div className="relative group">
                        <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={backgroundUrl} 
                          onChange={(e) => setBackgroundUrl(e.target.value)} 
                          placeholder="https://..." 
                          className="pl-10 h-11 bg-zinc-50 border-none rounded-xl text-xs font-bold shadow-inner" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Custom Upload</Label>
                      </div>
                      <div className="w-full h-32 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-300 relative group overflow-hidden">
                        <CloudUpload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Drop Frame File</span>
                        <input 
                          type="file" 
                          onChange={(e) => handleImageUpload(e, 'background')} 
                          className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                          accept="image/*" 
                          title="Upload custom skin" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Canvas Scale (A4)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <PropertyInput label="Width (px)" value={frameSize.width} onChange={(v) => setFrameSize({...frameSize, width: Number(v)})} />
                        <PropertyInput label="Height (px)" value={frameSize.height} onChange={(v) => setFrameSize({...frameSize, height: Number(v)})} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] px-3">Type: {selectedLayer.type}</Badge>
                      <button onClick={() => removeLayer(selectedLayer.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all border-none bg-transparent outline-none cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Position & Dimensions</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <PropertyInput label="X Pos (%)" value={Math.round(selectedLayer.x)} onChange={(v) => updateLayer(selectedLayer.id, { x: Number(v) })} />
                        <PropertyInput label="Y Pos (%)" value={Math.round(selectedLayer.y)} onChange={(v) => updateLayer(selectedLayer.id, { y: Number(v) })} />
                        <PropertyInput label="Width (px)" value={selectedLayer.width} onChange={(v) => updateLayer(selectedLayer.id, { width: Number(v) })} />
                        <PropertyInput label="Height (px)" value={selectedLayer.height} onChange={(v) => updateLayer(selectedLayer.id, { height: Number(v) })} />
                      </div>
                    </div>

                    {selectedLayer.type === 'text' && (
                      <div className="space-y-6">
                        <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Typography</h5>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Link Record Value</Label>
                          <Select value={selectedLayer.key || "none"} onValueChange={(val) => updateLayer(selectedLayer.id, { key: val === "none" ? undefined : val })}>
                            <SelectTrigger className="bg-zinc-50 border-zinc-100 text-zinc-800 text-xs h-10 rounded-xl shadow-inner"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                              <SelectItem value="none" className="font-bold text-[11px] uppercase">Manual Static Text</SelectItem>
                              {DYNAMIC_KEYS.map(k => <SelectItem key={k.id} value={k.id} className="font-bold text-[11px] uppercase">{k.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {!selectedLayer.key && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Static Input</Label>
                            <Textarea 
                              value={selectedLayer.content} 
                              onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                              className="bg-zinc-50 border-zinc-100 text-zinc-800 text-xs min-h-[80px] rounded-xl shadow-inner"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <PropertyInput label="Font Px" value={selectedLayer.fontSize} onChange={(v) => updateLayer(selectedLayer.id, { fontSize: Number(v) })} />
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Text Ink</Label>
                            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-xl p-1.5 shadow-inner">
                              <input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent" />
                              <span className="text-[9px] font-mono text-zinc-400 uppercase">{selectedLayer.color}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ToggleButton icon={<Bold className="w-4 h-4" />} active={selectedLayer.fontWeight === 'bold'} onClick={() => updateLayer(selectedLayer.id, { fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' })} />
                          <ToggleButton icon={<Italic className="w-4 h-4" />} active={selectedLayer.fontStyle === 'italic'} onClick={() => updateLayer(selectedLayer.id, { fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })} />
                          <div className="w-px h-8 bg-zinc-100 mx-2" />
                          <ToggleButton icon={<AlignLeft className="w-4 h-4" />} active={selectedLayer.textAlign === 'left'} onClick={() => updateLayer(selectedLayer.id, { textAlign: 'left' })} />
                          <ToggleButton icon={<AlignCenter className="w-4 h-4" />} active={selectedLayer.textAlign === 'center'} onClick={() => updateLayer(selectedLayer.id, { textAlign: 'center' })} />
                          <ToggleButton icon={<AlignRight className="w-4 h-4" />} active={selectedLayer.textAlign === 'right'} onClick={() => updateLayer(selectedLayer.id, { textAlign: 'right' })} />
                        </div>
                      </div>
                    )}

                    {selectedLayer.type === 'image' && (
                      <div className="space-y-6">
                        <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Media Content</h5>
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Asset URL</Label>
                          <div className="relative group">
                            <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                            <Input 
                              value={selectedLayer.content} 
                              onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })} 
                              placeholder="https://..." 
                              className="pl-10 h-11 bg-zinc-50 border-none rounded-xl text-xs font-bold shadow-inner" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Or Upload Asset</Label>
                          <div className="w-full h-32 rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-300 relative group overflow-hidden shadow-inner">
                            {selectedLayer.content && selectedLayer.content.startsWith('http') ? (
                              <img src={selectedLayer.content} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                              <CloudUpload className="w-6 h-6 mb-2" />
                            )}
                            <input 
                              type="file" 
                              onChange={(e) => handleImageUpload(e, 'layer')} 
                              className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                              accept="image/*" 
                              title="Upload layer image" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    )
  }

  const mainContent = (
    <main className="flex-1 p-8 space-y-8 animate-in fade-in duration-500 w-full overflow-x-hidden text-black font-public-sans text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 font-headline uppercase tracking-tight leading-none">Credential Studio</h2>
          <p className="text-sm text-zinc-500 font-medium">Design professional institutional certifications</p>
        </div>
        <Button 
          onClick={() => openEditor()}
          className="bg-primary hover:opacity-90 text-white rounded-xl h-11 px-8 font-black uppercase text-xs tracking-widest shadow-lg border-none active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> New Design
        </Button>
      </div>

      <Card className="border border-zinc-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Template Library</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Academic Certificates</p>
            </div>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search designs..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-11 h-11 bg-zinc-50 border-none rounded-xl text-sm" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100">
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14 pl-10">TEMPLATE IDENTIFIER</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">COMPONENTS</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">LAST MODIFIED</TableHead>
                <TableHead className="text-right pr-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">OPERATIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} className="p-10"><div className="h-12 w-full bg-zinc-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                <TableRow key={t.id} className="border-zinc-50 hover:bg-zinc-50/30 group transition-none">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-base font-black text-zinc-800 uppercase tracking-tight">{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-600 border-none px-3 font-black text-[9px] uppercase">{t.layers?.length || 0} Elements</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-zinc-400 uppercase">
                    {t.updatedAt ? format(new Date(t.updatedAt), "PP") : '-'}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditor(t)} className="h-10 w-10 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(ref(database!, `Institutes/${resolvedId}/certificate-templates/${t.id}`))} className="h-10 w-10 text-rose-500 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-body overflow-x-hidden">
      <Sidebar />
      <div className="lg:pl-[280px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        {mainContent}
      </div>
    </div>
  )
}

function ToolButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group transition-all border-none bg-transparent outline-none cursor-pointer">
      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary group-hover:text-white group-hover:scale-110 active:scale-95 transition-all shadow-sm border border-zinc-100">
        {icon}
      </div>
      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] group-hover:text-primary">{label}</span>
    </button>
  )
}

function ToggleButton({ icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-none outline-none cursor-pointer",
        active ? "bg-primary text-white shadow-lg" : "bg-zinc-50 text-zinc-400 hover:text-zinc-900"
      )}
    >
      {icon}
    </button>
  )
}

function PropertyInput({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest ml-1">{label}</Label>
      <Input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="bg-zinc-50 border-zinc-100 text-zinc-800 h-10 text-xs font-bold rounded-xl focus-visible:ring-primary shadow-inner" 
      />
    </div>
  )
}

function ResizeHandle({ position, onMouseDown }: { position: string, onMouseDown: (e: React.MouseEvent) => void }) {
  const getPositionStyle = () => {
    switch(position) {
      case 'top-left': return { top: -4, left: -4, cursor: 'nwse-resize' };
      case 'top-right': return { top: -4, right: -4, cursor: 'nesw-resize' };
      case 'bottom-left': return { bottom: -4, left: -4, cursor: 'nesw-resize' };
      case 'bottom-right': return { bottom: -4, right: -4, cursor: 'nwse-resize' };
      case 'top': return { top: -4, left: 'calc(50% - 4px)', cursor: 'ns-resize' };
      case 'bottom': return { bottom: -4, left: 'calc(50% - 4px)', cursor: 'ns-resize' };
      case 'left': return { top: 'calc(50% - 4px)', left: -4, cursor: 'ew-resize' };
      case 'right': return { top: 'calc(50% - 4px)', right: -4, cursor: 'ew-resize' };
      default: return {};
    }
  }

  return (
    <div 
      onMouseDown={onMouseDown}
      style={getPositionStyle()}
      className="absolute w-2 h-2 bg-white border border-primary z-[60]"
    />
  )
}
