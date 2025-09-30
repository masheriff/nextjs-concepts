//app/api/customers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { user } from "@/db/schema";
import { ilike, and, or, desc, asc, sql, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getSessionFromRequest } from "@/dal";
import { customerSchema } from "@/schema";
import { isDatabaseError } from "@/lib/utils";

// =====================
// GET - Fetch customers with filters
// =====================
export async function GET(request: NextRequest) {
  console.log(request);
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // simple parsing with sane defaults
    const search = searchParams.get("search") ?? undefined;
    const sortOrder =
      (searchParams.get("sortOrder") ?? "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const limit = Math.max(0, Number(searchParams.get("limit") ?? 50));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    // map of allowed sortable columns -> concrete column reference
    const columnMap = {
      id: customers.id,
      name: customers.name,
      email: customers.email,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    } as const;
    type SortKey = keyof typeof columnMap;

    // read sortBy and pick a safe column from columnMap (fallback to createdAt)
    const sortByParam = (searchParams.get("sortBy") ?? "updatedAt") as SortKey;
    const sortColumn = Object.prototype.hasOwnProperty.call(
      columnMap,
      sortByParam
    )
      ? columnMap[sortByParam]
      : columnMap.createdAt;

    // build conditions safely
    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )
      );
    }

    const whereExpr =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

    // create orderBy expression
    const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Create aliases for user table to join twice
    const createdByUser = alias(user, "createdByUser");
    const updatedByUser = alias(user, "updatedByUser");

    // fetch rows with user relations using LEFT JOINs
    const data = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
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
      .from(customers)
      .leftJoin(createdByUser, eq(customers.createdBy, createdByUser.id))
      .leftJoin(updatedByUser, eq(customers.updatedBy, updatedByUser.id))
      .where(whereExpr)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // count total (using raw count SQL)
    const countRows = await db
      .select({ count: sql`count(*)` })
      .from(customers)
      .where(whereExpr);

    const rawCount = (countRows[0] as any)?.count ?? 0;
    const total = Number(rawCount);

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// =====================
// POST - Create a new customer
// =====================
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const validationResult = customerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, phone } = validationResult.data;

    // Insert customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name,
        email,
        phone: phone || null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating customer:", error);

    if (isDatabaseError(error)) {
      // Get the error message from cause or fallback
      const message = error.cause?.message ?? error.message;

      // Check if it's a duplicate email
      if (
        message.includes("duplicate key value violates unique constraint") &&
        message.includes("customers_email_unique")
      ) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}