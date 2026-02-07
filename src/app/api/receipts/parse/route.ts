import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function parseReceipt(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let amount = 0;
  let date = "";
  let merchant = "";

  // Try to find merchant (usually first non-empty line or line with store name patterns)
  if (lines.length > 0) merchant = lines[0];

  for (const line of lines) {
    // Match total/valor patterns
    const totalMatch = line.match(/(?:total|valor|value|amount)[:\s]*R?\$?\s*([\d.,]+)/i);
    if (totalMatch) {
      amount = parseFloat(totalMatch[1].replace(/\./g, "").replace(",", "."));
    }
    // Match standalone currency amounts (take the largest as total)
    const amountMatch = line.match(/R\$\s*([\d.,]+)/);
    if (amountMatch && !amount) {
      const val = parseFloat(amountMatch[1].replace(/\./g, "").replace(",", "."));
      if (val > amount) amount = val;
    }
    // Match dates
    const dateMatch = line.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
    if (dateMatch && !date) {
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  return { amount, date: date || new Date().toISOString().split("T")[0], merchant };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });
  const parsed = parseReceipt(text);
  return NextResponse.json(parsed);
}
