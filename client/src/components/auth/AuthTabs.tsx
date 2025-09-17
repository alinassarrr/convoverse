"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { useState } from "react";

export function AuthTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isLogin = pathname.endsWith("/login");
  const mode: "login" | "signup" = isLogin ? "login" : "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const fullname = String(formData.get("fullname"));

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login" ? { email, password } : { fullname, email, password };

    const loadingToast = toast.loading(
      mode === "login" ? "Signing you in..." : "Creating your account...",
      {
        description: "Please wait while we process your request",
      }
    );

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Authentication failed");
      }

      toast.success(
        mode === "login" ? "Welcome back!" : "Accoun  t created successfully!",
        {
          description:
            mode === "login"
              ? "You've been signed in successfully"
              : "Welcome to ConvoVerse! Let's get you started.",
          duration: 3000,
        }
      );

      setTimeout(() => {
        setIsLoading(true);
        if (mode === "login") {
          router.push("/inbox");
        } else {
          router.push("/integration");
        }
      }, 500);
    } catch (error: unknown) {
      toast.error(mode === "login" ? "Sign in failed" : "Registration failed", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        duration: 5000,
        action: {
          label: "Try Again",
          onClick: () => {
            const form = document.querySelector("form") as HTMLFormElement;
            if (form) form.requestSubmit();
          },
        },
      });
    } finally {
      toast.dismiss(loadingToast);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-tab/70 rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <Image
            src="/ConvoVerse_logo.png"
            alt="ConvoVerse"
            width={150}
            height={150}
          />
        </div>
        <h1 className="text-2xl font-bold ">ConvoVerse</h1>
        <p className="text-gray-300 text-sm">
          AI-Powered Unified Communication Platform
        </p>
      </div>

      <div className="flex mb-6">
        <Link
          href="/login"
          className={`flex-1 py-2 text-center rounded-l-lg ${
            isLogin ? "bg-primary text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className={`flex-1 py-2 text-center rounded-r-lg ${
            !isLogin ? "bg-primary text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Sign Up
        </Link>
      </div>

      {/* Shared Form */}
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-gray-400">
            {isLogin ? "Sign in to your account" : "Sign up to get started"}
          </p>
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="fullname" className="text-sm text-white">
              Full Name
            </label>
            <Input
              id="fullname"
              name="fullname"
              type="text"
              placeholder="Enter your name"
              className="mt-1 bg-neutral-900 border-neutral-700"
              required
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="text-sm text-white">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            className="mt-1 bg-neutral-900 border-neutral-700"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm text-white">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            className="mt-1 bg-neutral-900 border-neutral-700"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-indigo-500 mt-6 text-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? mode === "login"
              ? "Signing In..."
              : "Creating Account..."
            : mode === "login"
            ? "Sign In"
            : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
