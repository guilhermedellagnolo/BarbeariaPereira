import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, LogOut, CheckCircle, XCircle, Calendar, Clock, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function LoginScreen() {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      <div className="bg-grain" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display text-white mb-2">STAFF ACCESS</h1>
          <p className="text-white/50 font-mono text-sm">Enter credentials to proceed</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="USERNAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/5 border-white/10 text-white h-12 font-mono"
            />
          </div>
          <div className="space-y-6">
            <Input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white h-12 font-mono"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-mono uppercase tracking-widest"
          >
            {isLoggingIn ? <Loader2 className="animate-spin" /> : "Authenticate"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const { data: bookings, isLoading } = useBookings();
  const updateStatus = useUpdateBookingStatus();

  // Sort bookings: Pending first, then by date/time
  const sortedBookings = bookings?.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative">
      <div className="bg-grain" />
      
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto z-10 relative">
        <div>
          <h1 className="text-2xl font-display">DASHBOARD</h1>
          <p className="text-white/50 font-mono text-xs">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => logout()} variant="outline" className="border-white/20 hover:bg-white/10 text-white">
          <LogOut className="w-4 h-4 mr-2" />
          LOGOUT
        </Button>
      </header>

      <main className="max-w-6xl mx-auto z-10 relative">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedBookings?.length === 0 ? (
              <div className="text-center py-20 text-white/30 font-mono">NO BOOKINGS FOUND</div>
            ) : (
              sortedBookings?.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-6 border rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6
                    ${booking.status === 'pending' ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-60'}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`
                        px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border rounded-full
                        ${booking.status === 'pending' ? 'border-yellow-500/50 text-yellow-500' : ''}
                        ${booking.status === 'confirmed' ? 'border-green-500/50 text-green-500' : ''}
                        ${booking.status === 'cancelled' ? 'border-red-500/50 text-red-500' : ''}
                      `}>
                        {booking.status}
                      </span>
                      <h3 className="font-display text-xl">{booking.serviceName || "Unknown Service"}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 font-mono">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {booking.customerName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {booking.customerPhone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(booking.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {booking.time}
                      </div>
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'confirmed' })}
                        className="flex-1 bg-white text-black hover:bg-white/90 font-mono text-xs h-10"
                      >
                        <CheckCircle className="w-3 h-3 mr-2" />
                        CONFIRM
                      </Button>
                      <Button
                        onClick={() => updateStatus.mutate({ id: booking.id, status: 'cancelled' })}
                        variant="outline"
                        className="flex-1 border-white/20 hover:bg-red-900/20 hover:text-red-500 hover:border-red-500/50 font-mono text-xs h-10 text-white"
                      >
                        <XCircle className="w-3 h-3 mr-2" />
                        CANCEL
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
