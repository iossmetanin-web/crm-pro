"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Building,
} from "lucide-react";
import { Task, Client, Deal } from "@/stores/crm-store";
import { format, parseISO, isToday, isPast, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const priorityColors = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_REVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function TodayPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: new Date().toISOString().split("T")[0],
    clientId: "",
    dealId: "",
  });

  const { data: tasks, isLoading: tasksLoading } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: clients } = useSWR<Client[]>("/api/clients", fetcher);
  const { data: deals } = useSWR<Deal[]>("/api/deals", fetcher);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    if (!tasks) return { today: [], overdue: [], completed: 0, total: 0 };
    
    const todayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isToday(parseISO(task.dueDate));
    });

    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.status === "DONE") return false;
      return isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
    });

    const completedTasks = tasks.filter((task) => task.status === "DONE");

    return {
      today: todayTasks,
      overdue: overdueTasks,
      completed: completedTasks.length,
      total: tasks.length,
    };
  }, [tasks]);

  // Calculate deal statistics
  const dealStats = useMemo(() => {
    if (!deals) return { total: 0, won: 0, inProgress: 0, totalValue: 0 };
    
    const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
    const inProgressDeals = deals.filter(
      (d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    return {
      total: deals.length,
      won: wonDeals.length,
      inProgress: inProgressDeals.length,
      totalValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
    };
  }, [deals]);

  const handleCreateTask = async () => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
          clientId: formData.clientId || null,
          dealId: formData.dealId || null,
        }),
      });

      if (response.ok) {
        mutate("/api/tasks");
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: new Date().toISOString().split("T")[0],
          clientId: "",
          dealId: "",
        });
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      mutate("/api/tasks");
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (tasksLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Today's Tasks</CardTitle>
            <Calendar className="h-5 w-5 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.today.length}</div>
            <p className="text-xs opacity-75 mt-1">tasks due today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Overdue</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.overdue.length}</div>
            <p className="text-xs opacity-75 mt-1">tasks need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.completed}</div>
            <p className="text-xs opacity-75 mt-1">of {taskStats.total} total tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Active Deals</CardTitle>
            <DollarSign className="h-5 w-5 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dealStats.inProgress}</div>
            <p className="text-xs opacity-75 mt-1">
              ${dealStats.totalValue.toLocaleString()} closed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Tasks */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Overdue Tasks
              {taskStats.overdue.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {taskStats.overdue.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {taskStats.overdue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No overdue tasks!</p>
              </div>
            ) : (
              taskStats.overdue.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
                >
                  <button
                    onClick={() => handleTaskStatusChange(task.id, "DONE")}
                    className="mt-0.5 h-5 w-5 rounded-full border-2 border-red-400 hover:bg-red-100 dark:hover:bg-red-900 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Due: {format(parseISO(task.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/tasks`}>
                    <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Today's Tasks
              {taskStats.today.length > 0 && (
                <Badge className="ml-auto">{taskStats.today.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {taskStats.today.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tasks for today</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Create one
                </Button>
              </div>
            ) : (
              taskStats.today.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <button
                    onClick={() => handleTaskStatusChange(task.id, "DONE")}
                    className="mt-0.5 h-5 w-5 rounded-full border-2 border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${task.status === "DONE" ? "line-through opacity-50" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={statusColors[task.status]}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      {task.client && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.client.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/tasks">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <Clock className="h-5 w-5" />
                <span className="text-xs">View Tasks</span>
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <Users className="h-5 w-5" />
                <span className="text-xs">Clients</span>
              </Button>
            </Link>
            <Link href="/deals">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-xs">Deals</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your board</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!formData.title}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
