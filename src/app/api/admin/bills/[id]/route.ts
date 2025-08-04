import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRoleFromCookie } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const bill = await db.bill.findUnique({
    where: { id: params.id },
    include: {
      tenant: { select: { firstName: true, lastName: true } },
      room: { select: { roomNumber: true } },
    },
  });

  if (!bill) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(bill);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const role = await getRoleFromCookie();
  if (role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const updated = await db.bill.update({
    where: { id: params.id },
    data: {
      status: body.status,
      paymentDate: body.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
