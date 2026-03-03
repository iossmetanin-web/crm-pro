import { NextRequest, NextResponse } from "next/server";
import { db, isDemo } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { 
  mockDeals, mockClients, mockUsers,
  enrichDeals 
} from "@/lib/mock-data";

// GET - List all deals
export async function GET(request: NextRequest) {
  try {
    // Demo mode - return mock data
    if (isDemo) {
      const enrichedDeals = enrichDeals(mockDeals, mockClients, mockUsers);
      return NextResponse.json(enrichedDeals);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const clientId = searchParams.get("clientId");
    const minValue = searchParams.get("minValue");
    const maxValue = searchParams.get("maxValue");

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

    if (minValue || maxValue) {
      where.value = {};
      if (minValue) {
        where.value.gte = parseFloat(minValue);
      }
      if (maxValue) {
        where.value.lte = parseFloat(maxValue);
      }
    }

    const deals = await db!.deal.findMany({
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
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: [
        { stage: "asc" },
        { createdAt: "desc" },
      ],
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
    // Demo mode - return mock response
    if (isDemo) {
      const body = await request.json();
      const newDeal = {
        id: `deal-${Date.now()}`,
        ...body,
        stage: body.stage || "LEAD",
        probability: body.probability || 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: mockUsers[0],
        client: body.clientId ? mockClients.find(c => c.id === body.clientId) : undefined,
      };
      return NextResponse.json(newDeal);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      value,
      stage = "LEAD",
      probability = 10,
      expectedClose,
      clientId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 }
      );
    }

    const deal = await db!.deal.create({
      data: {
        title,
        description,
        value: parseFloat(value) || 0,
        stage,
        probability: parseInt(probability) || 0,
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
