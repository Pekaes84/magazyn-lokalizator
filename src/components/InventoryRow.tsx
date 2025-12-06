import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MapPin, Package, Loader2, Pencil, Trash2, ImageOff } from "lucide-react";
import { scrapeProductDetails } from "@/lib/scraper";
import { InventoryItem } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InventoryRowProps {
  item: InventoryItem;
  isAdmin: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

function buildLocation(item: InventoryItem): string {
  const parts = [item.Kontener, item.Regał, item.Półka].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Brak lokalizacji";
}

export function InventoryRow({ item, isAdmin, onEdit, onDelete }: InventoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: productDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["productDetails", item.Symbol],
    queryFn: () => scrapeProductDetails(item.Nazwa || item.Symbol, item.Symbol),
    enabled: isExpanded,
    staleTime: 1000 * 60 * 10,
  });

  const location = buildLocation(item);

  const getAvailabilityBadge = () => {
    if (!productDetails?.availability) return null;
    
    const variant = productDetails.availability === "Dostępny" 
      ? "default" 
      : productDetails.availability === "Niedostępny" 
        ? "destructive" 
        : "secondary";
    
    return (
      <Badge 
        variant={variant}
        className={productDetails.availability === "Dostępny" ? "bg-green-600 hover:bg-green-700" : ""}
      >
        {productDetails.availability}
      </Badge>
    );
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card transition-all hover:shadow-md">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {item.Nazwa || item.Symbol}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Symbol: {item.Symbol}
              {item["Kod kreskowy"] && ` | EAN: ${item["Kod kreskowy"]}`}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span className="font-mono font-semibold text-primary">{location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Szczegóły produktu
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-mono text-foreground">{item.Symbol}</span>
                </div>
                {item["Kod kreskowy"] && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kod kreskowy:</span>
                    <span className="font-mono text-foreground">{item["Kod kreskowy"]}</span>
                  </div>
                )}
                {item.Kontener && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kontener:</span>
                    <span className="font-mono font-bold text-primary">{item.Kontener}</span>
                  </div>
                )}
                {item.Regał && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regał:</span>
                    <span className="font-mono font-bold text-primary">{item.Regał}</span>
                  </div>
                )}
                {item.Półka && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Półka:</span>
                    <span className="font-mono font-bold text-primary">{item.Półka}</span>
                  </div>
                )}
                
                {/* Availability Status */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Status:</span>
                  {isLoadingDetails ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Sprawdzanie...</span>
                    </div>
                  ) : (
                    getAvailabilityBadge() || (
                      <Badge variant="outline">Brak danych</Badge>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Podgląd
              </h4>
              <div className="aspect-square max-w-[200px] rounded-lg border border-border overflow-hidden bg-muted">
                {isLoadingDetails ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : productDetails?.imageUrl ? (
                  <img
                    src={productDetails.imageUrl}
                    alt={item.Nazwa || item.Symbol}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><line x1="18" x2="21" y1="12" y2="15"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg>
                          <span class="text-xs">Błąd ładowania</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImageOff className="w-8 h-8" />
                    <span className="text-xs">Brak zdjęcia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
