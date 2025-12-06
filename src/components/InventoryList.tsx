import { InventoryItem } from "@/hooks/useInventory";
import { InventoryRow } from "./InventoryRow";
import { Package, Search } from "lucide-react";

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  searchTerm: string;
  isAdmin: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

export function InventoryList({
  items,
  isLoading,
  searchTerm,
  isAdmin,
  onEdit,
  onDelete,
}: InventoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-card border border-border rounded-lg animate-pulse"
          >
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (searchTerm.length < 2) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Rozpocznij wyszukiwanie
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Wpisz nazwę towaru lub kod SKU w pole wyszukiwania powyżej, aby
          znaleźć lokalizację w magazynie.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Brak wyników
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nie znaleziono towarów pasujących do zapytania "
          <span className="font-medium">{searchTerm}</span>". Spróbuj zmienić
          frazę wyszukiwania.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Znaleziono <span className="font-semibold text-foreground">{items.length}</span>{" "}
          {items.length === 1 ? "wynik" : items.length < 5 ? "wyniki" : "wyników"}
        </p>
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <InventoryRow
            item={item}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
