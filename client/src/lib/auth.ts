import { useRouter } from "next/navigation";
import { useState } from "react";

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies in request
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      // Clear any client-side storage if needed
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Redirect to login page
      router.push("/login");
      router.refresh(); // Refresh to clear any cached data
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the API call fails, still redirect to login for security
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
}
