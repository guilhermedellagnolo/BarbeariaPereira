import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ShopSettings {
  id: number;
  openTime: string;
  closeTime: string;
}

export function useShopSettings() {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ShopSettings>({
    queryKey: ["/api/settings"],
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<ShopSettings>) => {
      const res = await apiRequest("POST", "/api/settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings: data,
    isLoading,
    error,
    updateSettings,
  };
}
