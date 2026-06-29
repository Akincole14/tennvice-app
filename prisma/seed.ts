import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── Admin ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@tennvice.com" },
    update: {},
    create: {
      name: "Sarah Mitchell",
      email: "admin@tennvice.com",
      passwordHash: await hash("admin123"),
      role: "ADMIN",
      phone: "07700 900001",
    },
  });

  // ── Technicians ────────────────────────────────────────────────
  const tech1User = await prisma.user.upsert({
    where: { email: "dan.cooper@tennvice.com" },
    update: {},
    create: {
      name: "Dan Cooper",
      email: "dan.cooper@tennvice.com",
      passwordHash: await hash("tech123"),
      role: "TECHNICIAN",
      phone: "07700 900002",
    },
  });

  const tech2User = await prisma.user.upsert({
    where: { email: "priya.shah@tennvice.com" },
    update: {},
    create: {
      name: "Priya Shah",
      email: "priya.shah@tennvice.com",
      passwordHash: await hash("tech123"),
      role: "TECHNICIAN",
      phone: "07700 900003",
    },
  });

  const tech1 = await prisma.technician.upsert({
    where: { userId: tech1User.id },
    update: { address: "45 Stockwell Road, London, SW9 0JD" },
    create: {
      userId: tech1User.id,
      qualification: "City & Guilds Level 3 Plumbing & Heating",
      licenceNumber: "GAS-2041-DC",
      address: "45 Stockwell Road, London, SW9 0JD",
    },
  });

  const tech2 = await prisma.technician.upsert({
    where: { userId: tech2User.id },
    update: { address: "18 Mile End Road, London, E1 4TU" },
    create: {
      userId: tech2User.id,
      qualification: "NVQ Level 3 Electrical Installation",
      licenceNumber: "EIC-1893-PS",
      address: "18 Mile End Road, London, E1 4TU",
    },
  });

  // ── Customer 1 — Premium, 2 properties ────────────────────────
  const c1User = await prisma.user.upsert({
    where: { email: "james.okafor@email.com" },
    update: {},
    create: {
      name: "James Okafor",
      email: "james.okafor@email.com",
      passwordHash: await hash("customer123"),
      role: "CUSTOMER",
      phone: "07700 900010",
    },
  });

  const c1 = await prisma.customer.upsert({
    where: { userId: c1User.id },
    update: {},
    create: {
      userId: c1User.id,
      subscriptionTier: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      visitsPerYear: 4,
      emergencyCallouts: 2,
      discountPercent: 40,
    },
  });

  const c1p1 = await prisma.property.upsert({
    where: { id: "prop-c1-1" },
    update: {},
    create: {
      id: "prop-c1-1",
      customerId: c1.id,
      address: "14 Elmwood Avenue",
      postcode: "SW4 8LT",
      propertyType: "House",
      bedrooms: 4,
      notes: "Victorian terrace. Older boiler — monitor pressure.",
    },
  });

  const c1p2 = await prisma.property.upsert({
    where: { id: "prop-c1-2" },
    update: {},
    create: {
      id: "prop-c1-2",
      customerId: c1.id,
      address: "Flat 3, Harbour Point",
      postcode: "E14 9RQ",
      propertyType: "Flat",
      bedrooms: 2,
      notes: "Rental property. Tenant is Marcus, 07890 123456.",
    },
  });

  // ── Customer 2 — Plus ──────────────────────────────────────────
  const c2User = await prisma.user.upsert({
    where: { email: "amelia.brooks@email.com" },
    update: {},
    create: {
      name: "Amelia Brooks",
      email: "amelia.brooks@email.com",
      passwordHash: await hash("customer123"),
      role: "CUSTOMER",
      phone: "07700 900011",
    },
  });

  const c2 = await prisma.customer.upsert({
    where: { userId: c2User.id },
    update: {},
    create: {
      userId: c2User.id,
      subscriptionTier: "PLUS",
      subscriptionStatus: "ACTIVE",
      visitsPerYear: 4,
      emergencyCallouts: 0,
      discountPercent: 30,
    },
  });

  const c2p1 = await prisma.property.upsert({
    where: { id: "prop-c2-1" },
    update: {},
    create: {
      id: "prop-c2-1",
      customerId: c2.id,
      address: "7 Rosewood Close",
      postcode: "M21 0BN",
      propertyType: "Bungalow",
      bedrooms: 3,
    },
  });

  // ── Customer 3 — Standard ──────────────────────────────────────
  const c3User = await prisma.user.upsert({
    where: { email: "tom.nguyen@email.com" },
    update: {},
    create: {
      name: "Tom Nguyen",
      email: "tom.nguyen@email.com",
      passwordHash: await hash("customer123"),
      role: "CUSTOMER",
      phone: "07700 900012",
    },
  });

  const c3 = await prisma.customer.upsert({
    where: { userId: c3User.id },
    update: {},
    create: {
      userId: c3User.id,
      subscriptionTier: "STANDARD",
      subscriptionStatus: "ACTIVE",
      visitsPerYear: 2,
      emergencyCallouts: 0,
      discountPercent: 20,
    },
  });

  const c3p1 = await prisma.property.upsert({
    where: { id: "prop-c3-1" },
    update: {},
    create: {
      id: "prop-c3-1",
      customerId: c3.id,
      address: "22 Birchfield Road",
      postcode: "B20 3DH",
      propertyType: "House",
      bedrooms: 3,
    },
  });

  // ── Customer 4 — Basic (paused) ────────────────────────────────
  const c4User = await prisma.user.upsert({
    where: { email: "lisa.patel@email.com" },
    update: {},
    create: {
      name: "Lisa Patel",
      email: "lisa.patel@email.com",
      passwordHash: await hash("customer123"),
      role: "CUSTOMER",
      phone: "07700 900013",
    },
  });

  const c4 = await prisma.customer.upsert({
    where: { userId: c4User.id },
    update: {},
    create: {
      userId: c4User.id,
      subscriptionTier: "BASIC",
      subscriptionStatus: "PAUSED",
      visitsPerYear: 2,
      emergencyCallouts: 0,
      discountPercent: 20,
    },
  });

  await prisma.property.upsert({
    where: { id: "prop-c4-1" },
    update: {},
    create: {
      id: "prop-c4-1",
      customerId: c4.id,
      address: "9 Kingsland Street",
      postcode: "E8 2JP",
      propertyType: "Flat",
      bedrooms: 1,
    },
  });

  // ── Visits & Reports ───────────────────────────────────────────
  // Past completed visit — c1p1, signed report
  const v1 = await prisma.visit.upsert({
    where: { id: "visit-001" },
    update: {},
    create: {
      id: "visit-001",
      propertyId: c1p1.id,
      technicianId: tech1.id,
      scheduledAt: new Date("2026-02-14T09:00:00"),
      completedAt: new Date("2026-02-14T11:30:00"),
      status: "COMPLETED",
      type: "ROUTINE_BOTH",
      isEmergency: false,
    },
  });

  await prisma.report.upsert({
    where: { visitId: v1.id },
    update: {},
    create: {
      visitId: v1.id,
      pipesCheck: "PASS",
      heatingCheck: "PASS",
      waterPumpCheck: "PASS",
      cylinderCheck: "ADVISORY",
      cylinderNotes: "Mild limescale build-up on cylinder — recommend flush within 6 months.",
      pressureCheck: "PASS",
      leakageCheck: "PASS",
      electricalCheck: "PASS",
      usageAdviceGiven: true,
      boilerCheck: "ADVISORY",
      boilerNotes: "Boiler pressure sitting at upper limit. Advised customer to bleed radiators.",
      boilerServiced: false,
      systemFlushed: false,
      cylinderFlushed: false,
      overallNotes: "Property in good condition overall. Minor advisory items noted.",
      recommendations: "Schedule cylinder flush at next visit. Consider boiler service.",
      followUpRequired: true,
      signedByTechnician: true,
      signedAt: new Date("2026-02-14T11:45:00"),
    },
  });

  // Past completed visit — c1p1, unsigned report (shows in dashboard pending)
  const v2 = await prisma.visit.upsert({
    where: { id: "visit-002" },
    update: {},
    create: {
      id: "visit-002",
      propertyId: c1p1.id,
      technicianId: tech1.id,
      scheduledAt: new Date("2026-04-03T10:00:00"),
      completedAt: new Date("2026-04-03T12:00:00"),
      status: "COMPLETED",
      type: "BOILER_SERVICE",
      isEmergency: false,
    },
  });

  await prisma.report.upsert({
    where: { visitId: v2.id },
    update: {},
    create: {
      visitId: v2.id,
      pipesCheck: "PASS",
      heatingCheck: "PASS",
      waterPumpCheck: "PASS",
      cylinderCheck: "PASS",
      pressureCheck: "PASS",
      leakageCheck: "PASS",
      electricalCheck: "NOT_CHECKED",
      boilerCheck: "PASS",
      boilerNotes: "Full annual service completed. Filters cleaned, ignition tested.",
      boilerServiced: true,
      systemFlushed: true,
      cylinderFlushed: true,
      overallNotes: "All systems in excellent condition post-service.",
      followUpRequired: false,
      signedByTechnician: false, // pending signature
    },
  });

  // Past completed — c2p1
  const v3 = await prisma.visit.upsert({
    where: { id: "visit-003" },
    update: {},
    create: {
      id: "visit-003",
      propertyId: c2p1.id,
      technicianId: tech2.id,
      scheduledAt: new Date("2026-03-20T14:00:00"),
      completedAt: new Date("2026-03-20T16:00:00"),
      status: "COMPLETED",
      type: "ROUTINE_ELECTRICAL",
      isEmergency: false,
    },
  });

  await prisma.report.upsert({
    where: { visitId: v3.id },
    update: {},
    create: {
      visitId: v3.id,
      pipesCheck: "NOT_CHECKED",
      heatingCheck: "NOT_CHECKED",
      waterPumpCheck: "NOT_CHECKED",
      cylinderCheck: "NOT_CHECKED",
      pressureCheck: "NOT_CHECKED",
      leakageCheck: "NOT_CHECKED",
      electricalCheck: "ADVISORY",
      electricalNotes: "Sockets in kitchen showing signs of wear. Recommend replacement within 12 months.",
      usageAdviceGiven: true,
      boilerCheck: "NOT_CHECKED",
      overallNotes: "Electrical inspection completed. Kitchen sockets flagged as advisory.",
      recommendations: "Replace kitchen sockets at next visit.",
      followUpRequired: true,
      signedByTechnician: true,
      signedAt: new Date("2026-03-20T16:15:00"),
    },
  });

  // Past completed — c3p1 (unsigned)
  const v4 = await prisma.visit.upsert({
    where: { id: "visit-004" },
    update: {},
    create: {
      id: "visit-004",
      propertyId: c3p1.id,
      technicianId: tech1.id,
      scheduledAt: new Date("2026-04-28T09:30:00"),
      completedAt: new Date("2026-04-28T11:00:00"),
      status: "COMPLETED",
      type: "ROUTINE_PLUMBING",
      isEmergency: false,
    },
  });

  await prisma.report.upsert({
    where: { visitId: v4.id },
    update: {},
    create: {
      visitId: v4.id,
      pipesCheck: "FAIL",
      pipesNotes: "Minor leak detected under kitchen sink. Repaired on site with new washer.",
      heatingCheck: "PASS",
      waterPumpCheck: "PASS",
      cylinderCheck: "PASS",
      pressureCheck: "PASS",
      leakageCheck: "FAIL",
      leakageNotes: "Leak under kitchen sink — resolved during visit.",
      electricalCheck: "NOT_CHECKED",
      boilerCheck: "NOT_CHECKED",
      partsRequired: "Replacement washer (supplied)",
      overallNotes: "Leak found and fixed. All other plumbing checks pass.",
      followUpRequired: false,
      signedByTechnician: false,
    },
  });

  // Upcoming scheduled visits
  await prisma.visit.upsert({
    where: { id: "visit-005" },
    update: {},
    create: {
      id: "visit-005",
      propertyId: c1p2.id,
      technicianId: tech1.id,
      scheduledAt: new Date("2026-06-02T09:00:00"),
      status: "SCHEDULED",
      type: "ROUTINE_BOTH",
      isEmergency: false,
    },
  });

  await prisma.visit.upsert({
    where: { id: "visit-006" },
    update: {},
    create: {
      id: "visit-006",
      propertyId: c2p1.id,
      technicianId: tech2.id,
      scheduledAt: new Date("2026-06-10T13:00:00"),
      status: "SCHEDULED",
      type: "ROUTINE_BOTH",
      isEmergency: false,
    },
  });

  await prisma.visit.upsert({
    where: { id: "visit-007" },
    update: {},
    create: {
      id: "visit-007",
      propertyId: c3p1.id,
      technicianId: tech1.id,
      scheduledAt: new Date("2026-06-18T10:00:00"),
      status: "SCHEDULED",
      type: "ROUTINE_PLUMBING",
      isEmergency: false,
    },
  });

  await prisma.visit.upsert({
    where: { id: "visit-008" },
    update: {},
    create: {
      id: "visit-008",
      propertyId: c1p1.id,
      technicianId: tech2.id,
      scheduledAt: new Date("2026-06-25T11:00:00"),
      status: "SCHEDULED",
      type: "ROUTINE_ELECTRICAL",
      isEmergency: false,
    },
  });

  console.log("✅ Seed complete. Accounts:");
  console.log("   admin@tennvice.com          / admin123    (Admin)");
  console.log("   dan.cooper@tennvice.com     / tech123     (Technician)");
  console.log("   priya.shah@tennvice.com     / tech123     (Technician)");
  console.log("   james.okafor@email.com      / customer123 (Premium)");
  console.log("   amelia.brooks@email.com     / customer123 (Plus)");
  console.log("   tom.nguyen@email.com        / customer123 (Standard)");
  console.log("   lisa.patel@email.com        / customer123 (Basic, paused)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
