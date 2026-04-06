export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}

export function AuthLogo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const containerSize = size === 'large' ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = size === 'large' ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <div className="text-center mb-8">
      <div className={`inline-flex items-center justify-center ${containerSize} rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25`}>
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>
  );
}

export function AuthFooter() {
  return (
    <p className="text-center text-xs text-muted-foreground/60 mt-6">
      DealScope — © 2025 Tous droits réservés
    </p>
  );
}
