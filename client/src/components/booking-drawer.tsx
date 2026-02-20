import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useBookingStore } from "@/hooks/use-store";
import { useCreateBooking, useBlockedTimes, useAvailability } from "@/hooks/use-bookings";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, ArrowLeft } from "lucide-react";

export function BookingDrawer() {
  const {
    isDrawerOpen,
    setDrawerOpen,
    selectedService,
    selectedDate,
    setDate,
    selectedTime,
    setTime,
    customerName,
    customerPhone,
    customerEmail,
    setCustomerDetails,
    reset
  } = useBookingStore();

  const createBooking = useCreateBooking();
  const { data: blockedTimes } = useBlockedTimes();
  const { data: availability } = useAvailability();
  const [step, setStep] = useState<"datetime" | "details" | "success">("datetime");

  // Time slots generated for example
  const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:30", "15:30", "16:30", "18:00"];

  const isDateBlockedAllDay = (date: Date) => {
    // Check past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    if (!blockedTimes) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedTimes.some(b => 
      b.date === dateStr && !b.startTime && !b.endTime
    );
  };

  const isTimeBlocked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Condição A: Já existir um agendamento (booking)
    if (availability?.some(b => b.date === dateStr && b.time === time)) {
      return true;
    }

    // Condição B: Bloqueio do Admin
    if (!blockedTimes) return false;
    return blockedTimes.some(b => {
      if (b.date !== dateStr) return false;
      if (!b.startTime && !b.endTime) return true; // All day
      if (b.startTime && b.endTime) {
        return time >= b.startTime && time <= b.endTime;
      }
      return false;
    });
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("datetime");
    } else if (step === "datetime") {
      setDrawerOpen(false);
      reset();
    }
  };

  const handleNext = () => {
    if (step === "datetime" && selectedDate && selectedTime) {
      setStep("details");
    } else if (step === "details" && customerName && customerPhone && customerEmail && selectedService && selectedDate && selectedTime) {
      createBooking.mutate({
        customerName,
        customerPhone,
        customerEmail,
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime
      }, {
        onSuccess: () => setStep("success")
      });
    }
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setStep("datetime");
      reset();
    }, 300);
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl mx-auto rounded-t-[20px]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left">
            {step !== "success" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto text-white/50 hover:text-white mb-4 font-mono text-xs uppercase tracking-widest hover:bg-transparent"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
            )}
            <DrawerTitle className="font-display text-2xl">
              {step === "success" ? "Booking Confirmed" : `Book ${selectedService?.name}`}
            </DrawerTitle>
            <DrawerDescription className="font-mono text-white/50">
              {step === "datetime" && "Select a date and time slot"}
              {step === "details" && "Enter your contact details"}
              {step === "success" && "Please save your receipt"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === "datetime" && (
                <motion.div
                  key="datetime"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setDate}
                      disabled={isDateBlockedAllDay}
                      className="border border-white/10 rounded-md p-4"
                    />
                  </div>
                  
                  {selectedDate && (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(time => {
                        const isBlocked = isTimeBlocked(selectedDate, time);
                        return (
                          <button
                            key={time}
                            onClick={() => setTime(time)}
                            disabled={isBlocked}
                            className={`
                              py-2 text-sm font-mono border transition-all
                              ${selectedTime === time 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-white border-white/20 hover:border-white/50'}
                              ${isBlocked ? 'opacity-20 pointer-events-none line-through' : ''}
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-mono text-xs uppercase text-white/50">Full Name</Label>
                    <Input 
                      id="name" 
                      value={customerName}
                      onChange={(e) => setCustomerDetails(e.target.value, customerPhone, customerEmail)}
                      className="bg-white/5 border-white/10 text-white font-display text-lg h-12 rounded-none focus-visible:ring-0 focus-visible:border-white"
                      placeholder="JOHN DOE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-mono text-xs uppercase text-white/50">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={customerPhone}
                      onChange={(e) => setCustomerDetails(customerName, e.target.value, customerEmail)}
                      className="bg-white/5 border-white/10 text-white font-display text-lg h-12 rounded-none focus-visible:ring-0 focus-visible:border-white"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-mono text-xs uppercase text-white/50">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerDetails(customerName, customerPhone, e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-display text-lg h-12 rounded-none focus-visible:ring-0 focus-visible:border-white"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="mt-8 p-4 bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-white/50">SERVICE</span>
                      <span>{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-white/50">DATE</span>
                      <span>{selectedDate && format(selectedDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-white/50">TIME</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm pt-2 border-t border-white/10">
                      <span className="text-white/50">TOTAL</span>
                      <span>${((selectedService?.price || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="bg-white text-black p-6 w-full font-mono text-sm relative receipt-edge pb-10">
                    <div className="text-center mb-6">
                      <h3 className="font-bold text-lg">RECEIPT</h3>
                      <p className="text-xs opacity-50">PRECISION CUTS INC.</p>
                    </div>
                    
                    <div className="space-y-2 mb-6 border-b border-black/10 pb-4">
                      <div className="flex justify-between">
                        <span>CLIENT</span>
                        <span className="uppercase">{customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DATE</span>
                        <span>{selectedDate && format(selectedDate, "yyyy-MM-dd")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TIME</span>
                        <span>{selectedTime}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL</span>
                      <span>${((selectedService?.price || 0) / 100).toFixed(2)}</span>
                    </div>

                    <div className="mt-8 text-center text-[10px] uppercase opacity-40">
                      Keep this receipt for your records.<br/>
                      Ref: {Math.random().toString(36).substring(7).toUpperCase()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DrawerFooter className="pt-2">
            {step !== "success" ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (step === "datetime" && (!selectedDate || !selectedTime)) ||
                  (step === "details" && (!customerName || !customerPhone || !customerEmail)) ||
                  createBooking.isPending
                }
                className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase tracking-widest text-xs"
              >
                {createBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : step === "datetime" ? "Continue" : "Confirm Booking"}
              </Button>
            ) : (
              <Button 
                onClick={handleClose}
                className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase tracking-widest text-xs"
              >
                Done
              </Button>
            )}
            {step === "details" && (
              <p className="text-[10px] text-white/30 font-mono text-center mt-2">
                A confirmação será enviada para o seu e-mail.
              </p>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
