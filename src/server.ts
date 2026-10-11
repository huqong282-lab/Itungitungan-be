import { env } from "./config/env.js";
import { buildApp } from "./app/app.js";
import { prisma } from "./infrastructure/prisma/client.js";
import { createAuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createSettingsRepository } from "./modules/settings/repository.js";
import { createSettingsService } from "./modules/settings/service.js";
import { createFeatureRepository } from "./modules/features/repository.js";
import { createFeatureService } from "./modules/features/service.js";
import { createDesignRepository } from "./modules/designs/repository.js";
import { createDesignService } from "./modules/designs/service.js";
import { createHostingPlanRepository } from "./modules/hosting-plans/repository.js";
import { createHostingPlanService } from "./modules/hosting-plans/service.js";
import { createMaintenancePlanRepository } from "./modules/maintenance-plans/repository.js";
import { createMaintenancePlanService } from "./modules/maintenance-plans/service.js";
import { createProjectRepository } from "./modules/projects/repository.js";
import { createProjectService } from "./modules/projects/service.js";
import { createProjectFeatureRepository } from "./modules/project-features/repository.js";
import { createProjectFeatureService } from "./modules/project-features/service.js";

const authRepository = createAuthRepository(prisma);
const settingsRepository = createSettingsRepository(prisma);
const featureRepository = createFeatureRepository(prisma);
const designRepository = createDesignRepository(prisma);
const hostingPlanRepository = createHostingPlanRepository(prisma);
const maintenancePlanRepository = createMaintenancePlanRepository(prisma);
const projectRepository = createProjectRepository(prisma);
const projectFeatureRepository = createProjectFeatureRepository(prisma);
const app = buildApp(
  createAuthService(authRepository),
  authRepository.findSessionByTokenHash,
  createSettingsService(settingsRepository),
  createFeatureService(featureRepository),
  createDesignService(designRepository),
  createHostingPlanService(hostingPlanRepository),
  createMaintenancePlanService(maintenancePlanRepository),
  createProjectService(projectRepository),
  createProjectFeatureService(projectFeatureRepository),
);

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
} catch (error) {
  app.log.error(error, "Failed to start server");
  await app.close();
  process.exitCode = 1;
}
