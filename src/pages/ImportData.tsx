import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Upload, Loader2, CheckCircle } from "lucide-react";

// CSV content embedded from lokalizacje20x.csv
import csvData from "@/data/lokalizacje.csv?raw";

export default function ImportData() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; errors: number; total: number } | null>(null);

  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(10);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Brak tokenu autoryzacji");
      }

      setProgress(30);

      const response = await supabase.functions.invoke('import-csv', {
        body: { csvContent: csvData }
      });

      setProgress(90);

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data);
      setProgress(100);

      toast({
        title: "Sukces",
        description: `Zaimportowano ${response.data.imported} rekordów`,
      });

    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Błąd importu",
        description: error instanceof Error ? error.message : "Nieznany błąd",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Import danych inwentaryzacji</CardTitle>
            <CardDescription>
              Zaimportuj wszystkie dane z pliku lokalizacje20x.csv do bazy danych.
              Plik zawiera około 11 000 rekordów.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <p className="text-lg font-semibold">Import zakończony!</p>
                  <p className="text-muted-foreground">
                    Zaimportowano: {result.imported} / {result.total} rekordów
                  </p>
                  {result.errors > 0 && (
                    <p className="text-destructive">
                      Błędy: {result.errors}
                    </p>
                  )}
                </div>
                <Button onClick={() => navigate("/")}>
                  Przejdź do wyszukiwania
                </Button>
              </div>
            ) : (
              <>
                {importing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Importowanie danych... {progress}%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full"
                  size="lg"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importowanie...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Rozpocznij import
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Uwaga: Import może potrwać kilka minut. Nie zamykaj tej strony.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}