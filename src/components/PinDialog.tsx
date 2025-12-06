import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, AlertCircle } from "lucide-react";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ADMIN_PIN = "1234";

export function PinDialog({ open, onOpenChange, onSuccess }: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleComplete = (value: string) => {
    if (value === ADMIN_PIN) {
      setError(false);
      setPin("");
      onSuccess();
      onOpenChange(false);
    } else {
      setError(true);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 1000);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPin("");
      setError(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Panel Administratora
          </DialogTitle>
          <DialogDescription>
            Wprowadź kod PIN, aby uzyskać dostęp do funkcji administracyjnych.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={setPin}
            onComplete={handleComplete}
          >
            <InputOTPGroup>
              <InputOTPSlot
                index={0}
                className={error ? "border-destructive animate-shake" : ""}
              />
              <InputOTPSlot
                index={1}
                className={error ? "border-destructive animate-shake" : ""}
              />
              <InputOTPSlot
                index={2}
                className={error ? "border-destructive animate-shake" : ""}
              />
              <InputOTPSlot
                index={3}
                className={error ? "border-destructive animate-shake" : ""}
              />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <div className="flex items-center gap-2 mt-4 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Nieprawidłowy kod PIN</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Anuluj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
