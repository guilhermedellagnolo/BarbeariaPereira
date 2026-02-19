import { Link } from "wouter";
import { Scissors } from "lucide-react";
import { motion } from "framer-motion";

export function NavHeader() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 mix-blend-difference text-white"
    >
      <div className="flex items-center gap-3">
        <Scissors className="w-5 h-5" />
        <span className="font-mono text-sm tracking-widest uppercase hidden md:block">Precision Cuts</span>
      </div>

      <nav className="flex items-center gap-8">
        <button onClick={() => scrollToSection('lookbook')} className="text-sm font-medium hover:opacity-70 transition-opacity">LOOKBOOK</button>
        <button onClick={() => scrollToSection('services')} className="text-sm font-medium hover:opacity-70 transition-opacity">SERVICES</button>
      </nav>
    </motion.header>
  );
}
