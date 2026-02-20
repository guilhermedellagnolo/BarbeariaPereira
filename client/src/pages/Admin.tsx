import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useBookings,
  useUpdateBookingStatus,
  useBlockedTimes,
  useCreateBlockedTime,
  useDeleteBlockedTime,
} from "@/hooks/use-bookings";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  LogOut,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  Phone,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const { data: blockedTimes, isLoading: isLoadingBlocks } = useBlockedTimes();
  const createBlockedTime = useCreateBlockedTime();
  const deleteBlockedTime = useDeleteBlockedTime();
  const { data: services } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServiceImage, setNewServiceImage] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("main");

  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingDuration, setEditingDuration] = useState("");
  const [editingImage, setEditingImage] = useState("");
  const [editingCategory, setEditingCategory] = useState("main");

  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Sort bookings: Pending first, then by date/time
  const sortedBookings = bookings?.filter(booking => {
    const matchesName = !filterName || booking.customerName.toLowerCase().includes(filterName.toLowerCase());
    const matchesDate = !filterDate || booking.date === filterDate;
    return matchesName && matchesDate;
  }).sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  const dailyRevenue = sortedBookings?.reduce((acc, booking) => {
    if (booking.status === "completed") {
      const service = services?.find(s => s.id === booking.serviceId);
      return acc + (service ? service.price : 0);
    }
    return acc;
  }, 0) || 0;

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
        <Tabs defaultValue="bookings" className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 rounded-none">
            <TabsTrigger value="bookings" className="font-mono text-xs tracking-[0.2em]">
              BOOKINGS
            </TabsTrigger>
            <TabsTrigger value="availability" className="font-mono text-xs tracking-[0.2em]">
              GERIR DISPONIBILIDADE
            </TabsTrigger>
            <TabsTrigger value="catalog" className="font-mono text-xs tracking-[0.2em]">
              CATÁLOGO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-sm items-end">
                <div className="w-full md:w-auto flex-1">
                  <Label className="text-xs font-mono text-white/50 uppercase mb-2 block">Nome do Cliente</Label>
                  <Input 
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Buscar por nome..."
                    className="bg-black/40 border-white/10 text-white font-mono text-xs h-10 w-full"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Label className="text-xs font-mono text-white/50 uppercase mb-2 block">Data</Label>
                  <Input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-black/40 border-white/10 text-white font-mono text-xs h-10 w-full md:w-48"
                  />
                </div>
                <Button 
                  onClick={() => {
                    setFilterName("");
                    setFilterDate("");
                  }}
                  variant="outline"
                  className="w-full md:w-auto bg-transparent border-white/20 text-white/50 hover:text-white hover:border-white/50 font-mono text-xs h-10 px-4"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  LIMPAR FILTROS
                </Button>
              </div>

              <Card className="bg-gradient-to-r from-green-900/20 to-transparent border-green-500/20 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-mono text-xs tracking-[0.2em] text-green-400 mb-1">FATURAMENTO HOJE</h3>
                    <p className="text-white/40 text-[10px] font-mono">Agendamentos concluídos na data selecionada</p>
                  </div>
                  <div className="text-3xl font-display text-white">
                    R$ {(dailyRevenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedBookings?.length === 0 ? (
                  <div className="text-center py-20 text-white/30 font-mono">
                    NO BOOKINGS FOUND
                  </div>
                ) : (
                  sortedBookings?.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-6 border rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6
                        ${
                          booking.status === "pending"
                            ? "bg-white/5 border-white/20"
                            : "bg-transparent border-white/5 opacity-60"
                        }
                      `}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`
                            px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border rounded-full
                            ${
                              booking.status === "pending"
                                ? "border-yellow-500/50 text-yellow-500"
                                : ""
                            }
                            ${
                              booking.status === "confirmed"
                                ? "border-blue-500/50 text-blue-500"
                                : ""
                            }
                            ${
                              booking.status === "completed"
                                ? "border-green-500/50 text-green-500"
                                : ""
                            }
                            ${
                              booking.status === "cancelled"
                                ? "border-red-500/50 text-red-500"
                                : ""
                            }
                          `}
                          >
                            {booking.status}
                          </span>
                          <h3 className="font-display text-xl">
                            {services?.find((s) => s.id === booking.serviceId)?.name ||
                              "Unknown Service"}
                          </h3>
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
                            {format(new Date(booking.date), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {booking.time}
                          </div>
                        </div>
                      </div>

                      {booking.status === "confirmed" && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            onClick={() =>
                              updateStatus.mutate({
                                id: booking.id,
                                status: "completed",
                              })
                            }
                            className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 font-mono text-xs h-10"
                          >
                            <CheckCircle className="w-3 h-3 mr-2" />
                            CONCLUIR
                          </Button>
                        </div>
                      )}

                      {booking.status === "pending" && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            onClick={() =>
                              updateStatus.mutate({
                                id: booking.id,
                                status: "confirmed",
                              })
                            }
                            className="flex-1 bg-white text-black hover:bg-white/90 font-mono text-xs h-10"
                          >
                            <CheckCircle className="w-3 h-3 mr-2" />
                            CONFIRM
                          </Button>
                          <Button
                            onClick={() =>
                              updateStatus.mutate({
                                id: booking.id,
                                status: "cancelled",
                              })
                            }
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
          </TabsContent>

          <TabsContent value="availability">
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-start">
              <Card className="bg-white/5 border-white/10 p-6 rounded-none">
                <h2 className="font-mono text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">
                  NOVO BLOQUEIO
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-white/60">
                        Data (YYYY-MM-DD)
                      </Label>
                      <Input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] uppercase text-white/60">
                          Hora Início
                        </Label>
                        <Input
                          type="time"
                          value={blockStartTime}
                          onChange={(e) => setBlockStartTime(e.target.value)}
                          className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] uppercase text-white/60">
                          Hora Fim
                        </Label>
                        <Input
                          type="time"
                          value={blockEndTime}
                          onChange={(e) => setBlockEndTime(e.target.value)}
                          className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">
                      Deixe ambos vazios para bloquear o dia inteiro.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Motivo (opcional)
                    </Label>
                    <Input
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="MANUTENÇÃO, EVENTO, FÉRIAS..."
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (!blockDate) return;
                      createBlockedTime.mutate({
                        date: blockDate,
                        startTime: blockStartTime || null,
                        endTime: blockEndTime || null,
                        reason: blockReason || "",
                      });
                      setBlockDate("");
                      setBlockStartTime("");
                      setBlockEndTime("");
                      setBlockReason("");
                    }}
                    disabled={!blockDate || createBlockedTime.isPending}
                    className="w-full h-10 bg-white text-black hover:bg-white/90 font-mono text-[10px] tracking-[0.3em] uppercase"
                  >
                    {createBlockedTime.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "REGISTAR BLOQUEIO"
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6 rounded-none">
                <h2 className="font-mono text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">
                  BLOQUEIOS ATIVOS
                </h2>
                {isLoadingBlocks ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                  </div>
                ) : blockedTimes && blockedTimes.length > 0 ? (
                  <div className="space-y-2">
                    {blockedTimes.map((block: any) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between border border-white/10 px-3 py-2 font-mono text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="text-white">
                            {block.date} —{" "}
                            {!block.startTime && !block.endTime
                              ? "Dia Inteiro"
                              : `Das ${block.startTime} às ${block.endTime}`}
                          </span>
                          {block.reason && (
                            <span className="text-white/50">{block.reason}</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white/70 hover:text-red-500 hover:border-red-500/50 h-8 px-3 text-[10px]"
                          onClick={() => deleteBlockedTime.mutate(block.id)}
                        >
                          REMOVER
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/40 text-xs font-mono">
                    Nenhum bloqueio registado.
                  </div>
                )}
              </Card>
            </div>

            <Dialog
              open={!!editingServiceId}
              onOpenChange={(open) => {
                if (!open) setEditingServiceId(null);
              }}
            >
              <DialogContent className="bg-[#050505] border border-white/10 rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-mono text-xs tracking-[0.3em] text-white/60">
                    EDITAR SERVIÇO
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Nome
                    </Label>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Descrição
                    </Label>
                    <Textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-white/60">
                        Preço (R$)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-white/60">
                        Duração (min)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={editingDuration}
                        onChange={(e) => setEditingDuration(e.target.value)}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Categoria
                    </Label>
                    <select
                      value={editingCategory}
                      onChange={(e) => setEditingCategory(e.target.value)}
                      className="bg-black/40 border border-white/10 text-white font-mono text-xs h-10 w-full px-3"
                    >
                      <option value="main">SERVIÇOS ASSINATURA</option>
                      <option value="sporadic">QUÍMICA & ESPECIAIS</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      URL da Imagem
                    </Label>
                    <Input
                      value={editingImage}
                      onChange={(e) => setEditingImage(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="border-white/20 text-white/70 font-mono text-[10px] h-9 px-4"
                      onClick={() => setEditingServiceId(null)}
                    >
                      CANCELAR
                    </Button>
                    <Button
                      className="bg-white text-black hover:bg-white/90 font-mono text-[10px] h-9 px-4"
                      disabled={
                        updateService.isPending ||
                        !editingName ||
                        !editingDescription ||
                        !editingPrice ||
                        !editingDuration
                      }
                      onClick={() => {
                        if (!editingServiceId) return;
                        updateService.mutate({
                          id: editingServiceId,
                          data: {
                            name: editingName,
                            description: editingDescription,
                            price: Math.round(Number(editingPrice) * 100),
                          duration: Number(editingDuration),
                          image: editingImage,
                          category: editingCategory,
                        },
                      });
                        setEditingServiceId(null);
                      }}
                    >
                      GUARDAR
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="grid md:grid-cols-[1.1fr_1.1fr] gap-8 items-start">
              <Card className="bg-white/5 border-white/10 p-6 rounded-none">
                <h2 className="font-mono text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">
                  NOVO SERVIÇO
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Nome
                    </Label>
                    <Input
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      placeholder="Corte Premium, Barba Terapia..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Descrição
                    </Label>
                    <Textarea
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs"
                      placeholder="Descrição técnica do serviço..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-white/60">
                        Preço (R$)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-white/60">
                        Duração (min)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                        placeholder="45"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      Categoria
                    </Label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      className="bg-black/40 border border-white/10 text-white font-mono text-xs h-10 w-full px-3"
                    >
                      <option value="main">SERVIÇOS ASSINATURA</option>
                      <option value="sporadic">QUÍMICA & ESPECIAIS</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-white/60">
                      URL da Imagem (opcional)
                    </Label>
                    <Input
                      value={newServiceImage}
                      onChange={(e) => setNewServiceImage(e.target.value)}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      placeholder="https://..."
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (
                        !newServiceName ||
                        !newServiceDescription ||
                        !newServicePrice ||
                        !newServiceDuration
                      ) {
                        return;
                      }
                      createService.mutate({
                        name: newServiceName,
                        description: newServiceDescription,
                        price: Math.round(Number(newServicePrice) * 100),
                        duration: Number(newServiceDuration),
                        image:
                          newServiceImage ||
                          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000",
                        category: newServiceCategory,
                      });
                      setNewServiceName("");
                      setNewServiceDescription("");
                      setNewServicePrice("");
                      setNewServiceDuration("");
                      setNewServiceImage("");
                      setNewServiceCategory("main");
                    }}
                    disabled={
                      createService.isPending ||
                      !newServiceName ||
                      !newServiceDescription ||
                      !newServicePrice ||
                      !newServiceDuration
                    }
                    className="w-full h-10 bg-white text-black hover:bg-white/90 font-mono text-[10px] tracking-[0.3em] uppercase"
                  >
                    {createService.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "CRIAR SERVIÇO"
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6 rounded-none">
                <h2 className="font-mono text-xs tracking-[0.3em] text-white/50 mb-4 uppercase">
                  SERVIÇOS ATUAIS
                </h2>
                {!services || services.length === 0 ? (
                  <div className="text-white/40 text-xs font-mono">
                    Nenhum serviço configurado. Utilize o formulário ao lado para
                    criar o primeiro.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border border-white/10 bg-black/40 px-4 py-3 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] tracking-[0.2em] text-white/50">
                              ID {service.id}
                            </span>
                          </div>
                          <h3 className="font-display text-lg">{service.name}</h3>
                          <p className="text-white/50 text-xs font-mono line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs font-mono text-white/60 mt-1">
                            <span>
                              R${" "}
                              {(service.price / 100).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white/80 hover:bg-white/10 font-mono text-[10px] h-8 px-3"
                            onClick={() => {
                              setEditingServiceId(service.id);
                              setEditingName(service.name);
                              setEditingDescription(service.description);
                              setEditingPrice(String(service.price / 100));
                              setEditingDuration(String(service.duration));
                              setEditingImage(service.image);
                              setEditingCategory(service.category || "main");
                            }}
                          >
                            EDITAR
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/40 text-red-500 hover:bg-red-900/20 font-mono text-[10px] h-8 px-3"
                            onClick={() => deleteService.mutate(service.id)}
                          >
                            REMOVER
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
