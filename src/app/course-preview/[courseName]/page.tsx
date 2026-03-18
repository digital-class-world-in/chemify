
"use client"

import { useState, useEffect, use } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue, off, push, get } from "firebase/database"
import { motion } from "framer-motion"
import { 
  Clock, 
  Timer, 
  Layers, 
  Languages, 
  Award, 
  CreditCard, 
  ChevronRight,
  CheckCircle2,
  School,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Video,
  FileText,
  Smartphone,
  X,
  Send,
  Loader2,
  ShieldCheck,
  Youtube,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Layout,
  Share2,
  ShoppingCart,
  ChevronDown,
  User,
  Users,
  Building2,
  Landmark,
  QrCode,
  Copy,
  ExternalLink,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

const DEFAULT_OUTCOMES = [
  "Industry-standard core competencies",
  "Professional certification upon completion",
  "Hands-on project experience",
  "Career counseling & placement support"
]

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const instituteId = "JzZYbd6RobXVEn42uupTklHW1sn1";
  const courseId = params.id;
  const id = "b2";
  const { database } = useFirebase()
  
  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  const DUMMY_COURSE = {
  name: "Demo Course Title",
  description: "This is a sample course description. Real course data will appear here when available.",
  image: "https://placehold.co/800x500?text=Course+Preview",
  backgroundImage: "https://placehold.co/1200x800?text=Background",
  duration: "3",
  hours: "120",
  totalChapters: "10",
  language: "English",
  provideCertificate: "Yes",
  paymentMode: "Full Payment",
  sellingPrice: 1999,
  originalPrice: 3999,
  type: "Online",
  outcomes: {
    1: "Gain practical skills",
    2: "Work on real projects",
    3: "Get certification",
    4: "Career support"
  }
}
const finalCourse = course || DUMMY_COURSE;
const isDummy = !course;
const [courseNotFound, setCourseNotFound] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    message: ""
  })

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!database || !id) return
    get(ref(database, `Slugs/${id}`)).then((snapshot) => {
      const uid = snapshot.val() || id; 
      setResolvedUid(uid);
    });
  }, [database, id])

  useEffect(() => {
    if (!database || !resolvedUid || !courseId) return
    const rootPath = `Institutes/${resolvedUid}`
    
    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubProfile = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.val())
    })

    const settingsRef = ref(database, `${rootPath}/website_settings`)
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.val())
    })

    const paySettingsRef = ref(database, `${rootPath}/payment-settings`)
    const unsubPaySettings = onValue(paySettingsRef, (snapshot) => {
      if (snapshot.exists()) setPaymentSettings(snapshot.val())
    })

    const courseRef = ref(database, `${rootPath}/website_courses/${courseId}`)
    const unsubCourse = onValue(courseRef, (snapshot) => {
      if (snapshot.exists()) {
        const c = { ...snapshot.val(), id: snapshot.key }
        setCourse(c)
        setFormData(prev => ({ ...prev, course: c.name }))
      }
    })

    const coursesRef = ref(database, `${rootPath}/website_courses`)
    const unsubCourses = onValue(coursesRef, (s) => {
      const data = s.val() || {}
      setCourses(Object.keys(data).map(k => ({ ...data[k], id: k })))
      setIsLoading(false)
    })

    return () => {
      off(profileRef)
      off(settingsRef)
      off(paySettingsRef)
      off(courseRef)
      off(coursesRef)
    }
  }, [database, resolvedUid, courseId])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!database || !resolvedUid || isSubmitting) return
    setIsSubmitting(true)
    try {
      const dbPath = `Institutes/${resolvedUid}/website_inquiries`
      await push(ref(database, dbPath), {
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "New"
      })
      setIsSubmitted(true)
    } catch (err) {
      console.error("Submission failed", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const instituteName = profile?.instituteName || "Our Institute";
    const text = `Exciting news! Check out this course at *${instituteName}*:\n\n📚 *${course.name}*\n💰 Price: ₹${Number(course.sellingPrice || course.price).toLocaleString()}\n\n🔗 Enroll here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  if (isLoading || !course) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Connecting to Course Node...</p>
      </div>
    </div>
  )

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings?.contact?.phone || "",
    email: profile?.contactEmail || profile?.email || settings?.contact?.email || "",
    address: profile?.address || settings?.contact?.address || ""
  }

  const outcomes = course.outcomes ? Object.values(course.outcomes) : DEFAULT_OUTCOMES;
  const languages = course.languages ? Object.values(course.languages).join(", ") : (course.language || "English");
  const syllabus = course.syllabus ? Object.values(course.syllabus) : [];
  const faqs = course.faqs ? Object.values(course.faqs) : [];

  const discountValue = (Number(course.originalPrice) && Number(course.sellingPrice) && Number(course.originalPrice) > Number(course.sellingPrice)) 
    ? Math.round(((Number(course.originalPrice) - Number(course.sellingPrice)) / Number(course.originalPrice)) * 100) 
    : 0;

  const upiId = paymentSettings?.upiId || "";
  const bankDetails = paymentSettings?.bankDetails || {};
  const qrUrl = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Institute&cu=INR`)}` : null;

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
            <Link href={`/#`} className="hover:text-primary transition-colors">Home</Link>
            <Link href={`#about`} className="hover:text-primary transition-colors">About Us</Link>
            <Link href={`/#courses`} className="hover:text-primary transition-colors">Courses</Link>
            <Link href={`/infrastructure`} className="hover:text-primary transition-colors">Facilities</Link>
            <Link href={`/gallery`} className="hover:text-primary transition-colors">Gallery</Link>
            <Link href={`/#blog`} className="hover:text-primary transition-colors">Blogs</Link>
            <Link href={`/#contact`} className="hover:text-primary transition-colors">Contact</Link>
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
            <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(true); }} className="bg-primary hover:opacity-90 text-white rounded-full font-black text-[10px] uppercase px-8 h-11 shadow-lg border-none active:scale-95">
              Apply Now
            </Button>
          </div>
        </div>
      </header>

      <section className="relative pt-40 pb-20 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src={course.backgroundImage || course.image} className="w-full h-full object-cover blur-xl scale-110" alt="bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div {...fadeIn} className="space-y-8">
            <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <Link href={`/sites/${id}`} className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/sites/${id}#courses`} className="hover:text-white transition-colors">Courses</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{course.name}</span>
            </nav>
            <div className="space-y-4">
              <Badge className={cn(
                "border-none font-black text-[9px] uppercase tracking-widest px-4 py-1",
                course.type === 'Online' ? "bg-blue-600 text-white" : "bg-rose-600 text-white"
              )}>
                {course.type} PROGRAM
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[0.9] max-w-4xl">{course.name}</h1>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            <motion.div {...fadeIn} className="rounded-2xl overflow-hidden shadow-2xl border-8 border-zinc-50">
              <img src={course.image} className="w-full aspect-video object-cover" alt={course.name} />
            </motion.div>

            <div className="space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 border-b border-zinc-50 pb-10">
                <CourseSpec icon={<Clock className="text-blue-500" />} label="Duration" value={`${course.duration || '0'} Months`} />
                <CourseSpec icon={<Timer className="text-amber-500" />} label="Total Hours" value={`${course.hours || '0'} Hrs`} />
                <CourseSpec icon={<Layers className="text-purple-500" />} label="Lessons" value={`${course.totalChapters || '0'} Chapters`} />
                <CourseSpec icon={<Languages className="text-rose-500" />} label="Language" value={languages} />
                <CourseSpec icon={<Award className="text-emerald-500" />} label="Certification" value={course.provideCertificate === 'Yes' || course.digitalCredential === 'Yes' ? 'Available' : 'N/A'} />
                <CourseSpec icon={<CreditCard className="text-indigo-500" />} label="Payment" value={course.paymentMode || 'Full Payment'} />
              </div>

              <div className="space-y-8">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-8 border-b border-zinc-100 rounded-none mb-10">
                    <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[11px] tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 transition-none">Description</TabsTrigger>
                    <TabsTrigger value="syllabus" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[11px] tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 transition-none">Syllabus</TabsTrigger>
                    <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[11px] tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 transition-none">FAQ</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0 animate-in fade-in duration-500 space-y-12">
                    <div className="prose prose-zinc max-w-none">
                      <p className="text-lg text-zinc-500 font-medium leading-relaxed whitespace-pre-wrap">{course.description}</p>
                    </div>

                    <div className="bg-zinc-50 p-10 rounded-[32px] space-y-8 border border-zinc-100">
                      <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-primary" /> {course.outcomeHeading || "What you'll achieve"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {outcomes.map((point: string, i: number) => (
                          <OutcomeItem key={i} text={point} />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="syllabus" className="mt-0 animate-in fade-in duration-500">
                    <div className="bg-zinc-50 p-10 rounded-[32px] border border-zinc-100">
                      <h4 className="text-xl font-black text-zinc-800 uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Layout className="w-5 h-5 text-primary" /> Course Syllabus
                      </h4>
                      {syllabus.length > 0 ? (
                        <div className="space-y-12">
                          {syllabus.map((chapter: any, i: number) => (
                            <div key={i} className="space-y-4">
                              <h5 className="text-lg font-black text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-xs text-primary shadow-sm">{i + 1}</span>
                                {chapter.title}
                              </h5>
                              <p className="text-base text-zinc-500 font-medium leading-relaxed pl-10 whitespace-pre-wrap">
                                {chapter.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-lg text-zinc-500 font-medium leading-relaxed italic">
                          Curriculum details are currently being updated.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="faq" className="mt-0 animate-in fade-in duration-500">
                    {faqs.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq: any, idx: number) => (
                          <AccordionItem key={faq.id || idx} value={faq.id || idx.toString()} className="border border-zinc-100 rounded-2xl bg-white shadow-sm overflow-hidden px-6">
                            <AccordionTrigger className="hover:no-underline py-6 text-black">
                              <span className="text-left font-black uppercase text-[13px] tracking-tight text-zinc-800 flex items-center gap-3">
                                <HelpCircle className="w-4 h-4 text-primary shrink-0" /> {faq.q}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6">
                              <p className="text-zinc-500 font-medium leading-relaxed">{faq.a}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-20 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-100">
                        <MessageSquare className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No FAQs registered for this course.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 h-fit sticky top-32">
            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
                <div className="bg-white p-8 space-y-6 relative border-b border-zinc-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Complete Package</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-4xl font-black text-zinc-900 tracking-tighter">₹ {Number(course.sellingPrice || course.price).toLocaleString()}</h4>
                      {course.originalPrice && (
                        <span className="text-lg font-bold text-zinc-300 line-through tracking-tight">₹ {Number(course.originalPrice).toLocaleString()}</span>
                      )}
                      {discountValue > 0 && (
                        <Badge className="bg-[#FF7A1A] text-white border-none text-[9px] font-black uppercase px-2 py-1 rounded-lg">{discountValue}% off</Badge>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 bg-zinc-50 rounded-lg text-zinc-400 hover:text-primary transition-colors border-none outline-none cursor-pointer">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-zinc-100 shadow-2xl bg-white">
                        <DropdownMenuItem onClick={shareWhatsApp} className="rounded-xl px-4 py-3 cursor-pointer focus:bg-zinc-50 flex items-center gap-3">
                          <img src="https://img.icons8.com/color/48/whatsapp--v1.png" className="w-5 h-5" alt="WA" />
                          <span className="text-sm font-bold text-zinc-700">WhatsApp</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={shareFacebook} className="rounded-xl px-4 py-3 cursor-pointer focus:bg-zinc-50 flex items-center gap-3">
                          <Facebook className="w-5 h-5 text-[#1877F2]" />
                          <span className="text-sm font-bold text-zinc-700">Facebook</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: "Link Copied", description: "You can now share this course." });
                        }} className="rounded-xl px-4 py-3 cursor-pointer focus:bg-zinc-50 flex items-center gap-3">
                          <Copy className="w-5 h-5 text-zinc-400" />
                          <span className="text-sm font-bold text-zinc-700">Copy Link</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(true); }}
                      variant="outline"
                      className="h-12 border-primary text-primary hover:text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all rounded-xl"
                    >
                      Enquiry Now
                    </Button>
                    <Button 
                      onClick={() => setIsPayModalOpen(true)}
                      className="h-12 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-900/20 active:scale-95 transition-all border-none rounded-xl"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>

                <div className="p-10">
                  <ul className="space-y-4">
                    <HighlightItem icon={<Video className="text-emerald-500" />} text={`${course.totalVideos || '0'} Video Lectures`} />
                    {course.pdfResources === 'Yes' && <HighlightItem icon={<FileText className="text-amber-500" />} text="Downloadable PDF Resources" />}
                    {course.deviceAccess === 'Yes' && <HighlightItem icon={<Smartphone className="text-blue-500" />} text="Mobile & Desktop Access" />}
                    {course.digitalCredential === 'Yes' && <HighlightItem icon={<ShieldCheck className="text-emerald-500" />} text="Official Digital Credential" />}
                    <HighlightItem 
                      icon={<Timer className="text-violet-500" />} 
                      text={`Mode: ${course.courseMode || 'Regular'}`} 
                    />
                  </ul>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 💳 BUY NOW (PAYMENT) DIALOG */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[600px] p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl focus:outline-none">
          <div className="bg-zinc-900 p-10 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white/40 border-none outline-none transition-colors"><X className="h-6 w-6" /></DialogClose>
            <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3">Secure Enrollment</Badge>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-tight">Enroll in {course.name}</DialogTitle>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Amount Payable: <span className="text-white font-black">₹ {Number(course.sellingPrice || course.price).toLocaleString()}</span></p>
            </div>
          </div>

          <div className="p-8">
            <Tabs defaultValue="upi" className="w-full">
              <TabsList className="grid grid-cols-2 bg-zinc-50 p-1.5 rounded-2xl h-14 mb-8">
                <TabsTrigger value="upi" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Direct UPI</TabsTrigger>
                <TabsTrigger value="bank" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Bank Transfer</TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="mt-0 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-56 h-56 bg-zinc-50 rounded-[40px] p-6 border border-zinc-100 flex items-center justify-center shadow-inner overflow-hidden">
                      {qrUrl ? (
                        <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-300">
                          <QrCode className="w-12 h-12 opacity-20" />
                          <span className="text-[8px] font-black uppercase">QR Unavailable</span>
                        </div>
                      )}
                    </div>
                    {qrUrl && (
                      <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-2 rounded-2xl shadow-xl border-4 border-white">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Merchant UPI ID</p>
                      <div className="flex items-center justify-center gap-3">
                        <p className="text-xl font-black text-zinc-800 tracking-tight">{upiId || "Not Configured"}</p>
                        {upiId && (
                          <button onClick={() => copyToClipboard(upiId, "UPI ID")} className="p-2 hover:bg-zinc-100 rounded-xl transition-all border-none bg-transparent">
                            <Copy className="w-4 h-4 text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="mt-0 space-y-6 animate-in fade-in duration-500">
                <div className="bg-zinc-50 rounded-[32px] border border-zinc-100 p-8 space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-200 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><Landmark className="w-5 h-5" /></div>
                    <div>
                      <h5 className="text-sm font-black text-zinc-800 uppercase tracking-tight">Institutional Account</h5>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{bankDetails.bankName || 'Direct Transfer'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <BankInfoRow label="A/C Holder" value={bankDetails.accountHolderName} onCopy={() => copyToClipboard(bankDetails.accountHolderName, "Account Name")} />
                    <BankInfoRow label="Account No." value={bankDetails.accountNumber} onCopy={() => copyToClipboard(bankDetails.accountNumber, "Account Number")} isMono />
                    <BankInfoRow label="IFSC Code" value={bankDetails.ifscCode} onCopy={() => copyToClipboard(bankDetails.ifscCode, "IFSC Code")} isMono />
                    <BankInfoRow label="Account Type" value={bankDetails.accountType} />
                    <BankInfoRow label="Branch Name" value={bankDetails.branchName} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 pt-8 border-t border-zinc-100 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" />
                Please share payment screenshot with our support
              </div>
              <p className="text-[9px] text-zinc-400 font-medium leading-relaxed max-w-[300px] mx-auto uppercase">After payment, share the transaction details on WhatsApp or Email for instant access activation.</p>
            </div>
          </div>
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
              <li><Link href={`/sites/${id}#courses`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Courses</Link></li>
              <li><Link href="#" className="text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Facilities</Link></li>
              <li><Link href={`/sites/${id}/gallery`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Gallery</Link></li>
              <li><Link href={`/sites/${id}#blog`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Blogs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Contact Info</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li className="flex items-center gap-3 font-public-sans text-white"><Phone className="w-4 h-4 text-primary" /> {publicContact.phone}</li>
              <li className="flex items-center gap-3 font-public-sans text-white"><Mail className="w-4 h-4 text-primary" /> {publicContact.email}</li>
              <li className="flex items-start gap-3 font-public-sans text-white"><MapPin className="w-4 h-4 text-primary shrink-0" /> {publicContact.address}</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">© {format(new Date(), "yyyy")} All Rights Reserved | {profile?.instituteName || "Your Institute"}</p>
        </div>
      </footer>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[500px] p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl [&_[data-radix-dialog-close]]:hidden focus:outline-none">
          <div className="bg-primary p-10 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none outline-none transition-all">
              <X className="h-6 w-6" />
            </DialogClose>
            <div className="space-y-4">
              <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Admission Desk</Badge>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight leading-none">Apply for Admission</DialogTitle>
              <p className="text-sm text-blue-100 font-medium">Start your academic journey with us today.</p>
            </div>
          </div>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-10">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner"><CheckCircle2 className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Inquiry Received</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">We have received your application. Our counselor will contact you shortly.</p>
                  <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(false); }} className="w-full h-12 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border-none">Close Window</Button>
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
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 shadow-inner font-bold text-black"><SelectValue placeholder="Choose a course..." /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Additional Notes</Label>
                    <Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Ask about timings, fees, etc." className="rounded-2xl bg-zinc-50 border-zinc-100 min-h-[120px] text-black font-medium" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl border-none active:scale-95 transition-all border-none">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Inquiry
                  </Button>
                </form>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CourseSpec({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shadow-inner">{icon}</div>
      <div className="font-public-sans">
        <p className="text-[11px] font-black text-black uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-base font-black text-black uppercase">{value}</p>
      </div>
    </div>
  )
}

function HighlightItem({ icon, text }: { icon: any, text: string }) {
  return (
    <li className="flex items-center gap-3 text-zinc-500 font-medium text-sm">
      <div className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center shadow-sm">{icon}</div>
      {text}
    </li>
  )
}

function OutcomeItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
      <span className="text-sm font-bold text-zinc-600">{text}</span>
    </div>
  )
}

function BankInfoRow({ label, value, onCopy, isMono = false }: { label: string, value: string, onCopy?: () => void, isMono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between group">
      <div className="space-y-0.5">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className={cn(
          "text-sm font-black text-zinc-700 uppercase",
          isMono && "font-mono tracking-wider"
        )}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="p-2 hover:bg-zinc-200 rounded-lg transition-all opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer">
          <Copy className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      )}
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
