import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateBookingRequest, type UpdateBookingStatusRequest, type CreateBlockedTimeRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.list.path);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return api.bookings.list.responses[200].parse(await res.json());
    },
  });
}

export function useAvailability() {
  return useQuery({
    queryKey: [api.bookings.availability.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.availability.path);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return api.bookings.availability.responses[200].parse(await res.json());
    },
  });
}

export function useAvailableSlots(date: string | undefined, serviceId: number | undefined) {
  return useQuery({
    queryKey: [api.bookings.availability.path, date, serviceId],
    queryFn: async () => {
      if (!date || !serviceId) return [];
      const url = `${api.bookings.availability.path}?date=${date}&serviceId=${serviceId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch available slots");
      return res.json() as Promise<string[]>;
    },
    enabled: !!date && !!serviceId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booking: CreateBookingRequest) => {
      const validated = api.bookings.create.input.parse(booking);
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.bookings.create.responses[400].parse(
            await res.json(),
          );
          throw new Error(error.message);
        }
        throw new Error("Failed to create booking");
      }

      return api.bookings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.bookings.availability.path] });
    },
    onError: (error: any) => {
      const message = error instanceof Error ? error.message : "Booking failed";
      toast({
        title: "Booking failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number } & UpdateBookingStatusRequest) => {
      const url = buildUrl(api.bookings.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.bookings.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      return api.bookings.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      toast({ title: "Status updated" });
    },
  });
}

export function useBlockedTimes() {
  return useQuery({
    queryKey: [api.blockedTimes.list.path],
    queryFn: async () => {
      const res = await fetch(api.blockedTimes.list.path);
      if (!res.ok) throw new Error("Failed to fetch blocked times");
      return api.blockedTimes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBlockedTime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateBlockedTimeRequest) => {
      const validated = api.blockedTimes.create.input.parse(data);
      const res = await fetch(api.blockedTimes.create.path, {
        method: api.blockedTimes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.blockedTimes.create.responses[400].parse(
            await res.json(),
          );
          throw new Error(error.message);
        }
        if (res.status === 401) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? "Unauthorized");
        }
        throw new Error("Failed to create blocked time");
      }

      return api.blockedTimes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.blockedTimes.list.path] });
      toast({
        title: "Disponibilidade actualizada",
        description: "O bloqueio foi registado com sucesso.",
      });
    },
    onError: (error: any) => {
      const message =
        error instanceof Error ? error.message : "Erro ao bloquear horário";
      toast({
        title: "Erro ao bloquear horário",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBlockedTime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.blockedTimes.delete.path, { id });
      const res = await fetch(url, {
        method: api.blockedTimes.delete.method,
      });

      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to delete blocked time");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.blockedTimes.list.path] });
      toast({
        title: "Bloqueio removido",
        description: "O horário voltou a ficar disponível.",
      });
    },
    onError: (error: any) => {
      const message =
        error instanceof Error ? error.message : "Erro ao remover bloqueio";
      toast({
        title: "Erro ao remover bloqueio",
        description: message,
        variant: "destructive",
      });
    },
  });
}
