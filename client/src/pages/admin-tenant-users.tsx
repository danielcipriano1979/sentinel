import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Trash2, Edit2 } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "deactivated";
  createdAt: string;
}

export function AdminTenantUsersPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const queryClient = useQueryClient();

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "member" | "viewer">("member");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [editingRole, setEditingRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch tenant users
  const { data: users = [], isLoading } = useQuery({
    queryKey: [`admin-tenant-users-${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${id}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data.users || [];
    },
    enabled: !!adminToken && !!id,
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/tenants/${id}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add user");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("User added successfully");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("member");
      setShowAddUser(false);
      queryClient.invalidateQueries({
        queryKey: [`admin-tenant-users-${id}`],
      });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser || !editingRole) return;

      const response = await fetch(
        `/api/admin/tenants/${id}/users/${editingUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ role: editingRole }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("User role updated");
      setEditingUser(null);
      queryClient.invalidateQueries({
        queryKey: [`admin-tenant-users-${id}`],
      });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Deactivate/Activate user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (user: TenantUser) => {
      const response = await fetch(
        `/api/admin/tenants/${id}/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: user.status === "active" ? "deactivated" : "active",
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user status");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("User status updated");
      queryClient.invalidateQueries({
        queryKey: [`admin-tenant-users-${id}`],
      });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/admin/tenants/${id}/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("User deleted");
      queryClient.invalidateQueries({
        queryKey: [`admin-tenant-users-${id}`],
      });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const roleColors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    member: "bg-green-100 text-green-800",
    viewer: "bg-gray-100 text-gray-800",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    deactivated: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Users</h1>
          <p className="text-gray-600">Manage users and permissions for this tenant</p>
        </div>
        <Button onClick={() => navigate(`/admin/tenants/${id}`)}>
          Back to Tenant
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add User Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button>+ Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User to Tenant</DialogTitle>
                <DialogDescription>
                  Create a new user account for this tenant
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Temporary password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    User should change this on first login
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddUser(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addUserMutation.mutate()}
                    disabled={addUserMutation.isPending || !newUserEmail || !newUserPassword}
                  >
                    {addUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: TenantUser) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Badge
                            className={`${roleColors[user.role]} cursor-pointer`}
                            onClick={() => {
                              setEditingUser(user);
                              setEditingRole(user.role);
                            }}
                          >
                            {user.role}
                          </Badge>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Role</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">
                                {user.firstName} {user.lastName} ({user.email})
                              </label>
                              <Select
                                value={editingRole}
                                onValueChange={setEditingRole}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                              <Button variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => updateRoleMutation.mutate()}
                                disabled={updateRoleMutation.isPending || editingRole === user.role}
                              >
                                {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status]}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleUserStatusMutation.mutate(user)
                        }
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete user ${user.email}? This cannot be undone.`
                            )
                          ) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminTenantUsersPage;
