
"use client"

import { useState, useEffect, use } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue, get, off } from "firebase/database"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronRight, 
  ChevronLeft,
  X, 
  ImageIcon,
  School,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Youtube,
  Search,
  Maximize2,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

const fadeIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

export default function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { database } = useFirebase()

  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [gallery, setGallery] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!database || !id) return
    get(ref(database, `Slugs/${id}`)).then((snapshot) => {
      const uid = snapshot.val() || id; 
      setResolvedUid(uid);
    });
  }, [database, id])

  useEffect(() => {
    if (!database || !resolvedUid) return
    const rootPath = `Institutes/${resolvedUid}`

    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubProfile = onValue(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.val())
    })

    const settingsRef = ref(database, `${rootPath}/website_settings`)
    const unsubSettings = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setSettings(data)
        setGallery(data.gallery || [])
      }
      setIsLoading(false)
    })

    return () => {
      off(profileRef)
      off(settingsRef)
    }
  }, [database, resolvedUid])

  const handlePrev = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + gallery.length) % gallery.length)
  }

  const handleNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % gallery.length)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Accessing Media Archive...</p>
        </div>
      </div>
    )
  }

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings?.contact?.phone || "",
    email: profile?.contactEmail || profile?.email || settings?.contact?.email || "",
    address: profile?.address || settings?.contact?.address || ""
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary/20" style={{ fontFamily: settings?.styling?.fontFamily || 'Poppins' }}>
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-md py-4 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href={`/sites/${id}`} className="flex items-center gap-3 hover:opacity-80 transition-all">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-12 w-auto" alt="Logo" />
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
            <Link href={`/sites/${id}`} className="hover:text-primary transition-colors">Home</Link>
            <Link href={`/sites/${id}#about`} className="hover:text-primary transition-colors">About Us</Link>
            <Link href={`/sites/${id}#courses`} className="hover:text-primary transition-colors">Courses</Link>
            <Link href={`/sites/${id}/infrastructure`} className="hover:text-primary transition-colors">Facilities</Link>
            <Link href="#" className="text-primary transition-colors">Gallery</Link>
            <Link href={`/sites/${id}#blog`} className="hover:text-primary transition-colors">Blogs</Link>
            <Link href={`/sites/${id}#contact`} className="hover:text-primary transition-colors">Contact</Link>
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
            <Button asChild className="bg-primary hover:opacity-90 text-white rounded-full font-black text-[10px] uppercase px-8 h-11 shadow-lg border-none active:scale-95">
              <Link href={`/sites/${id}#contact`}>Enquiry Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative pt-40 pb-20 bg-zinc-950 overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
          <Badge className="bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">Visual Archive</Badge>
          <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-[0.9]">Campus Moments</h1>
          <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto italic">Explore our modern infrastructure and academic environment through the lens of excellence.</p>
        </div>
      </section>

      <section className="py-20 bg-white min-h-[600px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {gallery.map((img, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedIndex(i)}
                className="group relative aspect-square rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                <img src={img.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={`Gallery ${i}`} />
                <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-zinc-900 shadow-xl scale-50 group-hover:scale-100 transition-transform duration-500">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {gallery.length === 0 && (
            <div className="py-32 text-center space-y-6 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-100">
              <ImageIcon className="w-16 h-16 text-zinc-200 mx-auto" />
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Media archive is currently empty</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col"
          >
            <div className="h-20 flex items-center justify-between px-10 border-b border-white/5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Photo {selectedIndex + 1} of {gallery.length}</p>
              <button 
                onClick={() => setSelectedIndex(null)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border-none outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-10">
              <button onClick={handlePrev} className="absolute left-10 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border-none active:scale-90 z-10"><ChevronLeft className="w-8 h-8" /></button>
              
              <motion.img 
                key={selectedIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                src={gallery[selectedIndex].url} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                alt="Fullscreen View"
              />

              <button onClick={handleNext} className="absolute right-10 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border-none active:scale-90 z-10"><ChevronRight className="w-8 h-8" /></button>
            </div>

            <div className="h-24 bg-white/5 border-t border-white/5 px-10 flex items-center justify-center overflow-x-auto gap-4 scrollbar-none">
              {gallery.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                    selectedIndex === i ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <li><Link href="#" className="text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Gallery</Link></li>
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

function SocialBtn({ icon, href }: { icon: any, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary hover:text-white transition-all border-none outline-none">
      {icon}
    </a>
  )
}
