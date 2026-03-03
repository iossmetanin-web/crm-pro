import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - List all tasks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const clientId = searchParams.get("clientId");
    const dealId = searchParams.get("dealId");
    const dueToday = searchParams.get("dueToday");
    const overdue = searchParams.get("overdue");

    const where: any = {};

    // Managers can only see their own tasks
    if (user.role === "MANAGER") {
      where.ownerId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (dealId) {
      where.dealId = dealId;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (dueToday === "true") {
      where.dueDate = {
        gte: todayStart.toISOString(),
        lt: todayEnd.toISOString(),
      };
    }

    if (overdue === "true") {
      where.dueDate = {
        lt: todayStart.toISOString(),
      };
      where.status = { not: "DONE" };
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        client: true,
        deal: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        subtasks: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            subtasks: true,
            logs: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = "TODO",
      priority = "MEDIUM",
      dueDate,
      clientId,
      dealId,
      parentId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId,
        dealId,
        parentId,
        ownerId: user.id,
      },
      include: {
        client: true,
        deal: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Create task log
    await db.taskLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: "created",
        details: JSON.stringify({ title }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
