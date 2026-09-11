import {
  PrismaClient,
  Role,
  ItemType,
  ItemCategory,
  ItemStatus,
  MatchStatus,
  ContactRequestStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url && url.includes("pooler.supabase.com")) {
    try {
      const parsed = new URL(url);
      const match = parsed.username.match(/^postgres\.([a-zA-Z0-9]+)$/);
      if (match) {
        parsed.hostname = `db.${match[1]}.supabase.co`;
        parsed.username = "postgres";
        return new PrismaClient({
          datasources: {
            db: { url: parsed.toString() },
          },
        });
      }
    } catch {
      // Fallback
    }
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

const DEMO_EMAILS = [
  "admin@findback.test",
  "alice@findback.test",
  "bob@findback.test",
  "carol@findback.test",
  "david@findback.test",
];

async function main() {
  console.log("🌱 Starting FindBack database seeding...");

  // 1. Safe, targeted cleanup of existing demo data only.
  // Existing non-demo users and non-demo records are preserved completely untouched.
  console.log("🧹 Cleaning previous demo data for @findback.test accounts...");
  const existingDemoUsers = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true },
  });
  const demoUserIds = existingDemoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    const demoItems = await prisma.item.findMany({
      where: { userId: { in: demoUserIds } },
      select: { id: true },
    });
    const demoItemIds = demoItems.map((i) => i.id);

    // Delete dependent records
    if (demoItemIds.length > 0) {
      await prisma.match.deleteMany({
        where: {
          OR: [
            { lostItemId: { in: demoItemIds } },
            { foundItemId: { in: demoItemIds } },
          ],
        },
      });
    }

    await prisma.contactRequest.deleteMany({
      where: {
        OR: [
          { senderId: { in: demoUserIds } },
          { receiverId: { in: demoUserIds } },
          ...(demoItemIds.length > 0 ? [{ itemId: { in: demoItemIds } }] : []),
        ],
      },
    });

    await prisma.notification.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    if (demoItemIds.length > 0) {
      await prisma.item.deleteMany({
        where: { id: { in: demoItemIds } },
      });
    }

    await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });

    console.log(`✓ Cleaned previous data for ${demoUserIds.length} demo accounts.`);
  }

  // 2. Hash shared demo password
  const DEMO_PASSWORD = "DemoPassword123!";
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 3. Create 5 synthetic presentation-only accounts
  console.log("👤 Creating demo users...");
  const admin = await prisma.user.create({
    data: {
      name: "Campus Admin",
      email: "admin@findback.test",
      passwordHash,
      role: Role.ADMIN,
      phone: "+1 (555) 019-0001",
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice@findback.test",
      passwordHash,
      role: Role.USER,
      phone: "+1 (555) 019-0002",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@findback.test",
      passwordHash,
      role: Role.USER,
      phone: "+1 (555) 019-0003",
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol Martinez",
      email: "carol@findback.test",
      passwordHash,
      role: Role.USER,
      phone: "+1 (555) 019-0004",
    },
  });

  const david = await prisma.user.create({
    data: {
      name: "David Chen",
      email: "david@findback.test",
      passwordHash,
      role: Role.USER,
      phone: "+1 (555) 019-0005",
    },
  });

  console.log(`✓ Created 5 demo accounts (1 ADMIN, 4 USERs).`);

  // 4. Create 12 realistic campus lost & found items
  // Strict rules:
  // - Exactly 2 items are RECOVERED
  // - Exactly 2 items are MATCHED
  // - MATCHED items must NOT be counted as RECOVERED
  // - All items have imageUrl: null
  console.log("📦 Creating demo items...");
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Item 1: Alice - LOST - MATCHED
  const item1 = await prisma.item.create({
    data: {
      userId: alice.id,
      type: ItemType.LOST,
      name: "MacBook Air M2 13-inch (Space Gray)",
      category: ItemCategory.ELECTRONICS,
      description: "Left my 13-inch MacBook Air M2 in the campus main library silent study room on the 2nd floor. It has a distinctive GitHub Octocat sticker on the lower palm rest.",
      location: "Main Campus Library, 2nd Floor Study Room",
      city: "Seattle",
      date: new Date(now - 3 * DAY),
      additionalDetails: "Serial ends in 4X9L. Left in a dark gray neoprene sleeve.",
      identifyingCharacteristics: "GitHub Octocat vinyl sticker on lower right palm rest.",
      status: ItemStatus.MATCHED,
      imageUrl: null,
    },
  });

  // Item 2: Bob - FOUND - MATCHED
  const item2 = await prisma.item.create({
    data: {
      userId: bob.id,
      type: ItemType.FOUND,
      name: "Apple MacBook Air M2 Laptop",
      category: ItemCategory.ELECTRONICS,
      description: "Found an unattended space gray Apple MacBook Air M2 on study desk 14 in the library. Handed over to library reception desk.",
      location: "Main Campus Library Desk 14",
      city: "Seattle",
      date: new Date(now - 2 * DAY),
      additionalDetails: "Stored securely in campus library lost & found cabinet.",
      identifyingCharacteristics: "Space gray color with Octocat sticker on keyboard deck.",
      status: ItemStatus.MATCHED,
      imageUrl: null,
    },
  });

  // Item 3: Carol - LOST - RECOVERED
  const item3 = await prisma.item.create({
    data: {
      userId: carol.id,
      type: ItemType.LOST,
      name: "Honda Civic Car Key with Blue Campus Lanyard",
      category: ItemCategory.KEYS,
      description: "Black Honda remote key fob attached to a blue university lanyard with a mini silver carabiner.",
      location: "North Campus Parking Garage B",
      city: "Seattle",
      date: new Date(now - 5 * DAY),
      additionalDetails: "Successfully verified and returned by David Chen.",
      identifyingCharacteristics: "Slight scratch on the unlock button; university bookstore lanyard.",
      status: ItemStatus.RECOVERED,
      imageUrl: null,
    },
  });

  // Item 4: David - FOUND - RECOVERED
  const item4 = await prisma.item.create({
    data: {
      userId: david.id,
      type: ItemType.FOUND,
      name: "Honda Remote Key Fob on Blue Lanyard",
      category: ItemCategory.KEYS,
      description: "Found Honda car key fob on the ground near parking garage B entrance stairs.",
      location: "North Parking Garage B Entrance",
      city: "Seattle",
      date: new Date(now - 4 * DAY),
      additionalDetails: "Returned to verified owner Carol Martinez.",
      identifyingCharacteristics: "Blue university lanyard with silver clip.",
      status: ItemStatus.RECOVERED,
      imageUrl: null,
    },
  });

  // Item 5: Alice - LOST - ACTIVE
  const item5 = await prisma.item.create({
    data: {
      userId: alice.id,
      type: ItemType.LOST,
      name: "Brown Leather Bi-Fold Wallet",
      category: ItemCategory.WALLET,
      description: "Fossil brown leather wallet containing student ID card and driver's license.",
      location: "Student Union Cafeteria",
      city: "Seattle",
      date: new Date(now - 1 * DAY),
      additionalDetails: "Name on student ID is Alice Johnson.",
      identifyingCharacteristics: "Embossed initials AJ on inside flap.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 6: Bob - FOUND - ACTIVE
  const item6 = await prisma.item.create({
    data: {
      userId: bob.id,
      type: ItemType.FOUND,
      name: "Sony WH-1000XM4 Wireless Headphones",
      category: ItemCategory.ELECTRONICS,
      description: "Black Sony over-ear noise-cancelling headphones found inside black zipper carry case on gym bleachers.",
      location: "Campus Recreation Center Gymnasium",
      city: "Seattle",
      date: new Date(now - 1 * DAY),
      additionalDetails: "Case includes audio cable and airline adapter.",
      identifyingCharacteristics: "Initials scratched faintly inside headband.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 7: Carol - LOST - ACTIVE
  const item7 = await prisma.item.create({
    data: {
      userId: carol.id,
      type: ItemType.LOST,
      name: "Hydro Flask 32oz Wide Mouth Water Bottle",
      category: ItemCategory.ACCESSORIES,
      description: "Pacific blue Hydro Flask bottle with flex cap and national park stickers.",
      location: "Engineering Building Room 302",
      city: "Seattle",
      date: new Date(now - 2 * DAY),
      additionalDetails: "Has a yellow silicone protective boot on bottom.",
      identifyingCharacteristics: "Yellowstone and Yosemite national park vinyl stickers.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 8: David - FOUND - ACTIVE
  const item8 = await prisma.item.create({
    data: {
      userId: david.id,
      type: ItemType.FOUND,
      name: "Black North Face Surge Backpack",
      category: ItemCategory.BAGS,
      description: "Found black backpack on bench outside the campus bookstore. Contains spiral notebooks and stationery.",
      location: "University Bookstore Plaza",
      city: "Seattle",
      date: new Date(now - 2 * DAY),
      additionalDetails: "Deposited at campus safety dispatch.",
      identifyingCharacteristics: "Red paracord zipper pulls on the main compartment.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 9: Alice - LOST - ACTIVE
  const item9 = await prisma.item.create({
    data: {
      userId: alice.id,
      type: ItemType.LOST,
      name: "Ray-Ban Classic Aviator Sunglasses",
      category: ItemCategory.ACCESSORIES,
      description: "Gold frame Ray-Ban sunglasses with green G-15 lenses in tan leather case.",
      location: "Campus Quad Lawn",
      city: "Seattle",
      date: new Date(now - 3 * DAY),
      additionalDetails: "Lost during afternoon study group on the lawn.",
      identifyingCharacteristics: "Subtle RB etching on left lens.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 10: Bob - FOUND - ACTIVE
  const item10 = await prisma.item.create({
    data: {
      userId: bob.id,
      type: ItemType.FOUND,
      name: "Organic Chemistry 9th Edition Hardcover",
      category: ItemCategory.BOOKS,
      description: "Vollhardt Organic Chemistry textbook found under lecture hall seat in Chemistry Hall 101.",
      location: "Chemistry Hall Auditorium 101",
      city: "Seattle",
      date: new Date(now - 4 * DAY),
      additionalDetails: "Highlighted chapters 4 through 7.",
      identifyingCharacteristics: "Pink sticky notes bookmarking reaction mechanisms.",
      status: ItemStatus.ACTIVE,
      imageUrl: null,
    },
  });

  // Item 11: Carol - LOST - CLOSED
  const item11 = await prisma.item.create({
    data: {
      userId: carol.id,
      type: ItemType.LOST,
      name: "Texas Instruments TI-84 Plus CE Calculator",
      category: ItemCategory.ELECTRONICS,
      description: "Mint green graphing calculator left after calculus midterm.",
      location: "Mathematics Building Room 115",
      city: "Seattle",
      date: new Date(now - 10 * DAY),
      additionalDetails: "Search closed; replaced with personal device.",
      identifyingCharacteristics: "White slide cover with formula notes.",
      status: ItemStatus.CLOSED,
      imageUrl: null,
    },
  });

  // Item 12: David - FOUND - CLOSED
  const item12 = await prisma.item.create({
    data: {
      userId: david.id,
      type: ItemType.FOUND,
      name: "Navy Blue Windproof Compact Umbrella",
      category: ItemCategory.OTHER,
      description: "Automatic open/close folding umbrella left by the entrance umbrella stand.",
      location: "Alumni Hall Main Lobby",
      city: "Seattle",
      date: new Date(now - 14 * DAY),
      additionalDetails: "Holding period expired per campus lost & found policy.",
      identifyingCharacteristics: "Wooden curved hook handle.",
      status: ItemStatus.CLOSED,
      imageUrl: null,
    },
  });

  console.log(`✓ Created 12 items (6 ACTIVE, 2 MATCHED, 2 RECOVERED, 2 CLOSED).`);

  // 5. Create Matches
  console.log("🔗 Creating demo matches...");
  const match1 = await prisma.match.create({
    data: {
      lostItemId: item1.id,
      foundItemId: item2.id,
      score: 84.5,
      status: MatchStatus.PENDING,
    },
  });

  const match2 = await prisma.match.create({
    data: {
      lostItemId: item3.id,
      foundItemId: item4.id,
      score: 89.0,
      status: MatchStatus.ACCEPTED,
    },
  });
  console.log(`✓ Created 2 matches (1 PENDING @ 84.5%, 1 ACCEPTED @ 89.0%).`);

  // 6. Create Contact Requests
  console.log("✉️ Creating demo contact requests...");
  const request1 = await prisma.contactRequest.create({
    data: {
      senderId: bob.id,
      receiverId: alice.id,
      itemId: item1.id,
      message: "Hi Alice, I found an Apple MacBook Air M2 at the library matching your description. It is currently at the library circulation desk. Let me know if it is yours!",
      status: ContactRequestStatus.PENDING,
    },
  });

  const request2 = await prisma.contactRequest.create({
    data: {
      senderId: carol.id,
      receiverId: david.id,
      itemId: item4.id,
      message: "Hello David, thank you so much! Those are my Honda keys on the blue campus lanyard. I can show the spare key and student ID to confirm.",
      status: ContactRequestStatus.ACCEPTED,
    },
  });
  console.log(`✓ Created 2 contact requests (1 PENDING, 1 ACCEPTED).`);

  // 7. Create In-App Notifications
  console.log("🔔 Creating demo notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        title: "Potential Match Found",
        message: "A found item 'Apple MacBook Air M2 Laptop' matches your lost item with 84.5% confidence.",
        read: false,
      },
      {
        userId: alice.id,
        title: "New Contact Request",
        message: "Bob Smith sent you a contact request regarding 'MacBook Air M2 13-inch (Space Gray)'.",
        read: false,
      },
      {
        userId: carol.id,
        title: "Contact Request Accepted",
        message: "David Chen accepted your contact request for 'Honda Remote Key Fob on Blue Lanyard'.",
        read: true,
      },
      {
        userId: bob.id,
        title: "Welcome to FindBack",
        message: "Your campus account is ready. Report lost items or search found items anytime.",
        read: true,
      },
    ],
  });
  console.log(`✓ Created 4 in-app notifications (2 unread, 2 read).`);

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

