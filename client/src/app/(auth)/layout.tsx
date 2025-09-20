import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/inbox");
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/BackGround.png')] bg-cover bg-center bg-accent">
      {children}
    </div>
  );
}
