"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Award,
  BrainCircuit,
  Calendar,
  MessageSquareCode,
  User as UserIcon,
  GitCommit,
} from "lucide-react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Define navigation items based on role
  const getMenuItems = (): MenuItem[] => {
    switch (role) {
      case "ADMIN":
        return [
          { name: "Overview", href: "/admin", icon: LayoutDashboard },
          { name: "Manage Classes", href: "/admin/classes", icon: Calendar },
          { name: "Manage Subjects", href: "/admin/subjects", icon: BookOpen },
          { name: "Manage Users", href: "/admin/users", icon: Users },
          { name: "Knowledge Graph", href: "/admin/graph", icon: GitCommit },
        ];
      case "TEACHER":
        return [
          { name: "Overview", href: "/teacher", icon: LayoutDashboard },
          { name: "My Classes", href: "/teacher/classes", icon: Users },
          { name: "Grades & Marks", href: "/teacher/grades", icon: Award },
          { name: "AI Insights", href: "/teacher/insights", icon: BrainCircuit },
        ];
      case "STUDENT":
        return [
          { name: "Overview", href: "/student", icon: LayoutDashboard },
          { name: "Academic Marks", href: "/student/marks", icon: Award },
          { name: "AI Recommendations", href: "/student/ai", icon: BrainCircuit },
          { name: "Digital Twin", href: "/student/twin", icon: UserIcon },
          { name: "Career Roadmap", href: "/student/career", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#151922] border-r border-gray-800/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-20 px-6 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/10">
                <GraduationCap className="h-6 w-6 text-[#0d0f14]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">SmartEdu AI</h1>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  {role} PANEL
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/40 transition-all group"
              >
                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer / User Section */}
        <div className="p-4 border-t border-gray-800/80 space-y-3 bg-[#0d0f14]/30">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-10 w-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-emerald-400 font-bold uppercase">
              {user ? user.name.charAt(0) : <UserIcon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Loading..."}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email || ""}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:h-screen">
        {/* Top Header */}
        <header className="h-20 px-6 lg:px-8 border-b border-gray-800/80 flex items-center justify-between shrink-0 bg-[#0d0f14]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white lg:hidden border border-gray-800 rounded-xl bg-[#151922]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-[#151922] border border-gray-800 rounded-full text-xs font-semibold text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Academic Session 2026/27</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
