import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/lib/organization-context";
import { EmptyState } from "@/components/empty-state";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AlertRule, NotificationChannel, Alert } from "@shared/schema";
import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  Check,
  CheckCircle,
  Clock,
  Webhook,
  Mail,
  MessageSquare,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const METRIC_TYPES = [
  { value: "cpu", label: "CPU Usage", icon: Cpu },
  { value: "memory", label: "Memory Usage", icon: MemoryStick },
  { value: "disk", label: "Disk Usage", icon: HardDrive },
  { value: "agent_status", label: "Agent Status", icon: Activity },
];

const CONDITIONS = [
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "eq", label: "Equal to" },
];

const SEVERITIES = [
  { value: "info", label: "Info", color: "bg-blue-500" },
  { value: "warning", label: "Warning", color: "bg-amber-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
];

const CHANNEL_TYPES = [
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "email", label: "Email", icon: Mail },
  { value: "slack", label: "Slack", icon: MessageSquare },
];

export default function Alerts() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("alerts");

  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleMetric, setNewRuleMetric] = useState("cpu");
  const [newRuleCondition, setNewRuleCondition] = useState("gt");
  const [newRuleThreshold, setNewRuleThreshold] = useState("80");
  const [newRuleSeverity, setNewRuleSeverity] = useState("warning");

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("webhook");
  const [newChannelConfig, setNewChannelConfig] = useState("");

  const { data: alertsList = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/alerts?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!currentOrg?.id,
    refetchInterval: 10000,
  });

  const { data: alertRules = [], isLoading: rulesLoading } = useQuery<AlertRule[]>({
    queryKey: ["/api/alert-rules", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/alert-rules?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch alert rules");
      return res.json();
    },
    enabled: !!currentOrg?.id,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<NotificationChannel[]>({
    queryKey: ["/api/notification-channels", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/notification-channels?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch channels");
      return res.json();
    },
    enabled: !!currentOrg?.id,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/alert-rules?orgId=${currentOrg?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules", currentOrg?.id] });
      setNewRuleName("");
      setNewRuleThreshold("80");
      toast({ title: "Success", description: "Alert rule created" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/alert-rules/${id}?orgId=${currentOrg?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules", currentOrg?.id] });
      toast({ title: "Success", description: "Alert rule deleted" });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/alert-rules/${id}?orgId=${currentOrg?.id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules", currentOrg?.id] });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/notification-channels?orgId=${currentOrg?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels", currentOrg?.id] });
      setNewChannelName("");
      setNewChannelConfig("");
      toast({ title: "Success", description: "Notification channel created" });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notification-channels/${id}?orgId=${currentOrg?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels", currentOrg?.id] });
      toast({ title: "Success", description: "Notification channel deleted" });
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/alerts/${id}/acknowledge?orgId=${currentOrg?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", currentOrg?.id] });
      toast({ title: "Success", description: "Alert acknowledged" });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/alerts/${id}/resolve?orgId=${currentOrg?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", currentOrg?.id] });
      toast({ title: "Success", description: "Alert resolved" });
    },
  });

  const handleAddRule = () => {
    if (!newRuleName.trim() || !currentOrg?.id) return;
    createRuleMutation.mutate({
      organizationId: currentOrg.id,
      name: newRuleName.trim(),
      metricType: newRuleMetric,
      condition: newRuleCondition,
      threshold: parseInt(newRuleThreshold, 10),
      severity: newRuleSeverity,
    });
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim() || !newChannelConfig.trim() || !currentOrg?.id) return;
    const config = newChannelType === "webhook" 
      ? { webhook_url: newChannelConfig }
      : newChannelType === "email"
      ? { email: newChannelConfig }
      : { slack_webhook: newChannelConfig };
    
    createChannelMutation.mutate({
      organizationId: currentOrg.id,
      name: newChannelName.trim(),
      type: newChannelType,
      config,
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="destructive">Active</Badge>;
      case "acknowledged": return <Badge variant="secondary">Acknowledged</Badge>;
      case "resolved": return <Badge variant="outline">Resolved</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!currentOrg) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Bell className="h-8 w-8 text-muted-foreground" />}
          title="Select an Organization"
          description="Choose an organization from the sidebar to view alerts."
        />
      </div>
    );
  }

  const activeAlerts = alertsList.filter(a => a.status === "active");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure alert rules and notification channels
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {activeAlerts.length} active
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2" data-testid="tab-alerts">
            <Bell className="h-4 w-4" />
            Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2" data-testid="tab-rules">
            <AlertTriangle className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2" data-testid="tab-channels">
            <Webhook className="h-4 w-4" />
            Channels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Recent alerts triggered by your rules</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts yet</p>
                  <p className="text-sm">Alerts will appear here when rules are triggered</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertsList.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          {alert.message && (
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        {alert.status === "active" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                              data-testid={`button-acknowledge-${alert.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                              data-testid={`button-resolve-${alert.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Alert Rule</CardTitle>
              <CardDescription>Define conditions that will trigger alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="e.g., High CPU Alert"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    data-testid="input-rule-name"
                  />
                </div>
                <div>
                  <Label>Metric</Label>
                  <Select value={newRuleMetric} onValueChange={setNewRuleMetric}>
                    <SelectTrigger data-testid="select-rule-metric">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_TYPES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={newRuleCondition} onValueChange={setNewRuleCondition}>
                    <SelectTrigger data-testid="select-rule-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Threshold (%)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    data-testid="input-rule-threshold"
                  />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={newRuleSeverity} onValueChange={setNewRuleSeverity}>
                    <SelectTrigger data-testid="select-rule-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddRule}
                disabled={!newRuleName.trim() || createRuleMutation.isPending}
                className="gap-1"
                data-testid="button-add-rule"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Rules</CardTitle>
              <CardDescription>Manage your alert rules</CardDescription>
            </CardHeader>
            <CardContent>
              {alertRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No alert rules configured</p>
                  <p className="text-sm">Create a rule above to start monitoring</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertRules.map((rule) => {
                    const metricInfo = METRIC_TYPES.find(m => m.value === rule.metricType);
                    const conditionInfo = CONDITIONS.find(c => c.value === rule.condition);
                    const severityInfo = SEVERITIES.find(s => s.value === rule.severity);
                    const MetricIcon = metricInfo?.icon || Activity;
                    
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        data-testid={`rule-${rule.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <MetricIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{rule.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {metricInfo?.label} {conditionInfo?.label.toLowerCase()} {rule.threshold}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary" 
                            className={severityInfo?.color + " text-white"}
                          >
                            {rule.severity}
                          </Badge>
                          <Switch
                            checked={rule.enabled ?? true}
                            onCheckedChange={(checked) => 
                              toggleRuleMutation.mutate({ id: rule.id, enabled: checked })
                            }
                            data-testid={`switch-rule-${rule.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            data-testid={`button-delete-rule-${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Notification Channel</CardTitle>
              <CardDescription>Configure where to send alert notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Channel Name</Label>
                  <Input
                    placeholder="e.g., Ops Team Slack"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    data-testid="input-channel-name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newChannelType} onValueChange={setNewChannelType}>
                    <SelectTrigger data-testid="select-channel-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <c.icon className="h-4 w-4" />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>
                    {newChannelType === "webhook" ? "Webhook URL" : 
                     newChannelType === "email" ? "Email Address" : "Slack Webhook URL"}
                  </Label>
                  <Input
                    placeholder={
                      newChannelType === "webhook" ? "https://example.com/webhook" :
                      newChannelType === "email" ? "team@example.com" :
                      "https://hooks.slack.com/..."
                    }
                    value={newChannelConfig}
                    onChange={(e) => setNewChannelConfig(e.target.value)}
                    data-testid="input-channel-config"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddChannel}
                disabled={!newChannelName.trim() || !newChannelConfig.trim() || createChannelMutation.isPending}
                className="gap-1"
                data-testid="button-add-channel"
              >
                <Plus className="h-4 w-4" />
                Add Channel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configured Channels</CardTitle>
              <CardDescription>Manage notification destinations</CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notification channels configured</p>
                  <p className="text-sm">Add a channel above to receive alert notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((channel) => {
                    const typeInfo = CHANNEL_TYPES.find(t => t.value === channel.type);
                    const ChannelIcon = typeInfo?.icon || Webhook;
                    const config = channel.config as Record<string, string>;
                    
                    return (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        data-testid={`channel-${channel.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <ChannelIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{channel.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {config.webhook_url || config.email || config.slack_webhook || "No config"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{channel.type}</Badge>
                          <Switch
                            checked={channel.enabled ?? true}
                            data-testid={`switch-channel-${channel.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteChannelMutation.mutate(channel.id)}
                            data-testid={`button-delete-channel-${channel.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
