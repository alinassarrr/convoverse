"use client";

import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/auth";

export function LogoutButton() {
  const { logout, isLoading } = useLogout();

  return (
    <Button
      variant="ghost"
      onClick={logout}
      disabled={isLoading}
      className="w-full justify-start gap-2 text-left font-normal text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-destructive/20 rounded-md"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <LogOut className="h-4 w-4 transition-colors" />
      )}
      <span className="font-medium">
        {isLoading ? "Logging out..." : "Logout"}
      </span>
    </Button>
  );
}
