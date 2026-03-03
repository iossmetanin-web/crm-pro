"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Task, Deal, Client, User } from "@/stores/crm-store";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const { data: tasks, isLoading: tasksLoading } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: deals, isLoading: dealsLoading } = useSWR<Deal[]>("/api/deals", fetcher);
  const { data: clients, isLoading: clientsLoading } = useSWR<Client[]>("/api/clients", fetcher);

  const isLoading = tasksLoading || dealsLoading || clientsLoading;

  // Monthly deals data for chart
  const monthlyDealsData = useMemo(() => {
    if (!deals) return [];

    const months: { name: string; won: number; deals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthDeals = deals.filter((deal) => {
        if (!deal.createdAt) return false;
        const dealDate = parseISO(deal.createdAt);
        return isWithinInterval(dealDate, { start: monthStart, end: monthEnd });
      });

      const wonValue = monthDeals
        .filter((d) => d.stage === "CLOSED_WON")
        .reduce((sum, d) => sum + d.value, 0);

      months.push({
        name: format(date, "MMM"),
        won: wonValue,
        deals: monthDeals.length,
      });
    }

    return months;
  }, [deals]);

  // Tasks by status for pie chart
  const tasksByStatus = useMemo(() => {
    if (!tasks) return [];

    const statusCounts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    tasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace("_", " "),
      value,
    }));
  }, [tasks]);

  // Deals by stage for pie chart
  const dealsByStage = useMemo(() => {
    if (!deals) return [];

    const stageCounts: Record<string, number> = {};

    deals.forEach((deal) => {
      if (!stageCounts[deal.stage]) {
        stageCounts[deal.stage] = 0;
      }
      stageCounts[deal.stage]++;
    });

    return Object.entries(stageCounts).map(([name, value]) => ({
      name: name.replace("_", " "),
      value,
    }));
  }, [deals]);

  // KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!tasks || !deals || !clients) {
      return {
        totalRevenue: 0,
        activeDeals: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalClients: 0,
        activeClients: 0,
        winRate: 0,
        avgDealValue: 0,
      };
    }

    const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
    const lostDeals = deals.filter((d) => d.stage === "CLOSED_LOST");
    const activeDeals = deals.filter(
      (d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    const completedTasks = tasks.filter((t) => t.status === "DONE");
    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === "DONE") return false;
      return new Date(t.dueDate) < new Date();
    });

    const activeClients = clients.filter((c) => c.status === "active");

    const winRate =
      wonDeals.length + lostDeals.length > 0
        ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
        : 0;

    const avgDealValue =
      deals.length > 0
        ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length
        : 0;

    return {
      totalRevenue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      activeDeals: activeDeals.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalClients: clients.length,
      activeClients: activeClients.length,
      winRate,
      avgDealValue,
    };
  }, [tasks, deals, clients]);

  // Top performers (by completed tasks)
  const topPerformers = useMemo(() => {
    if (!tasks) return [];

    const performerCounts: Record<string, { name: string; completed: number; total: number }> = {};

    tasks.forEach((task) => {
      if (!task.owner) return;
      const ownerId = task.owner.id;

      if (!performerCounts[ownerId]) {
        performerCounts[ownerId] = {
          name: task.owner.name,
          completed: 0,
          total: 0,
        };
      }

      performerCounts[ownerId].total++;
      if (task.status === "DONE") {
        performerCounts[ownerId].completed++;
      }
    });

    return Object.values(performerCounts)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your team's performance and metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Total Revenue</p>
                <p className="text-3xl font-bold">
                  ${kpiMetrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Active Deals</p>
                <p className="text-3xl font-bold">{kpiMetrics.activeDeals}</p>
              </div>
              <Target className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Completed Tasks</p>
                <p className="text-3xl font-bold">{kpiMetrics.completedTasks}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Overdue Tasks</p>
                <p className="text-3xl font-bold">{kpiMetrics.overdueTasks}</p>
              </div>
              <AlertCircle className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiMetrics.totalClients}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiMetrics.winRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${kpiMetrics.avgDealValue.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Deal Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiMetrics.activeClients}</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDealsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="won" fill="#22c55e" name="Won Deals ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {tasksByStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deals Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deals by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              ) : (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.name}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : index === 2
                          ? "bg-orange-400"
                          : "bg-blue-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.completed} of {performer.total} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {performer.total > 0
                          ? ((performer.completed / performer.total) * 100).toFixed(0)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
