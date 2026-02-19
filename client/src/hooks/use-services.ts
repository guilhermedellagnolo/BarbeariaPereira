import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

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
