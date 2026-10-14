import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AuthBrandPanel />

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="flex w-full max-w-md flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <BmwRoundel className="h-12 w-12" />
            <div>
              <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
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
