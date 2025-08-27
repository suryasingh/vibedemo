"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  key?: string; // Only present when first created
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchApiKeys();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/keys");
      if (response.ok) {
        const keys = await response.json();
        setApiKeys(keys);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: ["read", "transact"],
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setNewKeyData(newKey);
        setApiKeys([newKey, ...apiKeys]);
        setNewKeyName("");
        setCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys?id=${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== keyId));
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Separator />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-7 h-7" />
            API Keys
          </h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access to your agent wallets
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to your wallets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="My API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={creating || !newKeyName.trim()}
                >
                  {creating ? "Creating..." : "Create Key"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* New Key Display */}
      {newKeyData && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              API Key Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Save this key securely - it won't be shown again
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-green-900 p-3 rounded border">
              <span className="flex-1">{newKeyData.key}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(newKeyData.key!)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setNewKeyData(null)}
            >
              I've saved this key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first API key to start integrating with your agent
              wallets programmatically
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <Badge
                        variant={apiKey.isActive ? "default" : "secondary"}
                      >
                        {apiKey.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {apiKey.keyPreview}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {formatDate(apiKey.createdAt)}</span>
                      {apiKey.lastUsedAt && (
                        <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {apiKey.permissions.map((permission) => (
                        <Badge
                          key={permission}
                          variant="outline"
                          className="text-xs"
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this API key? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteKey(apiKey.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
