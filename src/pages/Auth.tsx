import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Nieprawidłowy adres email' }),
  password: z.string().min(6, { message: 'Hasło musi mieć minimum 6 znaków' }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
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
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      let message = 'Błąd logowania';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Nieprawidłowy email lub hasło';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Email nie został potwierdzony';
      }
      toast({
        title: 'Błąd logowania',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Zalogowano',
        description: 'Witaj w systemie!',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    setIsSubmitting(false);

    if (error) {
      let message = 'Błąd rejestracji';
      if (error.message.includes('User already registered')) {
        message = 'Użytkownik z tym adresem email już istnieje';
      }
      toast({
        title: 'Błąd rejestracji',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Konto utworzone',
        description: 'Możesz się teraz zalogować',
      });
      setActiveTab('login');
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
          <CardTitle>Dostęp do systemu</CardTitle>
          <CardDescription>
            Zaloguj się lub utwórz nowe konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logowanie</TabsTrigger>
              <TabsTrigger value="register">Rejestracja</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="twoj@email.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="twoj@email.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Hasło</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Minimum 6 znaków"
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
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Utwórz konto
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
