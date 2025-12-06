import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MapPin, Package, Loader2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { scrapeProductDetails } from "@/lib/scraper";
import { InventoryItem } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";

interface InventoryRowProps {
  item: InventoryItem;
  isAdmin: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

// Helper to build location string from components
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
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const location = buildLocation(item);

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
                {isLoadingDetails ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sprawdzanie dostępności...</span>
                  </div>
                ) : productDetails?.availability ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-medium ${
                        productDetails.availability === "Dostępny"
                          ? "text-green-600"
                          : productDetails.availability === "Niedostępny"
                          ? "text-red-500"
                          : "text-amber-600"
                      }`}
                    >
                      {productDetails.availability}
                    </span>
                  </div>
                ) : null}
              </div>
              {productDetails?.productUrl && (
                <a
                  href={productDetails.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {productDetails.success ? "Zobacz na jakobczak.pl" : "Szukaj na jakobczak.pl"}
                </a>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Podgląd
              </h4>
              {isLoadingDetails ? (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : productDetails?.imageUrl ? (
                <img
                  src={productDetails.imageUrl}
                  alt={item.Nazwa || item.Symbol}
                  className="w-full max-w-[200px] h-auto rounded-lg border border-border shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : productDetails?.productUrl ? (
                <a
                  href={productDetails.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-32 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer gap-2"
                >
                  <ExternalLink className="w-6 h-6" />
                  <span className="text-sm">Zobacz na stronie</span>
                </a>
              ) : (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}