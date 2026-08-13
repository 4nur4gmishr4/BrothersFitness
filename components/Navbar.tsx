"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useUserAuth } from "@/lib/user-auth-context";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Phone, Menu, X, Star, ChevronRight, Github, Instagram } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg> );

const ProfileModal = dynamic(() => import("@/components/ProfileModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });
const WelcomeModal = dynamic(() => import("@/components/WelcomeModal"), { ssr: false });

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { showLoginModal, setShowLoginModal, showWelcome, setShowWelcome } = useUserAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isLoggedIn, isLoading } = useUserAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: "Home", id: "/", isRoute: true },
    { name: "Workouts", id: "/workouts", isRoute: true },
    { name: "Diet Planner", id: "/fuel", isRoute: true },
    { name: "Calculators", id: "/calculators", isRoute: true },
    { name: "Pricing", id: "/pricing", isRoute: true },
    { name: "Quotes", id: "/quotes", isRoute: true },
    { name: "Trophy Room", id: "/trophy-room", isRoute: true },
  ];

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    router.push(item.id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Boxy Futuristic Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[50] transition-all duration-300 ${
          isScrolled ? "bg-surface-canvas/90 backdrop-blur-md border-b border-surface-border" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  router.push("/");
                }
              }}
              className="relative z-50 group flex items-center gap-3 transition-colors duration-200"
            >
              <div className="font-display text-sm sm:text-lg md:text-xl tracking-widest text-hi font-bold cursor-default select-none group-hover:text-accent transition-colors duration-200">
                BROTHER&apos;S<span className="text-accent group-hover:animate-pulse">_</span>FITNESS
              </div>
            </button>

            {/* Desktop Navigation Links (Removed in favor of 5 Action Buttons) */}

            {/* Action Buttons (Always 5 buttons) */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-10 h-10 flex items-center justify-center border border-surface-border bg-surface-card hover:border-accent transition-colors duration-200"
                aria-label="Toggle theme"
              >
                <div className="w-5 h-5">
                  <Star className="w-full h-full text-hi group-hover:scale-110 group-hover:text-accent transition-all duration-300" />
                </div>
              </button>

              {/* Instagram (Brothers Fitness) */}
              <a
                href="https://www.instagram.com/brothers_fitness_17"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-surface-border bg-surface-card hover:border-accent group transition-colors duration-200"
                aria-label="Instagram"
              >
                <div className="w-5 h-5">
                  <Instagram className="w-full h-full text-hi group-hover:scale-110 group-hover:text-accent transition-all duration-300" />
                </div>
              </a>

              {/* WhatsApp (Aman) */}
              <a
                href="https://wa.me/919131179343"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-surface-border bg-surface-card hover:border-accent group transition-colors duration-200"
                aria-label="WhatsApp Aman"
              >
                <div className="w-5 h-5">
                  <WhatsAppIcon className="w-full h-full text-hi group-hover:scale-110 group-hover:text-accent transition-all duration-300" />
                </div>
              </a>

              {/* Profile Icon */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isLoggedIn) {
                    setShowProfileModal(true);
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className="w-10 h-10 flex items-center justify-center border border-surface-border bg-surface-card hover:border-accent group transition-colors duration-200"
                aria-label="Profile"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full skeleton" />
                ) : isLoggedIn && user?.photo_url ? (
                  <Image
                    src={user.photo_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-cover border border-accent"
                  />
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-hi group-hover:scale-110 group-hover:text-accent transition-all duration-300"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 flex items-center justify-center border border-surface-border bg-accent text-white hover:bg-hi hover:text-canvas transition-colors duration-200"
                aria-label="Toggle Menu"
              >
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Menu className={`absolute inset-0 w-full h-full transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                  <X className={`absolute inset-0 w-full h-full transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16 sm:h-20" />

      {/* Full Screen Menu */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-40 modal-overlay-in"
          />

          <div className="fixed inset-0 z-50 flex flex-col items-center px-4 pt-24 pb-6 pointer-events-none">
            <div className="w-full max-w-2xl overflow-y-auto scrollbar-hide pointer-events-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item, i) => {
                  const isActive = pathname === item.id;
                  return (
                    <button
                      key={item.name}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuClick(item); }}
                      className="group menu-item-in relative"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div
                        className={`flex items-center justify-between p-6 border transition-all duration-300 ${
                          isActive
                            ? "border-accent bg-accent/5"
                            : "border-surface-border bg-[#111] hover:border-accent hover:bg-accent/10"
                        }`}
                      >
                        <span
                          className={`text-lg font-display tracking-widest uppercase transition-colors duration-fast ${
                            isActive ? "text-accent" : "text-hi group-hover:text-accent"
                          }`}
                        >
                          {item.name}
                        </span>
                        <div className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity">
                           <ChevronRight className="w-full h-full text-accent group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                      {/* Technical corner accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>

              {/* Boxy Footer / Connect Section */}
              <div className="mt-12 pt-8 border-t border-surface-border">
                {/* Gym Owners */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 border border-surface-border bg-surface-card flex flex-col justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-low mb-2">AMAN (FOUNDER)</p>
                    <div className="flex gap-4">
                      <a href="tel:+919131179343" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"><Phone className="w-full h-full text-accent" /></a>
                      <a href="https://wa.me/919131179343" target="_blank" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"><WhatsAppIcon className="w-full h-full text-[#25D366]" /></a>
                    </div>
                  </div>
                  <div className="p-4 border border-surface-border bg-surface-card flex flex-col justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-low mb-2">PRADEEP (CO-FOUNDER)</p>
                    <div className="flex gap-4">
                      <a href="tel:+919131272754" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"><Phone className="w-full h-full text-accent" /></a>
                      <a href="https://wa.me/919131272754" target="_blank" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"><WhatsAppIcon className="w-full h-full text-[#25D366]" /></a>
                    </div>
                  </div>
                </div>
                
                {/* Developer */}
                <div className="p-4 border border-surface-border bg-surface-soft flex flex-col justify-between items-center text-center">
                  <p className="text-[10px] uppercase tracking-widest text-low mb-2">DEVELOPER : ANURAG MISHRA</p>
                  <div className="flex gap-6 mt-2">
                    <a href="https://github.com/4nur4gmishr4" target="_blank" className="w-8 h-8 opacity-70 hover:opacity-100 hover:scale-110 hover:-translate-y-1 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><Github className="w-full h-full text-hi" /></a>
                    <a href="https://www.instagram.com/4nur4gmishr4?igsh=MTZkb3N6NDNhc2kwaQ==" target="_blank" className="w-8 h-8 opacity-70 hover:opacity-100 hover:scale-110 hover:-translate-y-1 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><Instagram className="w-full h-full text-hi" /></a>
                    <a href="https://wa.me/919302786886" target="_blank" className="w-8 h-8 p-1 opacity-70 hover:opacity-100 hover:scale-110 hover:-translate-y-1 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"><WhatsAppIcon className="w-full h-full text-[#25D366]" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}