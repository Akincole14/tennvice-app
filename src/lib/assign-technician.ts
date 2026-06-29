import { prisma } from "./prisma";

export function extractPostcode(address: string): string | null {
  const m = address?.match(/\b([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})\b/i);
  return m ? m[1].toUpperCase().replace(/\s+/, " ") : null;
}

export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocode(postcode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const clean = postcode.replace(/\s/g, "");
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
    const d = (await res.json()) as any;
    // Active postcode
    if (d.result?.latitude && d.result?.longitude) {
      return { lat: d.result.latitude, lon: d.result.longitude };
    }
    // Terminated postcode — coords still available
    if (d.terminated?.latitude && d.terminated?.longitude) {
      return { lat: d.terminated.latitude, lon: d.terminated.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export interface AssignmentResult {
  technicianId: string | null;
  technicianName: string | null;
  distanceMiles: number | null;
  reason: string;
}

export async function assignTechnicianToVisit(
  visitId: string,
  propertyPostcode: string,
  visitType: string
): Promise<AssignmentResult> {
  // 1. Geocode property
  const propCoords = await geocode(propertyPostcode);
  if (!propCoords) {
    return { technicianId: null, technicianName: null, distanceMiles: null, reason: "Could not geocode property postcode" };
  }

  // 2. Load all technicians
  const technicians = await prisma.technician.findMany({
    include: { user: { select: { name: true } } },
  });

  if (technicians.length === 0) {
    return { technicianId: null, technicianName: null, distanceMiles: null, reason: "No technicians on record" };
  }

  // 3. Geocode each technician and calculate distance
  const withDist = (
    await Promise.all(
      technicians.map(async (t) => {
        const pc = extractPostcode(t.address ?? "");
        if (!pc) return null;
        const coords = await geocode(pc);
        if (!coords) return null;
        const distanceMiles = Math.round(haversineDistanceMiles(propCoords.lat, propCoords.lon, coords.lat, coords.lon) * 10) / 10;
        return { id: t.id, name: t.user.name ?? "Unknown", qualification: t.qualification ?? "General", distanceMiles };
      })
    )
  ).filter((t): t is NonNullable<typeof t> => t !== null);

  // Fallback: no geocodable addresses — assign the first available
  if (withDist.length === 0) {
    const first = technicians[0];
    await prisma.visit.update({ where: { id: visitId }, data: { technicianId: first.id } });
    return { technicianId: first.id, technicianName: first.user.name ?? null, distanceMiles: null, reason: "Assigned first available (no address on file)" };
  }

  const sorted = [...withDist].sort((a, b) => a.distanceMiles - b.distanceMiles);

  // Pick nearest within 3 miles, with qualification preference for specialist visits;
  // fall back to nearest overall if none qualify
  let picked = sorted[0];

  const within3 = sorted.filter((t) => t.distanceMiles <= 3);
  if (within3.length > 0) {
    const qualKeyword =
      visitType === "BOILER_SERVICE" ? /gas|heat|plumb/i :
      visitType === "ROUTINE_ELECTRICAL" ? /electri/i : null;

    const qualified = qualKeyword ? within3.find((t) => qualKeyword.test(t.qualification)) : null;
    picked = qualified ?? within3[0];
  }

  await prisma.visit.update({ where: { id: visitId }, data: { technicianId: picked.id } });

  const label = picked.distanceMiles <= 3
    ? `${picked.name} is ${picked.distanceMiles} miles away — nearest within 3 miles`
    : `${picked.name} is ${picked.distanceMiles} miles away — closest available`;

  return {
    technicianId: picked.id,
    technicianName: picked.name,
    distanceMiles: picked.distanceMiles,
    reason: label,
  };
}

export interface NearbyTechnician {
  id: string;
  name: string;
  distanceMiles: number;
  qualification: string;
}

export async function getNearbyTechnicians(
  propertyPostcode: string,
  excludeIds: string[] = []
): Promise<NearbyTechnician[]> {
  const propCoords = await geocode(propertyPostcode);
  if (!propCoords) return [];

  const technicians = await prisma.technician.findMany({
    where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
    include: { user: { select: { name: true } } },
  });

  const results = (
    await Promise.all(
      technicians.map(async (t) => {
        const pc = extractPostcode(t.address ?? "");
        if (!pc) return null;
        const coords = await geocode(pc);
        if (!coords) return null;
        const distanceMiles =
          Math.round(haversineDistanceMiles(propCoords.lat, propCoords.lon, coords.lat, coords.lon) * 10) / 10;
        return { id: t.id, name: t.user.name ?? "Unknown", distanceMiles, qualification: t.qualification ?? "General" };
      })
    )
  ).filter((t): t is NearbyTechnician => t !== null);

  return results.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
