// app/api/customers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/dal";
import { customerSchema } from "@/schema";
import { isDatabaseError } from "@/lib/utils";
import { alias } from "drizzle-orm/pg-core";

// =====================
// GET - Get single customer by ID
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
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Create aliases for user table to join twice
    const createdByUser = alias(user, "createdByUser");
    const updatedByUser = alias(user, "updatedByUser");

    const [customer] = await db
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
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// =====================
// PATCH - Update customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate with Zod (partial schema for updates)
    const validationResult = customerSchema.partial().safeParse(body);
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

    // Check if customer exists
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...validationResult.data,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return NextResponse.json(updatedCustomer);
  } catch (error: unknown) {
    console.error("Error updating customer:", error);

    if (isDatabaseError(error)) {
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
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// =====================
// DELETE - Delete customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer
    await db.delete(customers).where(eq(customers.id, customerId));

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting customer:", error);

    if (isDatabaseError(error)) {
      const message = error.cause?.message ?? error.message;

      // Check if it's a foreign key constraint violation
      if (
        message.includes("violates foreign key constraint") ||
        message.includes("foreign key")
      ) {
        return NextResponse.json(
          { error: "Cannot delete customer with existing invoices" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}