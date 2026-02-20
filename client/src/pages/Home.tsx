import { useEffect, useRef } from "react";
import { useServices } from "@/hooks/use-services";
import { useBookingStore } from "@/hooks/use-store";
import { NavHeader } from "@/components/nav-header";
import { BookingDrawer } from "@/components/booking-drawer";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Clock, Scissors, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg-final.png";
import heroDesktop from "@/assets/hero-desktop.png";
import gallery10 from "@/assets/gallery-1-0.png";
import galleryNew1 from "@/assets/gallery-new-1.png";
import galleryNew2 from "@/assets/gallery-new-2.png";
import galleryNew3 from "@/assets/gallery-new-3.png";
import galleryNew4 from "@/assets/gallery-new-4.png";
import galleryMainNew from "@/assets/gallery-main-new.png";
import gallery1 from "@/assets/gallery-1.png";
import gallery2 from "@/assets/gallery-2.png";
import gallery3 from "@/assets/gallery-3.png";
import gallery4 from "@/assets/gallery-4.png";

// === HERO SECTION ===
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section id="hero" className="relative h-[85vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        {/* Mobile Image */}
        <img 
          src={heroBg} 
          alt="Barber Shop Interior"
          className="w-full h-full object-cover object-center opacity-40 grayscale md:hidden"
        />
        {/* Desktop Image */}
        <img 
          src={heroDesktop} 
          alt="Barber Shop Interior"
          className="w-full h-full object-cover object-center opacity-40 grayscale hidden md:block"
        />
        {/* Gradient Overlay - Pushed down to start below content */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-background" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-white/60 block mb-4">
            Desde 2024
          </span>
          <h1 className="font-serif font-black tracking-tighter text-6xl md:text-9xl text-white mb-2">
            BARBEARIA
          </h1>
          <h1 className="font-serif font-black tracking-tighter text-6xl md:text-9xl text-white/50">
            PEREIRA
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-md text-white/70 font-sans text-sm md:text-base leading-relaxed mb-12"
        >
          Muito mais que apenas um corte
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative px-8 py-4 bg-white text-black font-mono text-xs uppercase tracking-widest overflow-hidden whitespace-nowrap"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">Agendar Horário</span>
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
  const images = [
    gallery10,      // GALERIA 1.0 (First)
    galleryNew1,    // GALERIA 1
    galleryNew2,    // GALERIA 2
    galleryNew3,    // GALERIA 3
    galleryNew4,    // GALERIA 4
    galleryMainNew, // FOTO PRINCIPAL
    gallery1,
    gallery2,
    gallery3,
    gallery4,
  ];

  return (
    <section id="lookbook" className="py-24 bg-[#050505] overflow-hidden">
      <div className="px-6 mb-12 flex justify-between items-end">
        <h2 className="text-4xl md:text-6xl font-display text-white"></h2>
        <span className="font-mono text-xs text-white/40 hidden md:inline">01 — GALERIA</span>
      </div>

      {/* Infinite Marquee Container */}
      <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
        <ul className="flex items-center [&_li]:mx-2 [&_img]:max-w-none animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused]">
          {[...images, ...images].map((src, i) => (
            <li key={i} className="relative group/item flex-shrink-0">
              <div className="relative h-64 md:h-72 w-auto aspect-[3/4] overflow-hidden cursor-pointer">
                <img 
                  src={src} 
                  alt={`Style ${i}`} 
                  className="h-full w-auto object-cover opacity-40 grayscale transition-all duration-500 ease-out group-hover/item:opacity-100 group-hover/item:grayscale-0 group-hover/item:scale-105" 
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// === SERVICES SECTION ===
function Services() {
  const { data: services, isLoading } = useServices();
  const selectService = useBookingStore(s => s.selectService);

  const mainServices = services?.filter(s => !s.category || s.category === "main") || [];
  const sporadicServices = services?.filter(s => s.category === "sporadic") || [];

  return (
    <section id="services" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl font-display text-white mb-4">SERVIÇOS</h2>
          <p className="text-white/50 max-w-md">SERVIÇOS COMUNS</p>
        </div>
        <span className="font-mono text-xs text-white/40">02 — CARDÁPIO</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-16">
          {/* SERVIÇOS ASSINATURA */}
          <div>
            <h3 className="text-xl font-mono tracking-[0.2em] text-white/40 uppercase mb-8 border-l-2 border-white/20 pl-4">
              SERVIÇOS ASSINATURA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainServices.map((service) => (
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
                      <span className="font-mono text-xl text-white">R$ {(service.price / 100).toFixed(2)}</span>
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
                        Selecionar Serviço &rarr;
                      </span>
                    </div>

                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* QUÍMICA & ESPECIAIS */}
          {sporadicServices.length > 0 && (
            <div>
              <h3 className="text-xl font-mono tracking-[0.2em] text-white/40 uppercase mb-8 border-l-2 border-white/20 pl-4">
                QUÍMICA & ESPECIAIS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sporadicServices.map((service) => (
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
                        <Star className="w-6 h-6 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
                        <span className="font-mono text-xl text-white">R$ {(service.price / 100).toFixed(2)}</span>
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
                        Selecionar Serviço &rarr;
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
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
          <span className="font-mono text-xs uppercase tracking-widest">Barbearia Pereira © 2024</span>
        </div>
        
        <div className="flex gap-8">
          <a href="#" className="text-white/30 hover:text-white text-xs font-mono uppercase transition-colors">Instagram</a>
          <a href="#" className="text-white/30 hover:text-white text-xs font-mono uppercase transition-colors">Twitter</a>
          <a href="/admin" className="text-white/10 hover:text-white/30 text-xs font-mono uppercase transition-colors">Acesso Admin</a>
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
