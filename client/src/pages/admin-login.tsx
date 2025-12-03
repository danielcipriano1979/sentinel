import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/hooks/useAuthContext";

interface MFAState {
  requiresMFA: boolean;
  email: string;
  password: string;
}

export function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { setAdminToken } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState<MFAState | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          mfaToken: mfa ? mfaToken : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.requiresMFA) {
        setMfa({ requiresMFA: true, email, password });
        setError("");
        return;
      }

      // Login successful
      setAdminToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">HostWatch Admin</h1>
          <p className="text-center text-gray-600 mt-2">Global Control Panel</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {!mfa ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
                <p className="font-medium text-blue-900">Two-Factor Authentication Required</p>
                <p className="text-blue-700 mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Authentication Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={loading}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || mfaToken.length !== 6}>
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMfa(null);
                  setMfaToken("");
                  setPassword("");
                }}
              >
                Back
              </Button>
            </>
          )}
        </form>

        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
          <p>Need to create an account?</p>
          <Button
            variant="link"
            className="text-blue-600"
            onClick={() => navigate("/admin/register")}
          >
            Register as Admin
          </Button>
        </div>
      </Card>
    </div>
  );
}
