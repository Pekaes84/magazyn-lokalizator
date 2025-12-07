import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck } from "lucide-react";
interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
}
export function Header({
  isAdmin,
  onAdminClick
}: HeaderProps) {
  return <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Jakóbczak - Hurtownia Dewocjonaliów" className="h-12 md:h-14 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground">System Lokalizacji Towarów</h1>
              <p className="text-sm text-muted-foreground">
            </p>
            </div>
          </div>

          <Button onClick={onAdminClick} variant={isAdmin ? "default" : "outline"} className={isAdmin ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-burgundy" : "border-primary/30 text-primary hover:bg-primary/5"}>
            {isAdmin ? <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tryb Administratora</span>
                <span className="sm:hidden">Admin</span>
              </> : <>
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Panel Admina</span>
                <span className="sm:hidden">Admin</span>
              </>}
          </Button>
        </div>
      </div>
    </header>;
}