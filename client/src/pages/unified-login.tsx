import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useAuthContext } from "@/hooks/useAuthContext";

export function UnifiedLoginPage() {
  const [, navigate] = useLocation();
  const { setUser, setToken, setOrganization } = useUser();
  const { setAdminToken } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTenantRequest, setShowTenantRequest] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is an admin user
        if (data.isAdmin) {
          setError("Admin users must use the admin login page");
          setTimeout(() => navigate("/admin/login"), 2000);
          return;
        }
        setError(data.error || "Login failed");
        return;
      }

      if (data.status === "no_tenant") {
        // User has no organization - show tenant request screen
        setUserEmail(data.email);
        setShowTenantRequest(true);
        return;
      }

      if (data.status === "authenticated") {
        // Login successful - set user and organization
        setToken(data.token);
        setUser(data.user);
        setOrganization(data.organization);

        // Redirect based on role
        if (data.user.role === "owner" || data.user.role === "admin") {
          navigate("/organization-members");
        } else if (data.user.role === "viewer") {
          navigate("/dashboard?readonly=true");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = () => {
    navigate("/register");
  };

  if (showTenantRequest) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Logo/Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="mb-8">
              <img
                src="/favicon.png"
                alt="HostWatch"
                className="w-24 h-24 mx-auto mb-4 rounded-lg"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4">HostWatch</h1>
            <p className="text-xl text-blue-100">Global Monitoring Platform</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-center mb-2">Welcome</h2>
              <p className="text-center text-gray-600">
                You don't have an organization yet
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Get Started</p>
                  <p>
                    Create a new organization to start monitoring your hosts and
                    systems.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleCreateTenant}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Create New Organization
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowTenantRequest(false);
                  setEmail("");
                  setPassword("");
                  setError("");
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Try Another Account
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Are you a system administrator?
              </p>
              <button
                className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
                onClick={() => navigate("/admin/login")}
              >
                Go to Admin Panel
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="mb-8">
            <img
              src="/favicon.png"
              alt="HostWatch"
              className="w-24 h-24 mx-auto mb-4 rounded-lg"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4">HostWatch</h1>
          <p className="text-xl text-blue-100">Global Monitoring Platform</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center">Welcome Back</h1>
            <p className="text-center text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don't have an account?
            </p>
            <Button
              onClick={() => navigate("/register")}
              variant="outline"
              className="w-full"
            >
              Create New Organization
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Are you a system administrator?
            </p>
            <button
              className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
              onClick={() => navigate("/admin/login")}
            >
              Go to Admin Panel
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
