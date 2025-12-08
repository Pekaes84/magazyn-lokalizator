import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Shield, ShieldCheck, ShieldX, Users, UserPlus, Trash2 } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import logo from '@/assets/logo.png';

const newUserSchema = z.object({
  username: z.string().trim().min(1, { message: 'Nazwa użytkownika jest wymagana' }),
  password: z.string().min(6, { message: 'Hasło musi mieć minimum 6 znaków' }),
});

interface UserWithRole {
  id: string;
  username: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true });
      } else if (!isAdmin) {
        navigate('/', { replace: true });
        toast({
          title: 'Brak dostępu',
          description: 'Nie masz uprawnień do panelu administratora',
          variant: 'destructive',
        });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          username: profile.username,
          role: (userRole?.role as 'admin' | 'user') || 'user',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać listy użytkowników',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: 'admin' | 'user') => {
    if (userId === user?.id) {
      toast({
        title: 'Błąd',
        description: 'Nie możesz zmienić swojej własnej roli',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingUserId(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: 'Zaktualizowano',
        description: `Użytkownik ${newRole === 'admin' ? 'otrzymał uprawnienia administratora' : 'utracił uprawnienia administratora'}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować roli użytkownika',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = newUserSchema.safeParse({ username: newUsername, password: newPassword });
    if (!result.success) {
      toast({
        title: 'Błąd walidacji',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { username: newUsername, password: newPassword }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Użytkownik utworzony',
        description: `Konto dla ${newUsername} zostało utworzone`,
      });
      setNewUsername('');
      setNewPassword('');
      // Refresh users list after a short delay
      setTimeout(() => fetchUsers(), 1000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Błąd tworzenia użytkownika';
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUser.id },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Użytkownik usunięty',
        description: `Konto ${deletingUser.username || 'użytkownika'} zostało usunięte`,
      });

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Błąd usuwania użytkownika';
      toast({
        title: 'Błąd',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-serif font-semibold text-foreground">
                  Panel Administratora
                </h1>
                <p className="text-sm text-muted-foreground">
                  Zarządzanie użytkownikami
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Dodaj nowego użytkownika</CardTitle>
                <CardDescription>
                  Utwórz konto dla nowego pracownika
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="new-username">Nazwa użytkownika</Label>
                <Input
                  id="new-username"
                  type="text"
                  placeholder="np. Jan"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="new-password">Hasło</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minimum 6 znaków"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Utwórz
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Użytkownicy systemu</CardTitle>
                <CardDescription>
                  Zarządzaj uprawnieniami użytkowników
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Brak użytkowników w systemie
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {u.role === 'admin' ? (
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      ) : (
                        <Shield className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{u.username || 'Bez nazwy'}</p>
                        <p className="text-sm text-muted-foreground">
                          Dołączył: {new Date(u.created_at).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                      </Badge>
                      {u.id !== user?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserRole(u.id, u.role)}
                            disabled={updatingUserId === u.id}
                          >
                            {updatingUserId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.role === 'admin' ? (
                              <>
                                <ShieldX className="w-4 h-4 mr-1" />
                                Odbierz admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-1" />
                                Nadaj admin
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          isLoading={isDeleting}
          title="Usunąć użytkownika?"
          description={`Czy na pewno chcesz usunąć użytkownika "${deletingUser?.username || 'Bez nazwy'}"? Ta operacja jest nieodwracalna.`}
        />
      </main>
    </div>
  );
}
