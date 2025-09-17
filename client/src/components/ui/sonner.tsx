"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1a1a1a",
          border: "1px solid #374151",
          color: "#ffffff",
        },
        className: "custom-toast",
      }}
      {...props}
    />
  );
};

export { Toaster };
