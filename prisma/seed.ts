import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CITY DATA & ROUTE DEFINITIONS
// ---------------------------------------------------------------------------

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Chandigarh", "Goa", "Kochi", "Bhopal", "Patna",
];

// Approx travel hours between city pairs (one-way, realistic by rail)
const DISTANCE_MAP: Record<string, number> = {
  "Mumbai-Delhi": 16, "Mumbai-Bangalore": 14, "Mumbai-Chennai": 20,
  "Mumbai-Kolkata": 26, "Mumbai-Hyderabad": 12, "Mumbai-Pune": 3,
  "Mumbai-Ahmedabad": 7, "Mumbai-Jaipur": 14, "Mumbai-Lucknow": 18,
  "Mumbai-Chandigarh": 22, "Mumbai-Goa": 9, "Mumbai-Kochi": 18,
  "Mumbai-Bhopal": 12, "Mumbai-Patna": 24,
  "Delhi-Bangalore": 33, "Delhi-Chennai": 28, "Delhi-Kolkata": 17,
  "Delhi-Hyderabad": 22, "Delhi-Pune": 20, "Delhi-Ahmedabad": 14,
  "Delhi-Jaipur": 5, "Delhi-Lucknow": 7, "Delhi-Chandigarh": 4,
  "Delhi-Goa": 28, "Delhi-Kochi": 36, "Delhi-Bhopal": 10,
  "Delhi-Patna": 12,
  "Bangalore-Chennai": 5, "Bangalore-Kolkata": 30, "Bangalore-Hyderabad": 10,
  "Bangalore-Pune": 16, "Bangalore-Ahmedabad": 22, "Bangalore-Jaipur": 30,
  "Bangalore-Lucknow": 30, "Bangalore-Chandigarh": 36, "Bangalore-Goa": 10,
  "Bangalore-Kochi": 10, "Bangalore-Bhopal": 22, "Bangalore-Patna": 32,
  "Chennai-Kolkata": 27, "Chennai-Hyderabad": 10, "Chennai-Pune": 18,
  "Chennai-Ahmedabad": 24, "Chennai-Jaipur": 30, "Chennai-Lucknow": 24,
  "Chennai-Chandigarh": 32, "Chennai-Goa": 14, "Chennai-Kochi": 10,
  "Chennai-Bhopal": 20, "Chennai-Patna": 22,
  "Kolkata-Hyderabad": 22, "Kolkata-Pune": 28, "Kolkata-Ahmedabad": 28,
  "Kolkata-Jaipur": 20, "Kolkata-Lucknow": 12, "Kolkata-Chandigarh": 22,
  "Kolkata-Goa": 30, "Kolkata-Kochi": 34, "Kolkata-Bhopal": 16,
  "Kolkata-Patna": 7,
  "Hyderabad-Pune": 10, "Hyderabad-Ahmedabad": 16, "Hyderabad-Jaipur": 22,
  "Hyderabad-Lucknow": 18, "Hyderabad-Chandigarh": 26, "Hyderabad-Goa": 10,
  "Hyderabad-Kochi": 14, "Hyderabad-Bhopal": 12, "Hyderabad-Patna": 20,
  "Pune-Ahmedabad": 10, "Pune-Jaipur": 18, "Pune-Lucknow": 20,
  "Pune-Chandigarh": 24, "Pune-Goa": 8, "Pune-Kochi": 16,
  "Pune-Bhopal": 12, "Pune-Patna": 26,
  "Ahmedabad-Jaipur": 10, "Ahmedabad-Lucknow": 14, "Ahmedabad-Chandigarh": 16,
  "Ahmedabad-Goa": 12, "Ahmedabad-Kochi": 24, "Ahmedabad-Bhopal": 10,
  "Ahmedabad-Patna": 20,
  "Jaipur-Lucknow": 8, "Jaipur-Chandigarh": 8, "Jaipur-Goa": 22,
  "Jaipur-Kochi": 32, "Jaipur-Bhopal": 8, "Jaipur-Patna": 14,
  "Lucknow-Chandigarh": 10, "Lucknow-Goa": 26, "Lucknow-Kochi": 32,
  "Lucknow-Bhopal": 8, "Lucknow-Patna": 6,
  "Chandigarh-Goa": 30, "Chandigarh-Kochi": 38, "Chandigarh-Bhopal": 14,
  "Chandigarh-Patna": 16,
  "Goa-Kochi": 10, "Goa-Bhopal": 16, "Goa-Patna": 28,
  "Kochi-Bhopal": 24, "Kochi-Patna": 34,
  "Bhopal-Patna": 14,
};

function getDuration(src: string, dst: string): number {
  return DISTANCE_MAP[`${src}-${dst}`] || DISTANCE_MAP[`${dst}-${src}`] || 12;
}

// Train name templates
const TRAIN_TYPES = [
  "Rajdhani Express", "Shatabdi Express", "Duronto Express",
  "Garib Rath", "Jan Shatabdi", "Superfast Express",
  "Intercity Express", "Express", "Mail", "AC Express",
  "Humsafar Express", "Tejas Express", "Vande Bharat",
  "Sampark Kranti", "Double Decker",
];

const CITY_PREFIXES: Record<string, string> = {
  Mumbai: "CSTM", Delhi: "NDLS", Bangalore: "SBC", Chennai: "MAS",
  Kolkata: "HWH", Hyderabad: "SC", Pune: "PUNE", Ahmedabad: "ADI",
  Jaipur: "JP", Lucknow: "LKO", Chandigarh: "CDG", Goa: "MAO",
  Kochi: "ERS", Bhopal: "BPL", Patna: "PNBE",
};

