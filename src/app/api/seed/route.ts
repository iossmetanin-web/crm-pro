import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/config";
import { TaskStatus, TaskPriority, DealStage, UserRole } from "@prisma/client";

export async function POST() {
  try {
    // Check if already seeded
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: "Database already seeded. Delete existing data first." });
    }

    // Create admin user
    const adminPassword = await hashPassword("admin123");
    const admin = await db.user.create({
      data: {
        email: "admin@crm.com",
        name: "Admin User",
        password: adminPassword,
        role: UserRole.ADMIN,
        avatar: null,
      },
    });

    // Create 5 manager users
    const managerPassword = await hashPassword("manager123");
    const managers = await Promise.all([
      db.user.create({
        data: {
          email: "manager1@crm.com",
          name: "Sarah Johnson",
          password: managerPassword,
          role: UserRole.MANAGER,
        },
      }),
      db.user.create({
        data: {
          email: "manager2@crm.com",
          name: "Mike Wilson",
          password: managerPassword,
          role: UserRole.MANAGER,
        },
      }),
      db.user.create({
        data: {
          email: "manager3@crm.com",
          name: "Emily Davis",
          password: managerPassword,
          role: UserRole.MANAGER,
        },
      }),
      db.user.create({
        data: {
          email: "manager4@crm.com",
          name: "James Brown",
          password: managerPassword,
          role: UserRole.MANAGER,
        },
      }),
      db.user.create({
        data: {
          email: "manager5@crm.com",
          name: "Lisa Anderson",
          password: managerPassword,
          role: UserRole.MANAGER,
        },
      }),
    ]);

    const allUsers = [admin, ...managers];

    // Create sample clients
    const clients = await Promise.all([
      db.client.create({
        data: {
          name: "John Smith",
          email: "john@techcorp.com",
          phone: "+1 555-0101",
          company: "TechCorp Inc.",
          position: "CTO",
          address: "123 Tech Street, San Francisco, CA",
          notes: "Met at Tech Conference 2024",
          source: "Conference",
          status: "active",
          ownerId: admin.id,
        },
      }),
      db.client.create({
        data: {
          name: "Emily Johnson",
          email: "emily@startup.io",
          phone: "+1 555-0102",
          company: "StartupIO",
          position: "CEO",
          address: "456 Innovation Ave, Austin, TX",
          notes: "Referred by existing client",
          source: "Referral",
          status: "active",
          ownerId: managers[0].id,
        },
      }),
      db.client.create({
        data: {
          name: "Michael Brown",
          email: "michael@enterprise.com",
          phone: "+1 555-0103",
          company: "Enterprise Solutions",
          position: "VP of Sales",
          address: "789 Business Blvd, New York, NY",
          notes: "Cold outreach via LinkedIn",
          source: "LinkedIn",
          status: "active",
          ownerId: managers[1].id,
        },
      }),
      db.client.create({
        data: {
          name: "Lisa Wang",
          email: "lisa@digital.co",
          phone: "+1 555-0104",
          company: "Digital Co",
          position: "Product Manager",
          address: "321 Digital Drive, Seattle, WA",
          notes: "Website inquiry",
          source: "Website",
          status: "active",
          ownerId: managers[2].id,
        },
      }),
      db.client.create({
        data: {
          name: "David Garcia",
          email: "david@media.net",
          phone: "+1 555-0105",
          company: "Media Networks",
          position: "Director",
          address: "654 Media Lane, Los Angeles, CA",
          notes: "Partner recommendation",
          source: "Partner",
          status: "inactive",
          ownerId: managers[3].id,
        },
      }),
      db.client.create({
        data: {
          name: "Sarah Miller",
          email: "sarah@fintech.com",
          phone: "+1 555-0106",
          company: "FinTech Solutions",
          position: "CFO",
          address: "111 Finance Ave, Chicago, IL",
          notes: "Trade show lead",
          source: "Trade Show",
          status: "active",
          ownerId: managers[4].id,
        },
      }),
      db.client.create({
        data: {
          name: "Robert Chen",
          email: "robert@healthcare.org",
          phone: "+1 555-0107",
          company: "HealthCare Partners",
          position: "IT Director",
          address: "222 Medical Center Dr, Boston, MA",
          notes: "Webinar attendee",
          source: "Webinar",
          status: "active",
          ownerId: admin.id,
        },
      }),
      db.client.create({
        data: {
          name: "Amanda White",
          email: "amanda@retail.com",
          phone: "+1 555-0108",
          company: "Retail Plus",
          position: "Operations Manager",
          address: "333 Commerce St, Miami, FL",
          notes: "Referral from partner",
          source: "Referral",
          status: "active",
          ownerId: managers[0].id,
        },
      }),
    ]);

    // Create sample deals with various stages
    const deals = await Promise.all([
      db.deal.create({
        data: {
          title: "Enterprise License Deal",
          description: "Annual enterprise license for 500 users",
          value: 150000,
          stage: DealStage.PROPOSAL,
          probability: 60,
          expectedClose: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          clientId: clients[0].id,
          ownerId: admin.id,
        },
      }),
      db.deal.create({
        data: {
          title: "Startup Package",
          description: "Growth plan for early-stage startup",
          value: 25000,
          stage: DealStage.NEGOTIATION,
          probability: 80,
          expectedClose: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          clientId: clients[1].id,
          ownerId: managers[0].id,
        },
      }),
      db.deal.create({
        data: {
          title: "Consulting Services",
          description: "6-month consulting engagement",
          value: 75000,
          stage: DealStage.PROSPECT,
          probability: 30,
          expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          clientId: clients[2].id,
          ownerId: managers[1].id,
        },
      }),
      db.deal.create({
        data: {
          title: "API Integration",
          description: "Custom API integration project",
          value: 45000,
          stage: DealStage.LEAD,
          probability: 20,
          expectedClose: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          clientId: clients[3].id,
          ownerId: managers[2].id,
        },
      }),
      db.deal.create({
        data: {
          title: "Training Program",
          description: "Team training for new platform",
          value: 15000,
          stage: DealStage.CLOSED_WON,
          probability: 100,
          clientId: clients[4].id,
          ownerId: managers[3].id,
        },
      }),
      db.deal.create({
        data: {
          title: "Security Audit",
          description: "Comprehensive security assessment",
          value: 35000,
          stage: DealStage.NEGOTIATION,
          probability: 75,
          expectedClose: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          clientId: clients[5].id,
          ownerId: managers[4].id,
        },
      }),
      db.deal.create({
        data: {
          title: "Cloud Migration",
          description: "Full cloud infrastructure migration",
          value: 200000,
          stage: DealStage.PROPOSAL,
          probability: 50,
          expectedClose: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          clientId: clients[6].id,
          ownerId: admin.id,
        },
      }),
      db.deal.create({
        data: {
          title: "Support Contract",
          description: "Annual premium support",
          value: 18000,
          stage: DealStage.CLOSED_LOST,
          probability: 0,
          clientId: clients[7].id,
          ownerId: managers[0].id,
        },
      }),
      db.deal.create({
        data: {
          title: "Analytics Dashboard",
          description: "Custom analytics implementation",
          value: 55000,
          stage: DealStage.CLOSED_WON,
          probability: 100,
          clientId: clients[2].id,
          ownerId: managers[1].id,
        },
      }),
    ]);

    // Create sample tasks with various statuses and dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const tasks = await Promise.all([
      // Today's tasks
      db.task.create({
        data: {
          title: "Follow up with TechCorp",
          description: "Send proposal revision and schedule demo",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: today,
          clientId: clients[0].id,
          dealId: deals[0].id,
          ownerId: admin.id,
        },
      }),
      db.task.create({
        data: {
          title: "Technical discovery call",
          description: "Understand technical requirements for API integration",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: today,
          clientId: clients[3].id,
          dealId: deals[3].id,
          ownerId: managers[2].id,
        },
      }),
      // Overdue tasks
      db.task.create({
        data: {
          title: "Contract review with Legal",
          description: "Review contract terms before sending to client",
          status: TaskStatus.TODO,
          priority: TaskPriority.URGENT,
          dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          clientId: clients[1].id,
          dealId: deals[1].id,
          ownerId: managers[0].id,
        },
      }),
      db.task.create({
        data: {
          title: "Send pricing update",
          description: "Update client on new pricing structure",
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
          clientId: clients[5].id,
          ownerId: managers[4].id,
        },
      }),
      db.task.create({
        data: {
          title: "Prepare security report",
          description: "Generate Q3 security assessment report",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          clientId: clients[6].id,
          dealId: deals[6].id,
          ownerId: admin.id,
        },
      }),
      // Future tasks
      db.task.create({
        data: {
          title: "Prepare demo presentation",
          description: "Create customized demo for Enterprise Solutions",
          status: TaskStatus.IN_REVIEW,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          clientId: clients[2].id,
          ownerId: managers[1].id,
        },
      }),
      db.task.create({
        data: {
          title: "Update CRM documentation",
          description: "Add new features to user guide",
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          ownerId: managers[2].id,
        },
      }),
      db.task.create({
        data: {
          title: "Quarterly business review",
          description: "Prepare QBR presentation for Media Networks",
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
          clientId: clients[4].id,
          ownerId: managers[3].id,
        },
      }),
      // Completed tasks
      db.task.create({
        data: {
          title: "Client onboarding call",
          description: "Initial onboarding call with Digital Co",
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          completedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          clientId: clients[3].id,
          ownerId: managers[2].id,
        },
      }),
      db.task.create({
        data: {
          title: "Send thank you note",
          description: "Follow up after successful deal close",
          status: TaskStatus.DONE,
          priority: TaskPriority.LOW,
          dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          clientId: clients[4].id,
          dealId: deals[4].id,
          ownerId: managers[3].id,
        },
      }),
      db.task.create({
        data: {
          title: "Project kickoff meeting",
          description: "Kick off analytics dashboard project",
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          dueDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          clientId: clients[2].id,
          dealId: deals[8].id,
          ownerId: managers[1].id,
        },
      }),
    ]);

    // Create task logs for activity tracking
    await Promise.all([
      db.taskLog.create({
        data: {
          taskId: tasks[8].id,
          userId: managers[2].id,
          action: "completed",
          details: JSON.stringify({ notes: "Call went well, client is ready to proceed" }),
        },
      }),
      db.taskLog.create({
        data: {
          taskId: tasks[9].id,
          userId: managers[3].id,
          action: "completed",
          details: JSON.stringify({ notes: "Sent via email" }),
        },
      }),
      db.taskLog.create({
        data: {
          taskId: tasks[10].id,
          userId: managers[1].id,
          action: "completed",
          details: JSON.stringify({ notes: "Project started on time" }),
        },
      }),
      db.taskLog.create({
        data: {
          taskId: tasks[0].id,
          userId: admin.id,
          action: "created",
          details: JSON.stringify({ title: "Follow up with TechCorp" }),
        },
      }),
      db.taskLog.create({
        data: {
          taskId: tasks[1].id,
          userId: managers[2].id,
          action: "created",
          details: JSON.stringify({ title: "Technical discovery call" }),
        },
      }),
    ]);

    return NextResponse.json({
      message: "Database seeded successfully!",
      accounts: {
        admin: { email: "admin@crm.com", password: "admin123" },
        managers: managers.map((m, i) => ({
          email: `manager${i + 1}@crm.com`,
          password: "manager123",
          name: m.name,
        })),
      },
      stats: {
        users: allUsers.length,
        clients: clients.length,
        deals: deals.length,
        tasks: tasks.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to reset database
export async function DELETE() {
  try {
    // Delete all data in reverse order of dependencies
    await db.taskLog.deleteMany();
    await db.task.deleteMany();
    await db.deal.deleteMany();
    await db.client.deleteMany();
    await db.user.deleteMany();

    return NextResponse.json({ message: "Database cleared successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}
