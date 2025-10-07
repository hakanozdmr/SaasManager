import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

type User = {
  id: string;
  username: string;
  role: string;
};

export function useAuth() {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = data?.user;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    requireAuth: () => {
      if (!isLoading && !isAuthenticated) {
        setLocation("/login");
      }
    },
  };
}
