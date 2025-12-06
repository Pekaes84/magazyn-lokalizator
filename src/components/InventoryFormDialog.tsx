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
  onSave: (data: { sku: string; location: string }) => void;
  isLoading?: boolean;
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  isLoading,
}: InventoryFormDialogProps) {
  const [sku, setSku] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (item) {
      setSku(item.sku);
      setLocation(item.location);
    } else {
      setSku("");
      setLocation("");
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sku.trim() && location.trim()) {
      onSave({ sku: sku.trim(), location: location.trim() });
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
              <Label htmlFor="sku">Nazwa towaru / SKU</Label>
              <Input
                id="sku"
                placeholder="np. Różaniec drewniany 5mm"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokalizacja</Label>
              <Input
                id="location"
                placeholder="np. A-01-01"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: Sekcja-Regał-Półka (np. A-01-01)
              </p>
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
