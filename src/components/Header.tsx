import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User } from "lucide-react";

interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

export function Header({
  isAdmin,
  onAdminClick,
  onSignOut,
  userEmail,
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Jakóbczak - Hurtownia Dewocjonaliów" className="h-12 md:h-14 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
                System Lokalizacji Towarów
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                onClick={onAdminClick} 
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Panel Admina</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            )}
            <Button 
              onClick={onSignOut} 
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Wyloguj</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
