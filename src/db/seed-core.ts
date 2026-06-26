/**
 * Reusable seed logic — called by both `pnpm db:seed` (local/CLI) and the
 * /api/admin/setup endpoint (Vercel runtime, IAM). Does NOT close the pool, so
 * it's safe inside a serverless request.
 */
import { faker } from "@faker-js/faker";
import { db, schema } from "./client";
import { rwPool } from "./pools";

const CATEGORIES = ["Apparel", "Home", "Beauty", "Electronics", "Outdoors"];
const REFUND_REASONS = ["damaged", "wrong item", "late delivery", "changed mind", "defective"];

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export interface SeedCounts {
  products: number;
  customers: number;
  orders: number;
  stuck: number;
}

/** Truncate everything, then load realistic DTC demo data. */
export async function seedDatabase(): Promise<SeedCounts> {
  await rwPool().query(`
    TRUNCATE audit_log, query_history, inventory_adjustments, order_flags,
             shipments, refunds, order_items, orders, products, customers
    RESTART IDENTITY CASCADE
  `);

  const productRows = Array.from({ length: 50 }, () => {
    const reorder = faker.number.int({ min: 5, max: 25 });
    return {
      sku: faker.string.alphanumeric(8).toUpperCase(),
      name: faker.commerce.productName(),
      category: faker.helpers.arrayElement(CATEGORIES),
      price: faker.commerce.price({ min: 8, max: 250 }),
      inventoryQty: faker.datatype.boolean(0.2)
        ? faker.number.int({ min: 0, max: reorder })
        : faker.number.int({ min: reorder + 1, max: 400 }),
      reorderPoint: reorder,
    };
  });
  const products = await db.insert(schema.products).values(productRows).returning();

  const customerRows = Array.from({ length: 150 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase() + "." + faker.string.alphanumeric(4),
    createdAt: daysAgo(faker.number.int({ min: 1, max: 365 })),
    lifetimeValue: faker.commerce.price({ min: 0, max: 5000 }),
  }));
  const customers = await db.insert(schema.customers).values(customerRows).returning();

  let stuck = 0;
  for (let i = 0; i < 300; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const ageDays = faker.number.int({ min: 0, max: 60 });
    const makeStuck = stuck < 15 && ageDays > 5 && faker.datatype.boolean(0.15);
    const status = makeStuck
      ? "paid"
      : faker.helpers.arrayElement([
          "delivered", "delivered", "shipped", "fulfilled", "paid", "pending", "cancelled",
        ]);

    const itemCount = faker.number.int({ min: 1, max: 4 });
    const items = Array.from({ length: itemCount }, () => {
      const p = faker.helpers.arrayElement(products);
      return { product: p, qty: faker.number.int({ min: 1, max: 3 }), unitPrice: p.price };
    });
    const total = items.reduce((s, it) => s + Number(it.unitPrice) * it.qty, 0);

    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: customer.id,
        status,
        channel: faker.helpers.arrayElement(["web", "web", "mobile", "marketplace"]),
        total: total.toFixed(2),
        createdAt: daysAgo(ageDays),
        updatedAt: daysAgo(Math.max(0, ageDays - 1)),
      })
      .returning();

    await db.insert(schema.orderItems).values(
      items.map((it) => ({
        orderId: order.id,
        productId: it.product.id,
        qty: it.qty,
        unitPrice: String(it.unitPrice),
      }))
    );

    if (["fulfilled", "shipped", "delivered"].includes(status)) {
      await db.insert(schema.shipments).values({
        orderId: order.id,
        carrier: faker.helpers.arrayElement(["UPS", "FedEx", "USPS", "DHL"]),
        status: status === "delivered" ? "delivered" : "in_transit",
        eta: daysAgo(faker.number.int({ min: -5, max: 3 })),
        createdAt: daysAgo(Math.max(0, ageDays - 1)),
      });
    }
    if (makeStuck) stuck++;

    if (faker.datatype.boolean(0.13)) {
      await db.insert(schema.refunds).values({
        orderId: order.id,
        amount: faker.datatype.boolean(0.3)
          ? faker.commerce.price({ min: 200, max: 500 })
          : faker.commerce.price({ min: 5, max: 199 }),
        reason: faker.helpers.arrayElement(REFUND_REASONS),
        status: faker.helpers.arrayElement(["requested", "approved", "completed"]),
        createdAt: daysAgo(faker.number.int({ min: 0, max: 30 })),
      });
    }
  }

  return { products: products.length, customers: customers.length, orders: 300, stuck };
}
