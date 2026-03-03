import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - List all deals
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const clientId = searchParams.get("clientId");

    const where: any = {};

    // Managers can only see their own deals
    if (user.role === "MANAGER") {
      where.ownerId = user.id;
    }

    if (stage) {
      where.stage = stage;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const deals = await db.deal.findMany({
      where,
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Get deals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new deal
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
      value = 0,
      stage = "LEAD",
      probability = 0,
      expectedClose,
      clientId,
    } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: "Title and client are required" },
        { status: 400 }
      );
    }

    const deal = await db.deal.create({
      data: {
        title,
        description,
        value,
        stage,
        probability,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        clientId,
        ownerId: user.id,
      },
      include: {
        client: true,
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

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Create deal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
