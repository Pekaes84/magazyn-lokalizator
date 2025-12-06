import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MapPin, Package, Loader2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { scrapeProductDetails, ProductDetails } from "@/lib/scraper";
import { InventoryItem } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface InventoryRowProps {
  item: InventoryItem;
  isAdmin: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

export function InventoryRow({ item, isAdmin, onEdit, onDelete }: InventoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: productDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["productDetails", item.sku],
    queryFn: () => scrapeProductDetails(item.sku),
    enabled: isExpanded,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

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
            <h3 className="font-medium text-foreground truncate">{item.sku}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="font-mono font-semibold text-primary">{item.location}</span>
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
                  <span className="text-muted-foreground">Lokalizacja:</span>
                  <span className="font-mono font-bold text-primary">{item.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ostatnia aktualizacja:</span>
                  <span className="text-foreground">
                    {format(new Date(item.last_updated), "d MMM yyyy, HH:mm", { locale: pl })}
                  </span>
                </div>
                {isLoadingDetails ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sprawdzanie dostępności...</span>
                  </div>
                ) : productDetails ? (
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
                  Zobacz na jakobczak.pl
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
                  alt={item.sku}
                  className="w-full max-w-[200px] h-auto rounded-lg border border-border shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
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
