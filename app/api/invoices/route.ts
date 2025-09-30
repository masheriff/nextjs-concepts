// app/api/invoices/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers, user } from "@/db/schema";
import { ilike, and, or, desc, asc, sql, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getSessionFromRequest } from "@/dal";
import { invoiceSchema } from "@/schema/invoice";
import { isDatabaseError } from "@/lib/utils";

// =====================
// GET - Fetch invoices with filters
// =====================
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? undefined;
    const sortOrder =
      (searchParams.get("sortOrder") ?? "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const limit = Math.max(0, Number(searchParams.get("limit") ?? 50));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    const columnMap = {
      id: invoices.id,
      customerId: invoices.customerId,
      status: invoices.status,
      total: invoices.total,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
    } as const;
    type SortKey = keyof typeof columnMap;

    const sortByParam = (searchParams.get("sortBy") ?? "updatedAt") as SortKey;
    const sortColumn = Object.prototype.hasOwnProperty.call(
      columnMap,
      sortByParam
    )
      ? columnMap[sortByParam]
      : columnMap.updatedAt;

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          sql`CAST(${invoices.id} AS TEXT) ILIKE ${`%${search}%`}`
        )
      );
    }

    const whereExpr =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

    const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const createdByUser = alias(user, "createdByUser");
    const updatedByUser = alias(user, "updatedByUser");

    const data = await db
      .select({
        id: invoices.id,
        customerId: invoices.customerId,
        customerName: customers.name,
        status: invoices.status,
        total: invoices.total,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        createdBy: {
          id: createdByUser.id,
          name: createdByUser.name,
          email: createdByUser.email,
          image: createdByUser.image,
        },
        updatedBy: {
          id: updatedByUser.id,
          name: updatedByUser.name,
          email: updatedByUser.email,
          image: updatedByUser.image,
        },
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(createdByUser, eq(invoices.createdBy, createdByUser.id))
      .leftJoin(updatedByUser, eq(invoices.updatedBy, updatedByUser.id))
      .where(whereExpr)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const countRows = await db
      .select({ count: sql`count(*)` })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereExpr);

    const rawCount = (countRows[0] as any)?.count ?? 0;
    const total = typeof rawCount === "bigint" ? Number(rawCount) : rawCount;

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// =====================
// POST - Create invoice
// =====================
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validationResult = invoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { customerId, status, items } = validationResult.data;

    // Calculate total
    const total = items
      .reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);

    // Create invoice and items in transaction
    const result = await db.transaction(async (tx) => {
      // Create invoice
      const [invoice] = await tx
        .insert(invoices)
        .values({
          customerId,
          status,
          total,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning();

      // Create invoice items
      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: invoice.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        }))
      );

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating invoice:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;
      return NextResponse.json(
        { error: message || "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}