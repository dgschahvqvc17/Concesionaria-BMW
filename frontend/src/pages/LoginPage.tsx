import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AuthBrandPanel />

      <main className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-bmw-mesh" aria-hidden="true" />

        <div className="relative flex w-full max-w-md flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <BmwRoundel className="h-12 w-12" />
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
                <MStripe className="h-4 w-8" />
                {APP_NAME}
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
