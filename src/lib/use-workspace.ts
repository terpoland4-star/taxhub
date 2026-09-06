import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspace } from "@/lib/server/workspace";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => getWorkspace(),
    retry: false,
  });
}

export function useRefreshWorkspace() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["workspace"] });
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof Error && err.message === "Unauthorized";
}
