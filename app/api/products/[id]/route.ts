import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/dal";
import { productSchema } from "@/schema/product";
import { isDatabaseError } from "@/lib/utils";
import { alias } from "drizzle-orm/pg-core";

// =====================
// GET - Get single product by ID
// =====================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Create aliases for user table to join twice
    const createdByUser = alias(user, "createdByUser");
    const updatedByUser = alias(user, "updatedByUser");

    const [product] = await db
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
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// =====================
// PATCH - Update product
// =====================
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate with Zod (partial schema for updates)
    const validationResult = productSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Check if at least one field is provided
    if (Object.keys(validationResult.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validationResult.data,
        updatedBy: session.user.id,
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    console.error("Error updating product:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;
      return NextResponse.json(
        { error: message || "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// =====================
// DELETE - Delete product
// =====================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product
    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting product:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;

      // Check if it's a foreign key constraint violation
      if (
        message.includes("violates foreign key constraint") ||
        message.includes("foreign key")
      ) {
        return NextResponse.json(
          { error: "Cannot delete product with existing invoice items" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}