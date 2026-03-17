
"use client"

import { useState, useEffect, useMemo, use } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue, get, off } from "firebase/database"
import { motion } from "framer-motion"
import { 
  ChevronRight, Calendar, User, Clock, ArrowLeft,
  Share2, Facebook, Twitter, Linkedin, Youtube,
  Mail, Phone, Instagram, School, ArrowRight,
  Bookmark, MapPin, X, Send, Loader2, CheckCircle2,
  ChevronDown, ShieldCheck, Users, Building2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

export default function BlogDetailPage({ params }: { params: Promise<{ id: string, blogId: string }> }) {
  const id = "JzZYbd6RobXVEn42uupTklHW1sn1";
  const {  blogId } = use(params)
  const { database } = useFirebase()

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    message: "",
  })

  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [blog, setBlog] = useState<any>(null)
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database || !id) return
    get(ref(database, `Slugs/${id}`)).then((snapshot) => {
      const uid = snapshot.val() || id; 
      
      setResolvedUid(uid);
    });
  }, [database, id])

  useEffect(() => {
    if (!database || !resolvedUid || !blogId) return
    const rootPath = `Institutes/${resolvedUid}`

    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubProfile = onValue(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.val())
    })

    const settingsRef = ref(database, `${rootPath}/website_settings`)
    const unsubSettings = onValue(settingsRef, (snap) => {
      if (snap.exists()) setSettings(snap.val())
       
    })

    const coursesRef = ref(database, `${rootPath}/website_courses`)
    const unsubCourses = onValue(coursesRef, (s) => {
      const data = s.val() || {}
      setCourses(Object.keys(data).map(k => ({ ...data[k], id: k })))
    })

    const blogRef = ref(database, `${rootPath}/website_blogs/${blogId}`)
    const unsubBlog = onValue(blogRef, (snap) => {
      if (snap.exists()) {
         console.log("WZ");
        setBlog({ ...snap.val(), id: snap.key })
      }
    })

    const blogsRef = ref(database, `${rootPath}/website_blogs`)
    const unsubBlogs = onValue(blogsRef, (snap) => {
      const data = snap.val() || {}
      const list = Object.keys(data)
        .map(k => ({ ...data[k], id: k }))
        .filter(b => b.id !== blogId)
      setRelatedBlogs(list.slice(0, 3))
      setIsLoading(false)
    })

    return () => {
      off(profileRef)
      off(settingsRef)
      off(coursesRef)
      off(blogRef)
      off(blogsRef)
    }
  }, [database, resolvedUid, blogId])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.phone || formData.phone.length !== 10) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  if (isLoading || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Syncing Publication...</p>
        </div>
      </div>
    )
  }

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings?.contact?.phone || "",
    email: profile?.contactEmail || profile?.email || settings?.contact?.email || "",
    address: profile?.address || settings?.contact?.address || ""
  }

  const sections = blog.sections || []

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary/20" style={{ fontFamily: settings?.styling?.fontFamily || 'Poppins' }}>
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-md py-4 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href={`/sites/${id}`} className="flex items-center gap-3 hover:opacity-80 transition-all">
            {profile?.logoUrl ? (
               <img 
  src={profile.logoUrl} 
  className="h-20 w-auto object-contain" 
  alt="Logo" 
/>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                  <School className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-900 hidden sm:block">
                  {profile?.instituteName || "INSTITUTE"}
                </h1>
              </>
            )}
          </Link>
  <nav className="hidden lg:flex gap-8 font-black uppercase text-[14px] tracking-widest text-zinc-600">
            <Link href="#home">Home</Link>
            <Link href="#about">About Us</Link>
            <Link href="#courses">Courses</Link>
            <Link href="/infrastructure">Facilities</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="#blog">Blogs</Link>
            <Link href="#contact">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-zinc-200 text-zinc-700 rounded-full font-black text-[10px] uppercase px-8 h-11 shadow-sm hover:bg-zinc-50 border-none transition-all active:scale-95">
                  Login <ChevronDown className="ml-2 w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 border-zinc-100 shadow-2xl rounded-2xl overflow-hidden mt-4 bg-white">
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Admin Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/staff/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Staff Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/student/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Student Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none">
                  <Link href="/branch/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Branch Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => setIsApplyModalOpen(true)}
              className="bg-primary hover:opacity-90 text-white rounded-full font-black text-[14px] uppercase px-8 h-11 shadow-lg border-none active:scale-95"
            >
              Enquiry Now
            </Button>
          </div>
        </div>
      </header>

      <section className="relative h-[60vh] min-h-[500px] flex items-end pt-40 pb-20 overflow-hidden bg-zinc-900">
        <div className="absolute inset-0">
          <img src={blog.image} className="w-full h-full object-cover opacity-40" alt="Hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 w-full">
          <motion.div {...fadeIn} className="space-y-8">
            <Link href={`/sites/${id}#blog`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Back to Blogs
            </Link>
            <div className="space-y-4">
              <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase px-4 py-1 tracking-widest">{blog.category}</Badge>
              <h1 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.1]">{blog.title}</h1>
              <div className="flex items-center gap-8 text-xs font-black text-white/60 uppercase tracking-widest pt-4">
                <span className="flex items-center gap-2"><User className="w-4 h-4" /> By {blog.author || 'Academic Board'}</span>
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {blog.date}</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {blog.readTime || '5 min read'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            {blog.intro && (
              <motion.div {...fadeIn} className="prose prose-zinc max-w-none">
                <p className="text-xl text-zinc-500 font-medium leading-relaxed italic">
                  {blog.intro}
                </p>
              </motion.div>
            )}

            <div className="space-y-24">
              {sections.map((sec: any, i: number) => (
                <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }} className="space-y-8">
                  {sec.title && <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-tight leading-none">{sec.title}</h2>}
                  <div className={cn(
                    "grid grid-cols-1 gap-10 items-start",
                    sec.image ? "md:grid-cols-2" : "grid-cols-1"
                  )}>
                    {sec.image && (
                      <div className={cn("rounded-2xl overflow-hidden shadow-xl border-4 border-zinc-50", i % 2 !== 0 && "md:order-last")}>
                        <img src={sec.image} className="w-full h-full object-cover aspect-video" alt={sec.title} />
                      </div>
                    )}
                    <div className="prose prose-zinc">
                      <p className="text-lg text-zinc-500 font-medium leading-relaxed whitespace-pre-wrap">
                        {sec.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {blog.conclusion && (
              <motion.div {...fadeIn} className="pt-16 border-t border-zinc-100 space-y-6">
                <h3 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">Conclusion</h3>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                  {blog.conclusion}
                </p>
              </motion.div>
            )}

            <div className="pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-zinc-50">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Connect with us:</span>
                <div className="flex gap-2">
                  {settings?.social?.facebook && <ShareButton href={settings.social.facebook} icon={<Facebook className="w-4 h-4" />} color="bg-[#1877F2]" />}
                  {settings?.social?.twitter && <ShareButton href={settings.social.twitter} icon={<Twitter className="w-4 h-4" />} color="bg-[#1DA1F2]" />}
                  {settings?.social?.linkedin && <ShareButton href={settings.social.linkedin} icon={<Linkedin className="w-4 h-4" />} color="bg-[#0A66C2]" />}
                  {settings?.social?.youtube && <ShareButton href={settings.social.youtube} icon={<Youtube className="w-4 h-4" />} color="bg-[#FF0000]" />}
                  {settings?.social?.instagram && <ShareButton href={settings.social.instagram} icon={<Instagram className="w-4 h-4" />} color="bg-zinc-800" />}
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-12 h-fit lg:sticky lg:top-32">
            <Card className="border border-zinc-100 shadow-sm rounded-3xl bg-white overflow-hidden p-8 space-y-8">
              <h4 className="text-sm font-black text-zinc-800 uppercase tracking-[0.2em] border-b border-zinc-50 pb-4">Related Posts</h4>
              <div className="space-y-6">
                {relatedBlogs.map((rb) => (
                  <Link key={rb.id} href={`/sites/${id}/blog/${rb.id}`} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-50">
                      <img src={rb.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Related" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-zinc-800 uppercase tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {rb.title}
                      </h5>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{rb.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </section>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[500px] p-0 gap-0 border-none rounded-[32px] overflow-hidden shadow-2xl bg-white [&_[data-radix-dialog-close]]:hidden focus:outline-none">
          <div className="relative bg-primary px-10 py-10 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none outline-none transition-all">
              <X className="h-6 w-6" />
            </DialogClose>
            <div className="space-y-2.5">
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight uppercase">Submit Inquiry</DialogTitle>
              <p className="text-sm text-white/90 font-medium leading-relaxed">Our counselors will review your inquiry and get back to you within 24 business hours.</p>
            </div>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-10">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">Thank You!</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">Your application has been received. Our counselor will contact you shortly.</p>
                  </div>
                  <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(false); }} className="h-12 px-10 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border-none">Close Window</Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Full Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-bold text-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Mobile Number</Label>
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} required className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-bold text-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Select Program</Label>
                    <Select value={formData.course} onValueChange={val => setFormData({...formData, course: val})} required>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 shadow-inner font-bold text-black">
                        <SelectValue placeholder="Choose a program..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                        {courses.map(c => <SelectItem key={c.id} value={c.name} className="rounded-xl font-bold">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Message (Optional)</Label>
                    <Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="rounded-2xl bg-zinc-50 border-zinc-100 min-h-[120px] text-black font-medium" placeholder="Ask about timings, fees, etc." />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-900/20 active:scale-95 transition-all border-none">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Submit Application
                  </Button>
                </form>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <footer className="bg-zinc-950 text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 relative z-10">
          <div className="space-y-8">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-12 w-auto" alt="Logo" />
            ) : (
              <h3 className="text-2xl font-black uppercase tracking-tighter">Institute Node</h3>
            )}
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Developing professional excellence through industry-standard skill acquisition.</p>
            <div className="flex gap-4">
              {settings?.social?.facebook && <SocialBtn href={settings.social.facebook} icon={<Facebook className="w-4 h-4" />} />}
              {settings?.social?.twitter && <SocialBtn href={settings.social.twitter} icon={<Twitter className="w-4 h-4" />} />}
              {settings?.social?.linkedin && <SocialBtn href={settings.social.linkedin} icon={<Linkedin className="w-4 h-4" />} />}
              {settings?.social?.instagram && <SocialBtn href={settings.social.instagram} icon={<Instagram className="w-4 h-4" />} />}
              {settings?.social?.youtube && <SocialBtn href={settings.social.youtube} icon={<Youtube className="w-4 h-4" />} />}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Quick Access</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li><Link href={`/sites/${id}`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Home</Link></li>
              <li><Link href={`/sites/${id}#about`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> About Us</Link></li>
              <li><Link href={`/sites/${id}/infrastructure`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Facilities</Link></li>
              <li><Link href={`/sites/${id}/gallery`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Gallery</Link></li>
              <li><Link href={`/sites/${id}#blog`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Blogs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Contact Info</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary" /> {publicContact.phone}</li>
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> {publicContact.email}</li>
              <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-primary shrink-0" /> {publicContact.address}</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">© {format(new Date(), "yyyy")} All Rights Reserved | {profile?.instituteName || "Your Institute"}</p>
        </div>
      </footer>
    </div>
  )
}

function ShareButton({ icon, color, href }: { icon: any, color: string, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 border-none", color)}>
      {icon}
    </a>
  )
}

function SocialBtn({ icon, href }: { icon: any, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary hover:text-white transition-all border-none outline-none">
      {icon}
    </a>
  )
}
