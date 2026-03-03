import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Base filter for managers
    const ownerFilter = user.role === "MANAGER" ? { ownerId: user.id } : {};

    // Get task statistics
    const taskStats = await db.task.groupBy({
      by: ["status"],
      where: {
        ...ownerFilter,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const tasksByStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    
    taskStats.forEach((stat) => {
      tasksByStatus[stat.status] = stat._count;
    });

    // Get deal statistics
    const dealStats = await db.deal.groupBy({
      by: ["stage"],
      where: {
        ...ownerFilter,
        createdAt: { gte: startDate },
      },
      _sum: {
        value: true,
      },
      _count: true,
    });

    const dealsByStage = {
      LEAD: { count: 0, value: 0 },
      PROSPECT: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      CLOSED_WON: { count: 0, value: 0 },
      CLOSED_LOST: { count: 0, value: 0 },
    };

    dealStats.forEach((stat) => {
      dealsByStage[stat.stage] = {
        count: stat._count,
        value: stat._sum.value || 0,
      };
    });

    // Get client statistics
    const totalClients = await db.client.count({
      where: ownerFilter,
    });

    const newClients = await db.client.count({
      where: {
        ...ownerFilter,
        createdAt: { gte: startDate },
      },
    });

    // Get overdue tasks
    const overdueTasks = await db.task.count({
      where: {
        ...ownerFilter,
        status: { not: "DONE" },
        dueDate: { lt: now.toISOString() },
      },
    });

    // Get tasks due today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const tasksDueToday = await db.task.count({
      where: {
        ...ownerFilter,
        status: { not: "DONE" },
        dueDate: {
          gte: todayStart.toISOString(),
          lt: todayEnd.toISOString(),
        },
      },
    });

    // Calculate total pipeline value
    const pipelineValue = await db.deal.aggregate({
      where: {
        ...ownerFilter,
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
      },
      _sum: {
        value: true,
      },
    });

    // Calculate won deals value
    const wonDealsValue = await db.deal.aggregate({
      where: {
        ...ownerFilter,
        stage: "CLOSED_WON",
        createdAt: { gte: startDate },
      },
      _sum: {
        value: true,
      },
    });

    // Get recent activity (task logs)
    const recentActivity = await db.taskLog.findMany({
      where: {
        ...ownerFilter,
        createdAt: { gte: startDate },
      },
      include: {
        task: {
          select: { title: true },
        },
        user: {
          select: { name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get tasks by priority
    const tasksByPriority = await db.task.groupBy({
      by: ["priority"],
      where: {
        ...ownerFilter,
        status: { not: "DONE" },
      },
      _count: true,
    });

    const priorityStats = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    tasksByPriority.forEach((stat) => {
      priorityStats[stat.priority] = stat._count;
    });

    // Weekly task completion trend
    const weeklyTrend: { date: string; completed: number; created: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const completed = await db.task.count({
        where: {
          ...ownerFilter,
          completedAt: {
            gte: dayStart.toISOString(),
            lt: dayEnd.toISOString(),
          },
        },
      });

      const created = await db.task.count({
        where: {
          ...ownerFilter,
          createdAt: {
            gte: dayStart.toISOString(),
            lt: dayEnd.toISOString(),
          },
        },
      });

      weeklyTrend.push({
        date: dayStart.toISOString().split("T")[0],
        completed,
        created,
      });
    }

    return NextResponse.json({
      period,
      tasks: {
        byStatus: tasksByStatus,
        byPriority: priorityStats,
        overdue: overdueTasks,
        dueToday: tasksDueToday,
      },
      deals: {
        byStage: dealsByStage,
        pipelineValue: pipelineValue._sum.value || 0,
        wonValue: wonDealsValue._sum.value || 0,
      },
      clients: {
        total: totalClients,
        new: newClients,
      },
      weeklyTrend,
      recentActivity,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
