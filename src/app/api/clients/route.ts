import { NextRequest, NextResponse } from "next/server";
import { db, isDemo } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { 
  mockClients, mockUsers,
  enrichClients 
} from "@/lib/mock-data";

// GET - List all clients
export async function GET(request: NextRequest) {
  try {
    // Demo mode - return mock data
    if (isDemo) {
      const enrichedClients = enrichClients(mockClients, mockUsers);
      return NextResponse.json(enrichedClients);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};

    // Managers can only see their own clients
    if (user.role === "MANAGER") {
      where.ownerId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const clients = await db!.client.findMany({
      where,
      include: {
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
            deals: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Get clients error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  try {
    // Demo mode - return mock response
    if (isDemo) {
      const body = await request.json();
      const newClient = {
        id: `client-${Date.now()}`,
        ...body,
        status: body.status || "active",
        ownerId: "user-admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: mockUsers[0],
      };
      return NextResponse.json(newClient);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      position,
      address,
      notes,
      source,
      status = "active",
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const client = await db!.client.create({
      data: {
        name,
        email,
        phone,
        company,
        position,
        address,
        notes,
        source,
        status,
        ownerId: user.id,
      },
      include: {
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

    return NextResponse.json(client);
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
