'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  User, Mail, Lock, Shield, Calendar, Building2,
  Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  BadgeCheck, Clock, LogOut
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  displayName: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim()[0].toUpperCase();
  }
  return email ? email[0].toUpperCase() : '?';
}

function getAvatarColor(name: string, email: string): string {
  const colors = [
    'from-indigo-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-blue-500',
    'from-fuchsia-400 to-purple-500',
  ];
  const str = (name || email || '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ProfileSection() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile edit form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Password change form
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setFirstName(data.user.firstName || '');
        setLastName(data.user.lastName || '');
        setEmail(data.user.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-dismiss success/error
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erreur lors de la mise à jour');
        return;
      }

      setProfile(data.user);
      setSuccessMessage('Profil mis à jour avec succès');

      // Update NextAuth session
      await updateSession({
        name: data.user.displayName,
      });
    } catch (error) {
      setErrorMessage('Erreur serveur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erreur lors du changement de mot de passe');
        return;
      }

      setSuccessMessage('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      setErrorMessage('Erreur serveur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Moyen', color: 'bg-amber-500' };
    return { score, label: 'Fort', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const initials = getInitials(profile?.displayName || '', profile?.email || '');
  const avatarColor = getAvatarColor(profile?.displayName || '', profile?.email || '');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Paramètres</h2>
        <p className="text-muted-foreground text-sm mt-1">Configuration de votre espace de travail</p>
      </div>

      {/* Success / Error banners */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{errorMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Banner + Avatar */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-purple-600/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="absolute -bottom-10 left-6">
            <div className={cn(
              'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl border-4 border-card',
              avatarColor
            )}>
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {profile?.displayName || 'Utilisateur'}
              </h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Shield className="w-3 h-3" />
                {profile?.role === 'admin' ? 'Administrateur' : 'Membre'}
              </span>
              {profile?.emailVerified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <BadgeCheck className="w-3 h-3" />
                  Vérifié
                </span>
              )}
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{profile?.workspace?.name || 'Espace de travail'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground uppercase">
                {profile?.workspace?.plan || 'free'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Membre depuis {profile?.createdAt ? formatDate(profile.createdAt) : '—'}</span>
            </div>
          </div>

          <div className="h-px bg-border mb-6" />

          {/* Edit form */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Informations personnelles
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="profile-firstName" className="text-xs font-medium text-muted-foreground">
                  Prénom
                </label>
                <input
                  id="profile-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="profile-lastName" className="text-xs font-medium text-muted-foreground">
                  Nom
                </label>
                <input
                  id="profile-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password section */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Mot de passe</h3>
              <p className="text-xs text-muted-foreground">Modifiez votre mot de passe de connexion</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            {showPasswordSection ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {showPasswordSection && (
          <div className="mt-5 space-y-4 animate-fade-in-up">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-xs font-medium text-muted-foreground">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-border'
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    'text-xs',
                    passwordStrength.score <= 2 ? 'text-red-400' :
                    passwordStrength.score <= 4 ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    Force : {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg text-sm bg-background border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all',
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10'
                    : 'border-border focus:border-indigo-500/50 focus:ring-indigo-500/10'
                )}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleChangePassword}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {saving ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Zone de danger</h3>
            <p className="text-xs text-muted-foreground">Actions irréversibles sur votre compte</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Se déconnecter</p>
            <p className="text-xs text-muted-foreground">Terminez votre session et revenez à l&apos;écran de connexion</p>
          </div>
          <button
            onClick={async () => {
              const { signOut } = await import('next-auth/react');
              await signOut({ callbackUrl: '/login' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}


