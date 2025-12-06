import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="text"
          placeholder="Wpisz nazwę towaru lub kod (SKU)..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-12 pr-12 h-14 text-lg rounded-xl border-2 border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:shadow-md"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setLocalValue("");
              onChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        {localValue.length < 2
          ? "Wpisz minimum 2 znaki, aby rozpocząć wyszukiwanie"
          : "Naciśnij Enter lub poczekaj na wyniki..."}
      </p>
    </div>
  );
}
