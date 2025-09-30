// app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers, products, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/dal";
import { invoiceSchema } from "@/schema/invoice";
import { isDatabaseError } from "@/lib/utils";
import { alias } from "drizzle-orm/pg-core";

// =====================
// GET - Get single invoice by ID
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
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const createdByUser = alias(user, "createdByUser");
    const updatedByUser = alias(user, "updatedByUser");

    // Fetch invoice
    const [invoice] = await db
      .select({
        id: invoices.id,
        customerId: invoices.customerId,
        customerName: customers.name,
        customerEmail: customers.email,
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
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch invoice items
    const items = await db
      .select({
        id: invoiceItems.id,
        productId: invoiceItems.productId,
        productName: products.name,
        quantity: invoiceItems.quantity,
        price: invoiceItems.price,
      })
      .from(invoiceItems)
      .leftJoin(products, eq(invoiceItems.productId, products.id))
      .where(eq(invoiceItems.invoiceId, invoiceId));

    return NextResponse.json({
      ...invoice,
      items,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// =====================
// PATCH - Update invoice
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
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
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

    // Check if invoice exists
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { customerId, status, items } = validationResult.data;

    // Calculate total
    const total = items
      .reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);

    // Update invoice and items in transaction
    const result = await db.transaction(async (tx) => {
      // Update invoice
      const [updatedInvoice] = await tx
        .update(invoices)
        .set({
          customerId,
          status,
          total,
          updatedBy: session.user.id,
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      // Delete existing items
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

      // Insert new items
      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: invoiceId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        }))
      );

      return updatedInvoice;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error updating invoice:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;
      return NextResponse.json(
        { error: message || "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// =====================
// DELETE - Delete invoice
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
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Delete invoice and items in transaction
    await db.transaction(async (tx) => {
      // Delete invoice items first (foreign key constraint)
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

      // Delete invoice
      await tx.delete(invoices).where(eq(invoices.id, invoiceId));
    });

    return NextResponse.json(
      { message: "Invoice deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting invoice:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;
      return NextResponse.json(
        { error: message || "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}