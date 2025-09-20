"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function AuthTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const isSignin = pathname.endsWith("/signin");
  const mode: "signin" | "signup" = isSignin ? "signin" : "signup";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // log the data
    if (mode === "signup") {
      const formData = new FormData(e.currentTarget);
      console.log(Object.fromEntries(formData));
      router.push("/inbox");
    } else {
      const formData = new FormData(e.currentTarget);
      console.log(Object.fromEntries(formData));
      router.push("/inbox");
    }
  }

  return (
    <div className="w-full max-w-md bg-[#1f2937ac] rounded-2xl shadow-lg p-8">
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
          href="/signin"
          className={`flex-1 py-2 text-center rounded-l-lg ${
            isSignin ? "bg-primary text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className={`flex-1 py-2 text-center rounded-r-lg ${
            !isSignin ? "bg-primary text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Sign Up
        </Link>
      </div>

      {/* Shared Form */}
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {isSignin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-gray-400">
            {isSignin ? "Sign in to your account" : "Sign up to get started"}
          </p>
        </div>

        {!isSignin && (
          <div>
            <label className="text-sm text-white">Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              className="mt-1 bg-neutral-900 border-neutral-700"
              required
            />
          </div>
        )}

        <div>
          <label className="text-sm text-white">Email</label>
          <Input
            type="email"
            placeholder="Enter your email"
            className="mt-1 bg-neutral-900 border-neutral-700"
            required
          />
        </div>
        <div>
          <label className="text-sm text-white">Password</label>
          <Input
            type="password"
            placeholder="Enter your password"
            className="mt-1 bg-neutral-900 border-neutral-700"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-indigo-500 mt-6"
        >
          {isSignin ? "Sign In" : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
