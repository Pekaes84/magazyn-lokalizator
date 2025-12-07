import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  username: z.string().trim().min(1, { message: 'Nazwa użytkownika jest wymagana' }),
  password: z.string().min(6, { message: 'Hasło musi mieć minimum 6 znaków' }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ username, password });
    if (!result.success) {
      const errors = result.error.errors;
      toast({
        title: 'Błąd walidacji',
        description: errors[0].message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Get email by username
    const { data: emailData, error: lookupError } = await supabase
      .rpc('get_email_by_username', { _username: username });

    if (lookupError || !emailData) {
      setIsSubmitting(false);
      toast({
        title: 'Błąd logowania',
        description: 'Nieprawidłowa nazwa użytkownika lub hasło',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await signIn(emailData, password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Błąd logowania',
        description: 'Nieprawidłowa nazwa użytkownika lub hasło',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Zalogowano',
        description: 'Witaj w systemie!',
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-foreground">
          System Lokalizacji Towarów
        </h1>
        <p className="text-muted-foreground">Zaloguj się, aby kontynuować</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Logowanie</CardTitle>
          <CardDescription>
            Wprowadź dane logowania
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Nazwa użytkownika</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="Twoja nazwa"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Hasło</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Zaloguj się
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
