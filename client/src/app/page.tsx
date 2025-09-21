"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Bot, Zap, Star } from "lucide-react";
import { useEffect, useState } from "react";

// Floating particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }>
  >([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.2,
      }));
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener("resize", generateParticles);
    return () => window.removeEventListener("resize", generateParticles);
  }, []);

  useEffect(() => {
    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          y: particle.y - particle.speed,
          x: particle.x + Math.sin(particle.y * 0.01) * 0.5,
          ...(particle.y < -10 && {
            y: window.innerHeight + 10,
            x: Math.random() * window.innerWidth,
          }),
        }))
      );
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
};

// Animated constellation background
const ConstellationBackground = () => {
  const [stars, setStars] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      twinkle: boolean;
    }>
  >([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        twinkle: Math.random() > 0.5,
      }));
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-background"></div>
      {stars.map((star) => (
        <Star
          key={star.id}
          className={`absolute text-primary/40 transition-opacity duration-2000 ${
            star.twinkle ? "animate-pulse" : ""
          }`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function GetStartedPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <ConstellationBackground />
      <FloatingParticles />

      {/* Interactive gradient that follows mouse */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(120, 119, 198, 0.1), transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Image
                src="/ConvoVerse_logo.png"
                alt="ConvoVerse"
                width={40}
                height={40}
                className="rounded-lg transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              ConvoVerse
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-16">
              <div className="relative mb-8">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 leading-tight">
                  Your Universe of
                  <span className="block bg-gradient-to-r from-primary via-secondary to-emerald-400 bg-clip-text text-transparent animate-pulse">
                    Conversations
                  </span>
                </h1>
                {/* Orbital rings around the title */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-96 h-96 border border-primary/20 rounded-full animate-spin-slow"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-secondary/20 rounded-full animate-spin-reverse"></div>
                </div>
              </div>

              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Navigate through the cosmos of communication. Connect
                <span className="text-primary font-semibold"> Slack</span>, and
                <span className="text-emerald-400 font-semibold">
                  {" "}
                  Gmail
                </span>{" "}
                in one stellar platform.
              </p>
            </div>

            {/* Interactive Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: MessageSquare,
                  title: "Unified Galaxy",
                  description:
                    "All your conversations orbiting in one cosmic dashboard",
                  color: "primary",
                  gradient: "from-primary/10 to-primary/5",
                },
                {
                  icon: Bot,
                  title: "AI Constellation",
                  description:
                    "Smart AI that navigates your communication universe",
                  color: "secondary",
                  gradient: "from-secondary/10 to-secondary/5",
                },
                {
                  icon: Zap,
                  title: "Quantum Sync",
                  description:
                    "Real-time updates at the speed of light across all platforms",
                  color: "emerald-400",
                  gradient: "from-emerald-400/10 to-emerald-400/5",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group bg-gradient-to-br ${feature.gradient} backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-${feature.color}/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-${feature.color}/20 cursor-pointer`}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <div
                    className={`w-16 h-16 bg-${feature.color}/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-${feature.color}/30 transition-all duration-300 group-hover:rotate-12`}
                  >
                    <feature.icon
                      className={`w-8 h-8 text-${feature.color} group-hover:scale-110 transition-transform duration-300`}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Enhanced CTA Section */}
            <div className="space-y-6">
              <div className="relative inline-block">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="text-xl px-12 py-4 h-auto group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary/50"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <span className="relative z-10 flex items-center">
                      Launch Into ConvoVerse
                      <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </span>
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Button>
                </Link>
                {/* Floating rings around button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div
                    className={`w-24 h-24 border-2 border-primary/30 rounded-full transition-all duration-700 ${
                      isHovering
                        ? "scale-150 opacity-0"
                        : "scale-100 opacity-100"
                    }`}
                  ></div>
                </div>
              </div>
              <p className="text-muted-foreground">
                Begin your journey through the communication cosmos
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-6 py-6 text-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            © 2025 ConvoVerse. Connecting universes, one conversation at a time.
          </p>
        </footer>
      </div>
    </div>
  );
}
