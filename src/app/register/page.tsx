'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AuthLayout, AuthLogo, AuthFooter } from '@/components/auth/auth-layout';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength';
import { ButtonSpinner } from '@/components/auth/loading-spinner';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de l'inscription"); return; }

      const result = await signIn('credentials', { email: formData.email, password: formData.password, redirect: false });
      if (result?.ok) { router.push('/'); router.refresh(); }
      else { router.push('/login'); }
    } catch { setError('Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  const inputClass = "bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11";

  return (
    <AuthLayout>
      <AuthLogo />
      <h1 className="text-2xl font-bold text-foreground text-center">DealScope</h1>
      <p className="text-muted-foreground mt-1 text-center">Créer votre compte</p>

      <div className="glass-card rounded-2xl p-8 mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm text-muted-foreground">Prénom</Label>
              <Input id="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required disabled={loading} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nom</Label>
              <Input id="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required disabled={loading} className={inputClass} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse email</Label>
            <Input id="email" type="email" placeholder="vous@entreprise.com" value={formData.email} onChange={handleChange} required disabled={loading} className={inputClass} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">Mot de passe</Label>
            <Input id="password" type="password" placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre" value={formData.password} onChange={handleChange} required disabled={loading} className={inputClass} />
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} className={inputClass} />
          </div>

          <Button type="submit" disabled={loading} className={cn('w-full h-11 font-medium', 'bg-gradient-to-r from-violet-600 to-indigo-600', 'hover:from-violet-500 hover:to-indigo-500', 'text-white shadow-lg shadow-violet-500/25', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            {loading ? <span className="flex items-center gap-2"><ButtonSpinner /> Création en cours...</span> : 'Créer mon compte'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <a href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Se connecter</a>
          </p>
        </div>
      </div>

      <AuthFooter />
    </AuthLayout>
  );
}
