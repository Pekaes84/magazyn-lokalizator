import { useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { InventoryList } from "@/components/InventoryList";
import { PinDialog } from "@/components/PinDialog";
import { InventoryFormDialog } from "@/components/InventoryFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useInventorySearch, InventoryItem } from "@/hooks/useInventory";
import {
  useCreateInventory,
  useUpdateInventory,
  useDeleteInventory,
} from "@/hooks/useInventoryMutations";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading } = useInventorySearch(searchTerm);
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  const handleAdminClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
      toast({
        title: "Wylogowano",
        description: "Opuszczono tryb administratora",
      });
    } else {
      setShowPinDialog(true);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    toast({
      title: "Zalogowano",
      description: "Tryb administratora aktywny",
    });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowFormDialog(true);
  };

  const handleDelete = (item: InventoryItem) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const handleSave = (data: { symbol: string; nazwa: string; kontener: string; regal: string; polka: string }) => {
    if (editingItem) {
      updateMutation.mutate(
        { 
          id: editingItem.id, 
          Symbol: data.symbol,
          Nazwa: data.nazwa,
          Kontener: data.kontener,
          Regał: data.regal,
          Półka: data.polka,
        },
        {
          onSuccess: () => {
            setShowFormDialog(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      createMutation.mutate(
        { 
          Symbol: data.symbol,
          Nazwa: data.nazwa,
          Kontener: data.kontener,
          Regał: data.regal,
          Półka: data.polka,
        }, 
        {
          onSuccess: () => {
            setShowFormDialog(false);
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setDeletingItem(null);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={isAdmin} onAdminClick={handleAdminClick} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Znajdź towar w magazynie
            </h2>
            <p className="text-muted-foreground text-lg">
              Szybkie wyszukiwanie lokalizacji produktów
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center justify-between mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  Tryb Administratora aktywny
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setShowFormDialog(true);
                  }}
                  size="sm"
                  className="shadow-burgundy"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj towar
                </Button>
                <Button
                  onClick={handleAdminClick}
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Wyloguj
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          <InventoryList
            items={items}
            isLoading={isLoading}
            searchTerm={searchTerm}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Jakóbczak - Hurtownia Dewocjonaliów. System Lokalizacji Magazynowej.</p>
        </div>
      </footer>

      {/* Dialogs */}
      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handleAdminSuccess}
      />

      <InventoryFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setDeletingItem(null);
        }}
        item={deletingItem}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Index;
