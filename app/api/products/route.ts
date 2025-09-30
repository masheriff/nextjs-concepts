import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, user } from "@/db/schema";
import { ilike, and, or, desc, asc, sql, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getSessionFromRequest } from "@/dal";
import { productSchema } from "@/schema/product";
import { isDatabaseError } from "@/lib/utils";

// =====================
// GET - Fetch products with filters
// =====================
export async function GET(request: NextRequest) {
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
      id: products.id,
      name: products.name,
      price: products.price,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    } as const;
    type SortKey = keyof typeof columnMap;

    // read sortBy and pick a safe column from columnMap (fallback to updatedAt)
    const sortByParam = (searchParams.get("sortBy") ?? "updatedAt") as SortKey;
    const sortColumn = Object.prototype.hasOwnProperty.call(
      columnMap,
      sortByParam
    )
      ? columnMap[sortByParam]
      : columnMap.updatedAt;

    // build conditions safely
    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
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
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
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
      .from(products)
      .leftJoin(createdByUser, eq(products.createdBy, createdByUser.id))
      .leftJoin(updatedByUser, eq(products.updatedBy, updatedByUser.id))
      .where(whereExpr)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // count total (using raw count SQL)
    const countRows = await db
      .select({ count: sql`count(*)` })
      .from(products)
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
    console.error("Error fetching products:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =====================
// POST - Create a new product
// =====================
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const validationResult = productSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, price } = validationResult.data;

    // Insert product
    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        description: description || null,
        price,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating product:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;
      return NextResponse.json(
        { error: message || "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}