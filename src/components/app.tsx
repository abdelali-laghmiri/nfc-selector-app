import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/login-screen";
import { SelectionScreen } from "@/components/selection-screen";

export function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <LoginScreen
        onLogin={auth.login}
        error={auth.error}
        isLoading={auth.isLoading}
      />
    );
  }

  return <SelectionScreen user={auth.user} onLogout={auth.logout} />;
}