// High-traffic pairs that get 3-5 trains
const HIGH_TRAFFIC = new Set([
  "Mumbai-Delhi", "Delhi-Mumbai", "Bangalore-Chennai", "Chennai-Bangalore",
  "Delhi-Bangalore", "Bangalore-Delhi", "Mumbai-Pune", "Pune-Mumbai",
  "Delhi-Kolkata", "Kolkata-Delhi", "Mumbai-Bangalore", "Bangalore-Mumbai",
  "Delhi-Jaipur", "Jaipur-Delhi", "Delhi-Chandigarh", "Chandigarh-Delhi",
  "Mumbai-Ahmedabad", "Ahmedabad-Mumbai", "Chennai-Kolkata", "Kolkata-Chennai",
  "Hyderabad-Mumbai", "Mumbai-Hyderabad", "Delhi-Lucknow", "Lucknow-Delhi",
]);

// Class definitions with fare multipliers
const ALL_CLASSES = [
  { className: "General", fareMultiplier: 0.4, baseSeats: 200 },
  { className: "Sleeper", fareMultiplier: 1.0, baseSeats: 150 },
  { className: "AC 3-Tier", fareMultiplier: 1.8, baseSeats: 90 },
  { className: "AC 2-Tier", fareMultiplier: 2.6, baseSeats: 50 },
  { className: "AC First Class", fareMultiplier: 3.8, baseSeats: 24 },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

let trainCounter = 12001;
function nextTrainNumber(): string {
  return String(trainCounter++);
}

function randomDepartureTime(): string {
  const hours = [0, 1, 4, 5, 6, 7, 8, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const h = hours[Math.floor(Math.random() * hours.length)];
  const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addHours(dep: string, hours: number): string {
  const [h, m] = dep.split(":").map(Number);
  const totalMin = h * 60 + m + Math.round(hours * 60);
  const arrH = Math.floor(totalMin / 60) % 24;
  const arrM = totalMin % 60;
  return `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function baseFare(durationHours: number): number {
  // ~₹80-100 per hour of travel as base (sleeper equivalent)
  return Math.round(durationHours * (80 + Math.random() * 20));
}

function pickClasses(trainType: string): typeof ALL_CLASSES {
  // Premium trains get more AC classes; ordinary trains lean on General/Sleeper
  if (trainType.includes("Rajdhani") || trainType.includes("Tejas") || trainType.includes("Vande Bharat")) {
    return ALL_CLASSES.filter(c => c.className !== "General");
  }
  if (trainType.includes("Garib Rath")) {
    return ALL_CLASSES.filter(c => ["General", "Sleeper", "AC 3-Tier"].includes(c.className));
  }
  // Random 3-5 classes for others
  const count = 3 + Math.floor(Math.random() * 3);
  return ALL_CLASSES.slice(0, count);
}

function randomSeats(base: number): number {
  // Vary availability: some nearly full, some mostly empty
  const factor = 0.1 + Math.random() * 1.2;
  return Math.max(2, Math.round(base * factor));
}

// ---------------------------------------------------------------------------
// MAIN SEED
// ---------------------------------------------------------------------------

async function main() {
  console.log("🚂 Seeding RailOne database (comprehensive)...\n");

  // Clean existing data (in order due to FK)
  await prisma.cancellation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.trainClass.deleteMany();
  await prisma.train.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);
  await prisma.user.create({
    data: {
      email: "demo@railone.in",
      name: "Rahul Sharma",
      phone: "9876543210",
      passwordHash,
      role: "PASSENGER",
    },
  });
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@railone.in",
      name: "Admin",
      phone: "9000000001",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✓ Users created (demo@railone.in / admin@railone.in)\n");

  // Generate trains for all city pairs
  let trainCount = 0;

  for (const src of CITIES) {
    for (const dst of CITIES) {
      if (src === dst) continue;

      const routeKey = `${src}-${dst}`;
      const isHighTraffic = HIGH_TRAFFIC.has(routeKey);
      const numTrains = isHighTraffic ? 3 + Math.floor(Math.random() * 3) : 1;
      const duration = getDuration(src, dst);
      // Add slight variation per train
      for (let i = 0; i < numTrains; i++) {
        const durationVaried = duration + (Math.random() - 0.5) * 2;
        const dep = randomDepartureTime();
        const arr = addHours(dep, durationVaried);
        const typeIdx = Math.floor(Math.random() * TRAIN_TYPES.length);
        const trainType = TRAIN_TYPES[typeIdx];
        const trainName = isHighTraffic && i === 0
          ? `${src} ${trainType}`
          : `${CITY_PREFIXES[src]}-${CITY_PREFIXES[dst]} ${trainType}`;
        const fare = baseFare(durationVaried);
        const classes = pickClasses(trainType);

        const train = await prisma.train.create({
          data: {
            trainNumber: nextTrainNumber(),
            trainName,
            source: src,
            destination: dst,
            departureTime: dep,
            arrivalTime: arr,
            duration: formatDuration(durationVaried),
            totalSeats: classes.reduce((s, c) => s + c.baseSeats, 0),
            fare,
            classes: {
              create: classes.map(c => ({
                className: c.className,
                fareMultiplier: c.fareMultiplier,
                seatsAvailable: randomSeats(c.baseSeats),
              })),
            },
          },
        });
        trainCount++;
      }
    }
  }

  console.log(`🎉 Seeded ${trainCount} trains across ${CITIES.length} cities.`);
  console.log("\n📋 Login credentials:");
  console.log("   User:  demo@railone.in / password123");
  console.log("   Admin: admin@railone.in / admin123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
