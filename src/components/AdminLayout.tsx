import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Video,
  MessageSquare,
  Wrench,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Wallet,
  Tag,
  Mail,
  ShoppingCart,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/admin" },
  { icon: <Users className="w-5 h-5" />, label: "Usuários", href: "/admin/users" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Cursos", href: "/admin/courses" },
  { icon: <FileText className="w-5 h-5" />, label: "Aulas", href: "/admin/lessons" },
  { icon: <FileText className="w-5 h-5" />, label: "Materiais", href: "/admin/materials" },
  { icon: <Tag className="w-5 h-5" />, label: "Categorias", href: "/admin/categories" },
  { icon: <Video className="w-5 h-5" />, label: "Ao Vivo", href: "/admin/live-sessions" },
  { icon: <MessageSquare className="w-5 h-5" />, label: "Comunidade", href: "/admin/community" },
  { icon: <Wrench className="w-5 h-5" />, label: "Ferramentas", href: "/admin/tools" },
  { icon: <Wallet className="w-5 h-5" />, label: "Finanças", href: "/admin/finance" },
  { icon: <Mail className="w-5 h-5" />, label: "Campanhas", href: "/admin/campaigns" },
  { icon: <ShoppingCart className="w-5 h-5" />, label: "Checkout", href: "/admin/checkout-settings" },
  { icon: <Settings className="w-5 h-5" />, label: "Configurações", href: "/admin/settings" },
];


function Sidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white ${className}`}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-lg">
            VC
          </div>
          <div>
            <h1 className="font-bold text-lg">Vibe Coding</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? "bg-sky-500 text-white shadow-lg"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
            >
              {item.icon}
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        {/* Settings link removed as per request to avoid duplication */}
      </div>
    </div>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Painel Administrativo</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name || "Admin"}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline ml-2">Sair</span>
        </Button>
      </div>
    </header>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated or not admin
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  /* REMOVIDO PARA TESTES
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Acesso Negado</h1>
          <p className="text-slate-600 mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header onMenuClick={() => setIsOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="page-transition" key={window.location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
