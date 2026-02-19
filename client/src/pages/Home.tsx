import { useEffect, useRef } from "react";
import { useServices } from "@/hooks/use-services";
import { useBookingStore } from "@/hooks/use-store";
import { NavHeader } from "@/components/nav-header";
import { BookingDrawer } from "@/components/booking-drawer";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowDown, Clock, Scissors, Star } from "lucide-react";

// === HERO SECTION ===
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        {/* Unsplash: Barber shop dark aesthetic */}
        <img 
          src="https://images.unsplash.com/photo-1503951914875-452162b7f304?q=80&w=2070&auto=format&fit=crop" 
          alt="Barber Shop Interior"
          className="w-full h-full object-cover opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-white/60 block mb-4">
            Since 2024
          </span>
          <h1 className="kinetic-text text-6xl md:text-9xl text-white mb-2">
            PRECISION
          </h1>
          <h1 className="kinetic-text text-6xl md:text-9xl text-white/50">
            ENGINEERING
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-md text-white/70 font-sans text-sm md:text-base leading-relaxed mb-12"
        >
          Not just a haircut. A calculated refinement of your personal aesthetic.
          Experience the art of modern grooming.
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative px-8 py-4 bg-white text-black font-mono text-xs uppercase tracking-widest overflow-hidden"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">Book Appointment</span>
          <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </motion.button>
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
      >
        <ArrowDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}

// === LOOKBOOK SECTION ===
function Lookbook() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  const images = [
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
    "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
  ];

  return (
    <section id="lookbook" className="py-24 bg-[#050505] overflow-hidden">
      <div className="px-6 mb-12 flex justify-between items-end">
        <h2 className="text-4xl md:text-6xl font-display text-white">THE WORK</h2>
        <span className="font-mono text-xs text-white/40 hidden md:inline">01 — GALLERY</span>
      </div>

      <div ref={scrollRef} className="flex gap-6 px-6 overflow-x-auto snap-x snap-mandatory pb-8 no-scrollbar">
        {images.map((src, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 0.98 }}
            className="flex-shrink-0 w-[80vw] md:w-[400px] aspect-[3/4] snap-center relative group cursor-none"
          >
            <img src={src} alt={`Style ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <span className="text-white font-mono text-xs">STYLE REF. 0{i+1}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// === SERVICES SECTION ===
function Services() {
  const { data: services, isLoading } = useServices();
  const selectService = useBookingStore(s => s.selectService);

  return (
    <section id="services" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl font-display text-white mb-4">SERVICES</h2>
          <p className="text-white/50 max-w-md">Curated treatments for the modern individual.</p>
        </div>
        <span className="font-mono text-xs text-white/40">02 — MENU</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services?.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group relative p-8 glass-card min-h-[300px] flex flex-col justify-between cursor-pointer overflow-hidden"
              onClick={() => selectService(service)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <Scissors className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                  <span className="font-mono text-xl text-white">${(service.price / 100).toFixed(2)}</span>
                </div>
                <h3 className="text-2xl font-display text-white mb-2">{service.name}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.description}</p>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/40 font-mono text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{service.duration} MIN</span>
                </div>
                <span className="text-white text-xs font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                  Select Service &rarr;
                </span>
              </div>

              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

// === FOOTER ===
function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#020202]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-white/30">
          <Scissors className="w-4 h-4" />
          <span className="font-mono text-xs uppercase tracking-widest">Precision Cuts © 2024</span>
        </div>
        
        <div className="flex gap-8">
          <a href="#" className="text-white/30 hover:text-white text-xs font-mono uppercase transition-colors">Instagram</a>
          <a href="#" className="text-white/30 hover:text-white text-xs font-mono uppercase transition-colors">Twitter</a>
          <a href="/admin" className="text-white/10 hover:text-white/30 text-xs font-mono uppercase transition-colors">Staff Access</a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="bg-background min-h-screen text-foreground relative selection:bg-white selection:text-black">
      <div className="bg-grain" />
      <NavHeader />
      <Hero />
      <Lookbook />
      <Services />
      <Footer />
      <BookingDrawer />
    </div>
  );
}
