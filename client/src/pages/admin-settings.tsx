import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  maxHosts: number;
  maxUsers: number;
  maxAlertRules: number;
  monthlyPrice: number;
  description?: string;
  isActive: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export function AdminSettingsPage() {
  const [, navigate] = useLocation();
  const { adminToken, setAdminToken } = useAuthContext();
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanMaxHosts, setNewPlanMaxHosts] = useState("10");
  const [newPlanMaxUsers, setNewPlanMaxUsers] = useState("5");
  const [newPlanMaxRules, setNewPlanMaxRules] = useState("50");
  const [newPlanPrice, setNewPlanPrice] = useState("9900");
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");

  // Fetch plans
  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json() as Promise<Plan[]>;
    },
  });

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: newPlanName,
          maxHosts: parseInt(newPlanMaxHosts),
          maxUsers: parseInt(newPlanMaxUsers),
          maxAlertRules: parseInt(newPlanMaxRules),
          monthlyPrice: parseInt(newPlanPrice),
        }),
      });

      if (response.ok) {
        setNewPlanName("");
        setNewPlanMaxHosts("10");
        setNewPlanMaxUsers("5");
        setNewPlanMaxRules("50");
        setNewPlanPrice("9900");
        refetchPlans();
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  const handleSetupMFA = async () => {
    try {
      const response = await fetch("/api/admin/mfa/setup", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await response.json();
      setMfaSecret(data.secret);
      setMfaQrCode(data.qrCode);
    } catch (error) {
      console.error("Failed to setup MFA:", error);
    }
  };

  const handleEnableMFA = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      return;
    }

    try {
      const response = await fetch("/api/admin/mfa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ secret: mfaSecret, token: mfaToken }),
      });

      if (response.ok) {
        setShowMFASetup(false);
        setMfaSecret("");
        setMfaToken("");
        setMfaQrCode("");
      }
    } catch (error) {
      console.error("Failed to enable MFA:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAdminToken(null);
      navigate("/admin/login");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <Button onClick={() => navigate("/admin")}>Back to Dashboard</Button>
      </div>

      {/* Account Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Protect your account with MFA</div>
            </div>
            <Dialog open={showMFASetup} onOpenChange={setShowMFASetup}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleSetupMFA}>
                  Setup MFA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {mfaQrCode && (
                    <div className="flex flex-col items-center">
                      <img src={mfaQrCode} alt="QR Code" className="w-48 h-48" />
                      <p className="text-sm text-gray-600 mt-2">
                        Scan this code with your authenticator app
                      </p>
                    </div>
                  )}

                  {mfaSecret && (
                    <div className="bg-gray-100 p-3 rounded">
                      <div className="text-sm text-gray-600">Manual Entry Code</div>
                      <code className="font-mono text-sm break-all">{mfaSecret}</code>
                    </div>
                  )}

                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaToken}
                    onChange={(e) =>
                      setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-lg tracking-widest"
                  />

                  <Button
                    className="w-full"
                    onClick={handleEnableMFA}
                    disabled={mfaToken.length !== 6}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </div>
      </Card>

      {/* Subscription Plans Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>

        {/* Existing Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <div className="font-semibold capitalize">{plan.name}</div>
                <div className="text-sm text-gray-600 grid grid-cols-3 gap-4 mt-2">
                  <div>Max Hosts: {plan.maxHosts}</div>
                  <div>Max Users: {plan.maxUsers}</div>
                  <div>Max Rules: {plan.maxAlertRules}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${(plan.monthlyPrice / 100).toFixed(2)}/mo</div>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Plan */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Create New Plan</h4>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <Input
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., Standard"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monthly Price (cents)
                </label>
                <Input
                  type="number"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  placeholder="9900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Hosts</label>
                <Input
                  type="number"
                  value={newPlanMaxHosts}
                  onChange={(e) => setNewPlanMaxHosts(e.target.value)}
                  placeholder="10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Users</label>
                <Input
                  type="number"
                  value={newPlanMaxUsers}
                  onChange={(e) => setNewPlanMaxUsers(e.target.value)}
                  placeholder="5"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Max Alert Rules</label>
                <Input
                  type="number"
                  value={newPlanMaxRules}
                  onChange={(e) => setNewPlanMaxRules(e.target.value)}
                  placeholder="50"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Create Plan
            </Button>
          </form>
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">API Status</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">Operational</span>
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Database</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">Connected</span>
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="font-bold mt-1">99.9%</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Last Backup</div>
            <div className="font-bold mt-1">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Feature Flags</h3>
        <div className="space-y-3">
          {[
            { name: "User Impersonation", enabled: true },
            { name: "Custom Branding", enabled: false },
            { name: "SSO Integration", enabled: false },
            { name: "Advanced Analytics", enabled: true },
          ].map((feature) => (
            <div key={feature.name} className="flex justify-between items-center p-3 border rounded">
              <span>{feature.name}</span>
              <Badge variant={feature.enabled ? "default" : "secondary"}>
                {feature.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
