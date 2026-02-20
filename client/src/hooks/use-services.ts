import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import type { InsertService } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.services.list.path);
        if (!res.ok) throw new Error("Failed to fetch services");
        return api.services.list.responses[200].parse(await res.json());
      } catch (error) {
        console.error("Database connection error, returning empty services:", error);
        return [];
      }
    },
    retry: 1,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertService) => {
      const validated = api.services.create.input.parse(data);
      const res = await fetch(api.services.create.path, {
        method: api.services.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.services.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 401) {
          const error = errorSchemas.unauthorized.parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create service");
      }

      return api.services.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      toast({
        title: "Serviço criado",
        description: "O serviço foi adicionado ao catálogo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertService> }) => {
      const validated = api.services.update.input.parse(data);
      const url = buildUrl(api.services.update.path, { id });
      const res = await fetch(url, {
        method: api.services.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.services.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 401) {
          const error = errorSchemas.unauthorized.parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) {
          const error = api.services.update.responses[404].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update service");
      }

      return api.services.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      toast({
        title: "Serviço actualizado",
        description: "Os dados do serviço foram guardados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao actualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.services.delete.path, { id });
      const res = await fetch(url, {
        method: api.services.delete.method,
      });

      if (!res.ok && res.status !== 204) {
        if (res.status === 401) {
          const error = errorSchemas.unauthorized.parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) {
          const error = api.services.delete.responses[404].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to delete service");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido do catálogo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
