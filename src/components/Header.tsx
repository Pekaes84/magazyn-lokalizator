import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Plus } from "lucide-react";

interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
  onSignOut: () => void;
  onAddItem: () => void;
  userEmail?: string;
}

export function Header({
  isAdmin,
  onAdminClick,
  onSignOut,
  onAddItem,
  userEmail
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            <img src={logo} alt="Jakóbczak - Hurtownia Dewocjonaliów" className="h-10 md:h-12 w-auto flex-shrink-0" />
            <h1 className="text-lg md:text-xl font-serif font-semibold text-foreground hidden md:block truncate">
              System Lokalizacji Towarów
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button onClick={onAddItem} size="sm" className="shadow-burgundy">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Dodaj</span>
            </Button>
            {isAdmin && (
              <Button onClick={onAdminClick} variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
                <Shield className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button onClick={onSignOut} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}