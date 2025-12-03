import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "unpaid" | "pending";
  dueDate: string;
}

interface BillingInfo {
  currentPlan: {
    name: string;
    monthlyPrice: number;
  };
  billingCycle: {
    startDate: string;
    endDate: string;
    daysRemaining: number;
  };
  invoices: Invoice[];
  totalSpend: number;
}

export function AdminTenantBillingPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();

  // Fetch billing info
  const { data: billing, isLoading } = useQuery({
    queryKey: [`admin-tenant-billing-${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${id}/billing`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch billing");
      return response.json() as Promise<BillingInfo>;
    },
    enabled: !!adminToken && !!id,
  });

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!billing) {
    return <div className="p-6">Billing information not available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-gray-600">Manage billing and subscription for this tenant</p>
        </div>
        <Button onClick={() => navigate(`/admin/tenants/${id}`)}>
          Back to Tenant
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Plan Name</label>
                  <p className="text-2xl font-bold capitalize">
                    {billing.currentPlan.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Monthly Price</label>
                  <p className="text-2xl font-bold">
                    ${billing.currentPlan.monthlyPrice / 100}/month
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Change Plan
                </Button>
              </CardContent>
            </Card>

            {/* Billing Cycle */}
            <Card>
              <CardHeader>
                <CardTitle>Current Billing Cycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Start Date</label>
                  <p className="text-lg font-semibold">
                    {new Date(billing.billingCycle.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">End Date</label>
                  <p className="text-lg font-semibold">
                    {new Date(billing.billingCycle.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Days Remaining</label>
                  <p className="text-lg font-semibold">
                    {billing.billingCycle.daysRemaining} days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Spend */}
          <Card>
            <CardHeader>
              <CardTitle>Total Spend (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                ${billing.totalSpend / 100}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {billing.invoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No invoices</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billing.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.id}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${invoice.amount / 100}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status]}>
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminTenantBillingPage;
