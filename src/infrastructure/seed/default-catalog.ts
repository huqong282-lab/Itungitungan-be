import type { Prisma } from "../../generated/prisma/client.js";
import { SelectionType } from "../../generated/prisma/client.js";

type Db = Prisma.TransactionClient;

const DEFAULT_FEATURES = [
  { name: "Authentication", description: "User authentication and access control", category: "Core", baseEstimatedHours: 0 },
  { name: "Dashboard", description: "Application dashboard", category: "Core", baseEstimatedHours: 0 },
  { name: "CRUD", description: "Create, read, update, and delete data", category: "Core", baseEstimatedHours: 0 },
  { name: "Payment Gateway", description: "Payment integration", category: "Payment", baseEstimatedHours: 0 },
  { name: "Notification", description: "Application notifications", category: "Communication", baseEstimatedHours: 0 },
  { name: "Search", description: "Search and filtering", category: "Core", baseEstimatedHours: 0 },
] as const;

const PAYMENT_OPTIONS = [
  {
    name: "Provider",
    selectionType: SelectionType.SINGLE,
    values: [
      { label: "Midtrans", estimatedHours: 8, isDefault: true },
      { label: "Xendit", estimatedHours: 8, isDefault: false },
      { label: "Stripe", estimatedHours: 12, isDefault: false },
    ],
  },
  {
    name: "Payment Type",
    selectionType: SelectionType.MULTIPLE,
    values: [
      { label: "Virtual Account", estimatedHours: 4, isDefault: true },
      { label: "E-wallet", estimatedHours: 4, isDefault: false },
      { label: "QRIS", estimatedHours: 4, isDefault: false },
    ],
  },
] as const;

/** Creates the default catalog inside the caller's transaction, owned by userId. */
export async function initializeDefaultCatalog(db: Db, userId: string): Promise<void> {
  const paymentGateway = DEFAULT_FEATURES.find((feature) => feature.name === "Payment Gateway");

  for (const feature of DEFAULT_FEATURES) {
    const savedFeature = await db.feature.upsert({
      where: { userId_name: { userId, name: feature.name } },
      create: { ...feature, userId },
      update: {},
      select: { id: true },
    });

    if (feature.name !== paymentGateway?.name) continue;

    for (const option of PAYMENT_OPTIONS) {
      const savedOption = await db.featureOption.upsert({
        where: { featureId_name: { featureId: savedFeature.id, name: option.name } },
        create: {
          featureId: savedFeature.id,
          name: option.name,
          selectionType: option.selectionType,
        },
        update: {},
        select: { id: true },
      });

      for (const value of option.values) {
        await db.featureOptionValue.upsert({
          where: { featureOptionId_label: { featureOptionId: savedOption.id, label: value.label } },
          create: { featureOptionId: savedOption.id, ...value },
          update: {},
        });
      }
    }
  }
}
