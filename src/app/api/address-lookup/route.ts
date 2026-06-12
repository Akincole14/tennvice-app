import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");
  if (!postcode) {
    return NextResponse.json({ error: "Postcode required" }, { status: 400 });
  }

  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Address lookup not configured — add GETADDRESS_API_KEY to .env" },
      { status: 503 }
    );
  }

  const clean = postcode.replace(/\s+/g, "").toUpperCase();

  let res: Response;
  try {
    res = await fetch(
      `https://api.getaddress.io/find/${encodeURIComponent(clean)}?api-key=${apiKey}&expand=true`,
      { next: { revalidate: 3600 } }
    );
  } catch {
    return NextResponse.json({ error: "Network error reaching address service" }, { status: 502 });
  }

  if (res.status === 404) {
    return NextResponse.json({ addresses: [] });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Address lookup failed" }, { status: res.status });
  }

  const data = await res.json();

  const addresses: string[] = (data.addresses ?? [])
    .map((a: { formatted_address?: string[]; line_1?: string; line_2?: string; town_or_city?: string }) => {
      const parts = Array.isArray(a.formatted_address)
        ? a.formatted_address.filter(Boolean)
        : [a.line_1, a.line_2, a.town_or_city].filter(Boolean);
      if (data.postcode) parts.push(data.postcode);
      return parts.join(", ");
    })
    .filter(Boolean);

  return NextResponse.json({ addresses });
}
