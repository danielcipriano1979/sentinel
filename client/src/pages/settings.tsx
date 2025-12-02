import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/lib/organization-context";
import { useTheme } from "@/lib/theme-provider";
import { EmptyState } from "@/components/empty-state";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CustomField } from "@shared/schema";
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Palette,
  Bell,
  Key,
  Users,
  Moon,
  Sun,
  Monitor,
  Copy,
  ExternalLink,
  Tags,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { currentOrg } = useOrganization();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  const { data: customFields = [], isLoading: fieldsLoading } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/custom-fields?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
    enabled: !!currentOrg?.id,
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: { name: string; fieldType: string }) => {
      return apiRequest("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, organizationId: currentOrg?.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      setNewFieldName("");
      setNewFieldType("text");
      toast({ title: "Success", description: "Custom field created" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/custom-fields/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({ title: "Success", description: "Custom field deleted" });
    },
  });

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    createFieldMutation.mutate({ name: newFieldName.trim(), fieldType: newFieldType });
  };

  if (!currentOrg) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<SettingsIcon className="h-8 w-8 text-muted-foreground" />}
          title="Select an Organization"
          description="Choose an organization from the sidebar to view settings."
        />
      </div>
    );
  }

  const copyOrgId = () => {
    navigator.clipboard.writeText(currentOrg.id);
    toast({
      title: "Copied!",
      description: "Organization ID copied to clipboard",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your organization and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Organization</CardTitle>
                <CardDescription>
                  Manage your organization details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Organization Name</p>
                <p className="text-sm text-muted-foreground">
                  The display name for your organization
                </p>
              </div>
              <span className="font-medium">{currentOrg.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium">Slug</p>
                <p className="text-sm text-muted-foreground">
                  URL-friendly identifier
                </p>
              </div>
              <Badge variant="secondary" className="font-mono">
                {currentOrg.slug}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium">Organization ID</p>
                <p className="text-sm text-muted-foreground">
                  Unique identifier for API access
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {currentOrg.id.slice(0, 8)}...
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyOrgId}
                  data-testid="button-copy-org-id"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="flex items-center gap-2 p-1 rounded-lg border">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    theme === "light" && "bg-muted"
                  )}
                  onClick={() => setTheme("light")}
                  data-testid="button-theme-light"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    theme === "dark" && "bg-muted"
                  )}
                  onClick={() => setTheme("dark")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    theme === "system" && "bg-muted"
                  )}
                  onClick={() => setTheme("system")}
                  data-testid="button-theme-system"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Agent Configuration</CardTitle>
                <CardDescription>
                  Setup instructions for monitoring agents
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">
                Agent Endpoint
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background px-3 py-2 rounded border font-mono overflow-x-auto">
                  POST /api/agent/heartbeat
                </code>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Docs
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure your agent to send heartbeats to this endpoint with your
              organization ID to start monitoring hosts.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-custom-fields">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Tags className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Custom Fields</CardTitle>
                <CardDescription>
                  Define custom metadata fields for your hosts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Field name (e.g., Environment)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1"
                data-testid="input-custom-field-name"
              />
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger className="w-32" data-testid="select-custom-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddField}
                disabled={!newFieldName.trim() || createFieldMutation.isPending}
                className="gap-1"
                data-testid="button-add-custom-field"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {customFields.length > 0 ? (
              <div className="space-y-2 pt-2 border-t">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                    data-testid={`custom-field-${field.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{field.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {field.fieldType}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteFieldMutation.mutate(field.id)}
                      disabled={deleteFieldMutation.isPending}
                      data-testid={`button-delete-field-${field.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                No custom fields defined. Add fields to track additional host metadata.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Notifications
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Configure alert notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up email, Slack, and webhook notifications for alerts and
                status changes.
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Team Members
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Manage team access
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invite team members and manage their roles and permissions within
                your organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
