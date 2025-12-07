import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { InventoryList } from "@/components/InventoryList";
import { InventoryFormDialog } from "@/components/InventoryFormDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useInventorySearch, InventoryItem } from "@/hooks/useInventory";
import {
  useCreateInventory,
  useUpdateInventory,
  useDeleteInventory,
} from "@/hooks/useInventoryMutations";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading } = useInventorySearch(searchTerm);
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wylogować",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Wylogowano",
        description: "Do zobaczenia!",
      });
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAdmin={isAdmin} 
        onAdminClick={() => navigate('/admin')} 
        onSignOut={handleSignOut}
        userEmail={user.email}
      />

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

          {/* Action Buttons - visible for all logged in users */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowFormDialog(true);
              }}
              className="shadow-burgundy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj towar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Zmiana lokalizacji",
                  description: "Wyszukaj produkt i rozwiń go, aby zmienić lokalizację",
                });
              }}
              variant="outline"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Zmień lokalizację
            </Button>
          </div>

          {/* Results */}
          <InventoryList
            items={items}
            isLoading={isLoading}
            searchTerm={searchTerm}
            isAdmin={true}
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
