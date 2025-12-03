import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { RegisterForm } from '@/components/RegisterForm';
import { useUser } from '@/hooks/useUser';

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { setUser, setToken, setOrganization } = useUser();

  const handleRegisterSuccess = (user: any, organization: any, token: string) => {
    setToken(token);
    setUser(user);
    setOrganization(organization);

    // Auto-login successful, redirect to dashboard
    navigate('/dashboard');
  };

  const handleRegisterError = (err: string) => {
    // Error is displayed in the RegisterForm component
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onError={handleRegisterError}
        />
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?
          </p>
          <button
            className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
            onClick={() => navigate('/login')}
          >
            Sign in instead
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
