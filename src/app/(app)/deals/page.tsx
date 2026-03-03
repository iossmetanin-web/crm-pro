"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Building,
  Trash2,
  Eye,
  Target,
} from "lucide-react";
import { Deal, Client } from "@/stores/crm-store";
import { format, parseISO } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const stageColors: Record<string, string> = {
  LEAD: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  PROSPECT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PROPOSAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  CLOSED_WON: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CLOSED_LOST: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const stages = [
  { id: "LEAD", label: "Lead", value: 10 },
  { id: "PROSPECT", label: "Prospect", value: 25 },
  { id: "PROPOSAL", label: "Proposal", value: 50 },
  { id: "NEGOTIATION", label: "Negotiation", value: 75 },
  { id: "CLOSED_WON", label: "Closed Won", value: 100 },
  { id: "CLOSED_LOST", label: "Closed Lost", value: 0 },
];

export default function DealsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    stage: "LEAD",
    probability: "10",
    expectedClose: "",
    clientId: "",
  });

  const { data: deals, isLoading } = useSWR<Deal[]>("/api/deals", fetcher);
  const { data: clients } = useSWR<Client[]>("/api/clients", fetcher);

  // Filter deals
  const filteredDeals = useMemo(() => {
    if (!deals) return [];

    return deals.filter((deal) => {
      const matchesSearch =
        debouncedSearch === "" ||
        deal.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        deal.client?.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [deals, debouncedSearch, stageFilter]);

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    if (!deals) return { total: 0, won: 0, lost: 0, pipeline: 0 };

    const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
    const lostDeals = deals.filter((d) => d.stage === "CLOSED_LOST");
    const activeDeals = deals.filter(
      (d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    return {
      total: deals.length,
      won: wonDeals.reduce((sum, d) => sum + d.value, 0),
      lost: lostDeals.reduce((sum, d) => sum + d.value, 0),
      pipeline: activeDeals.reduce((sum, d) => sum + d.value, 0),
    };
  }, [deals]);

  const handleCreateDeal = async () => {
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
          probability: parseInt(formData.probability) || 0,
          expectedClose: formData.expectedClose || null,
          clientId: formData.clientId || null,
        }),
      });

      if (response.ok) {
        mutate("/api/deals");
        setIsCreateOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create deal:", error);
    }
  };

  const handleUpdateDeal = async () => {
    if (!selectedDeal) return;

    try {
      const response = await fetch(`/api/deals/${selectedDeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
          probability: parseInt(formData.probability) || 0,
          expectedClose: formData.expectedClose || null,
        }),
      });

      if (response.ok) {
        mutate("/api/deals");
        setSelectedDeal(null);
        setIsViewOpen(false);
      }
    } catch (error) {
      console.error("Failed to update deal:", error);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    try {
      await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      mutate("/api/deals");
      setSelectedDeal(null);
      setIsViewOpen(false);
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  };

  const openDealDetails = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      value: deal.value.toString(),
      stage: deal.stage,
      probability: deal.probability.toString(),
      expectedClose: deal.expectedClose ? deal.expectedClose.split("T")[0] : "",
      clientId: deal.clientId || "",
    });
    setIsViewOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      value: "",
      stage: "LEAD",
      probability: "10",
      expectedClose: "",
      clientId: "",
    });
  };

  const handleStageChange = (stage: string) => {
    const stageData = stages.find((s) => s.id === stage);
    setFormData({
      ...formData,
      stage,
      probability: stageData?.value.toString() || formData.probability,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Pipeline Value</p>
                <p className="text-2xl font-bold">
                  ${pipelineStats.pipeline.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Won Deals</p>
                <p className="text-2xl font-bold">
                  ${pipelineStats.won.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Lost Deals</p>
                <p className="text-2xl font-bold">
                  ${pipelineStats.lost.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Total Deals</p>
                <p className="text-2xl font-bold">{pipelineStats.total}</p>
              </div>
              <DollarSign className="h-8 w-8 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="hidden sm:table-cell">Stage</TableHead>
                <TableHead className="hidden lg:table-cell">Expected Close</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No deals found</p>
                    <Button
                      variant="link"
                      onClick={() => { resetForm(); setIsCreateOpen(true); }}
                      className="mt-2"
                    >
                      Add your first deal
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDealDetails(deal)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-sm text-muted-foreground md:hidden">
                          {deal.client?.name || "No client"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {deal.client?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ${deal.value.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={stageColors[deal.stage]}>
                        {deal.stage.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {deal.expectedClose
                        ? format(parseISO(deal.expectedClose), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDealDetails(deal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeal(deal.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>Create a new deal in your pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Deal title"
              />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={formData.stage} onValueChange={handleStageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedClose">Expected Close</Label>
                <Input
                  id="expectedClose"
                  type="date"
                  value={formData.expectedClose}
                  onChange={(e) => setFormData({ ...formData, expectedClose: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deal description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeal} disabled={!formData.title}>
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Deal Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value ($)</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={formData.stage} onValueChange={handleStageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Probability (%)</Label>
                  <Input
                    type="number"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Close</Label>
                  <Input
                    type="date"
                    value={formData.expectedClose}
                    onChange={(e) => setFormData({ ...formData, expectedClose: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDeal(selectedDeal.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateDeal}>Save Changes</Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
