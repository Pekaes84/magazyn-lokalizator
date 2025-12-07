import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2 } from "lucide-react";
import { InventoryItem } from "@/hooks/useInventory";

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  onSave: (data: { symbol: string; nazwa: string; kontener: string; regal: string; polka: string }) => void;
  isLoading?: boolean;
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  isLoading,
}: InventoryFormDialogProps) {
  const [symbol, setSymbol] = useState("");
  const [nazwa, setNazwa] = useState("");
  const [kontener, setKontener] = useState("");
  const [regal, setRegal] = useState("");
  const [polka, setPolka] = useState("");

  // Helper function to strip prefix for display
  const stripPrefix = (value: string | null | undefined, prefix: string): string => {
    if (!value) return "";
    const upper = value.toUpperCase();
    if (upper.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
    return value;
  };

  // Helper function to add prefix when saving
  const addPrefix = (value: string, prefix: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const upper = trimmed.toUpperCase();
    // If already has the prefix, return as-is (uppercase)
    if (upper.startsWith(prefix)) {
      return upper;
    }
    // Add prefix
    return prefix + trimmed.toUpperCase();
  };

  useEffect(() => {
    if (item) {
      setSymbol(item.Symbol);
      setNazwa(item.Nazwa || "");
      // Strip prefixes for display so user sees just the number
      setKontener(stripPrefix(item.Kontener, "K"));
      setRegal(stripPrefix(item.Regał, "R"));
      setPolka(stripPrefix(item.Półka, "P"));
    } else {
      setSymbol("");
      setNazwa("");
      setKontener("");
      setRegal("");
      setPolka("");
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSave({ 
        symbol: symbol.trim(), 
        nazwa: nazwa.trim(),
        // Add prefixes when saving
        kontener: addPrefix(kontener, "K"), 
        regal: addPrefix(regal, "R"), 
        polka: addPrefix(polka, "P") 
      });
    }
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {isEditing ? "Edytuj towar" : "Dodaj nowy towar"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Zmień dane towaru i zapisz zmiany."
              : "Wprowadź dane nowego towaru w magazynie."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="np. 1003"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nazwa">Nazwa</Label>
              <Input
                id="nazwa"
                placeholder="np. Różaniec drewniany"
                value={nazwa}
                onChange={(e) => setNazwa(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="kontener">Kontener (K)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">K</span>
                  <Input
                    id="kontener"
                    placeholder="np. 01"
                    value={kontener}
                    onChange={(e) => setKontener(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regal">Regał (R)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R</span>
                  <Input
                    id="regal"
                    placeholder="np. 01"
                    value={regal}
                    onChange={(e) => setRegal(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="polka">Półka (P)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">P</span>
                  <Input
                    id="polka"
                    placeholder="np. 01"
                    value={polka}
                    onChange={(e) => setPolka(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Zapisz zmiany" : "Dodaj towar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}