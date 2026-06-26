/**
 * Seed realistic DTC e-commerce ops data so the demo looks alive.
 *   pnpm db:seed   (requires DATABASE_URL + applied schema)
 *
 * Deliberately creates ~15 "stuck" orders (paid, no shipment, >5 days old) and
 * some products below their reorder point so the headline questions return
 * satisfying results.
 */
import "dotenv/config";
import { faker } from "@faker-js/faker";
import { db, schema } from "../src/db/client";
import { rwPool } from "../src/db/pools";

const CATEGORIES = ["Apparel", "Home", "Beauty", "Electronics", "Outdoors"];
const REFUND_REASONS = ["damaged", "wrong item", "late delivery", "changed mind", "defective"];

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Clearing existing data…");
  await rwPool().query(`
    TRUNCATE audit_log, query_history, inventory_adjustments, order_flags,
             shipments, refunds, order_items, orders, products, customers
    RESTART IDENTITY CASCADE
  `);

  console.log("Seeding products…");
  const productRows = Array.from({ length: 50 }, () => {
    const reorder = faker.number.int({ min: 5, max: 25 });
    return {
      sku: faker.string.alphanumeric(8).toUpperCase(),
      name: faker.commerce.productName(),
      category: faker.helpers.arrayElement(CATEGORIES),
      price: faker.commerce.price({ min: 8, max: 250 }),
      // ~20% intentionally at/below reorder point for "low stock" questions.
      inventoryQty: faker.datatype.boolean(0.2)
        ? faker.number.int({ min: 0, max: reorder })
        : faker.number.int({ min: reorder + 1, max: 400 }),
      reorderPoint: reorder,
    };
  });
  const products = await db.insert(schema.products).values(productRows).returning();

  console.log("Seeding customers…");
  const customerRows = Array.from({ length: 150 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    createdAt: daysAgo(faker.number.int({ min: 1, max: 365 })),
    lifetimeValue: faker.commerce.price({ min: 0, max: 5000 }),
  }));
  const customers = await db.insert(schema.customers).values(customerRows).returning();

  console.log("Seeding orders, items, shipments, refunds…");
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

    // Shipments for fulfilled/shipped/delivered — deliberately NOT for stuck orders.
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

    // ~13% of orders get a refund, with a spike of higher amounts.
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

  console.log(`Done. Created 50 products, 150 customers, 300 orders, ${stuck} stuck orders.`);
  await rwPool().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
