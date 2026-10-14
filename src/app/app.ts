import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import type { FastifyError } from "fastify";
import Fastify from "fastify";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { env } from "../config/env.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import type { AuthService } from "../modules/auth/auth.service.js";
import { createSessionMiddleware } from "../modules/auth/session.middleware.js";
import type { SessionLookup } from "../modules/auth/session.middleware.js";
import { healthRoutes } from "../modules/health/health.routes.js";
import { settingsRoutes } from "../modules/settings/routes.js";
import type { SettingsService } from "../modules/settings/service.js";
import { featureRoutes } from "../modules/features/routes.js";
import type { FeatureService } from "../modules/features/service.js";
import { designRoutes } from "../modules/designs/routes.js";
import type { DesignService } from "../modules/designs/service.js";
import { hostingPlanRoutes } from "../modules/hosting-plans/routes.js";
import type { HostingPlanService } from "../modules/hosting-plans/service.js";
import { maintenancePlanRoutes } from "../modules/maintenance-plans/routes.js";
import type { MaintenancePlanService } from "../modules/maintenance-plans/service.js";
import { projectRoutes } from "../modules/projects/routes.js";
import type { ProjectService } from "../modules/projects/service.js";
import { projectFeatureRoutes } from "../modules/project-features/routes.js";
import type { ProjectFeatureService } from "../modules/project-features/service.js";
import { projectDesignRoutes } from "../modules/project-designs/routes.js";
import type { ProjectDesignService } from "../modules/project-designs/service.js";
import { projectHostingRoutes } from "../modules/project-hostings/routes.js";
import type { ProjectHostingService } from "../modules/project-hostings/service.js";
import { projectMaintenanceRoutes } from "../modules/project-maintenances/routes.js";
import type { ProjectMaintenanceService } from "../modules/project-maintenances/service.js";
import { calculationRoutes } from "../modules/calculations/routes.js";
import type { CalculationService } from "../modules/calculations/service.js";
import { quotationRecalculationRoutes, quotationRoutes } from "../modules/quotations/routes.js";
import type { QuotationService } from "../modules/quotations/service.js";

export function buildApp(authService?: AuthService, sessionLookup?: SessionLookup, settingsService?: SettingsService, featureService?: FeatureService, designService?: DesignService, hostingPlanService?: HostingPlanService, maintenancePlanService?: MaintenancePlanService, projectService?: ProjectService, projectFeatureService?: ProjectFeatureService, projectDesignService?: ProjectDesignService, projectHostingService?: ProjectHostingService, projectMaintenanceService?: ProjectMaintenanceService, calculationService?: CalculationService, quotationService?: QuotationService) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  app.register(cookie);
  app.decorateRequest("user", null);

  if (sessionLookup) {
    app.addHook("preHandler", createSessionMiddleware(sessionLookup));
  }

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    request.log.error({ err: error }, "Request failed");

    reply.status(statusCode).send({
      error: {
        code: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
        message: statusCode >= 500 ? "An unexpected error occurred" : error.message,
      },
    });
  });

  app.register(healthRoutes, { prefix: "/api" });
  app.register(authRoutes, {
    prefix: "/api/auth",
    service: authService ?? {
      getCurrentUser: async () => null,
      register: async () => { throw new Error("Auth service is not configured"); },
      login: async () => { throw new Error("Auth service is not configured"); },
      logout: async () => { throw new Error("Auth service is not configured"); },
    },
  });
  app.register(settingsRoutes, {
    prefix: "/api/settings",
    service: settingsService ?? {
      getSettings: async () => { throw new Error("Settings service is not configured"); },
      updateSettings: async () => { throw new Error("Settings service is not configured"); },
    },
  });
  app.register(featureRoutes, {
    prefix: "/api/features",
    service: featureService ?? {
      listFeatures: async () => { throw new Error("Feature service is not configured"); },
      getFeature: async () => { throw new Error("Feature service is not configured"); },
      createFeature: async () => { throw new Error("Feature service is not configured"); },
      createFeatureOption: async () => { throw new Error("Feature service is not configured"); },
      updateFeatureOption: async () => { throw new Error("Feature service is not configured"); },
      createFeatureOptionValue: async () => { throw new Error("Feature service is not configured"); },
      updateFeatureOptionValue: async () => { throw new Error("Feature service is not configured"); },
      updateFeature: async () => { throw new Error("Feature service is not configured"); },
      updateFeatureStatus: async () => { throw new Error("Feature service is not configured"); },
    },
  });
  app.register(designRoutes, {
    prefix: "/api/designs",
    service: designService ?? {
      listDesigns: async () => { throw new Error("Design service is not configured"); },
      getDesign: async () => { throw new Error("Design service is not configured"); },
      createDesign: async () => { throw new Error("Design service is not configured"); },
      updateDesign: async () => { throw new Error("Design service is not configured"); },
      updateDesignStatus: async () => { throw new Error("Design service is not configured"); },
    },
  });
  app.register(hostingPlanRoutes, {
    prefix: "/api/hosting-plans",
    service: hostingPlanService ?? {
      listHostingPlans: async () => { throw new Error("Hosting plan service is not configured"); },
      getHostingPlan: async () => { throw new Error("Hosting plan service is not configured"); },
      createHostingPlan: async () => { throw new Error("Hosting plan service is not configured"); },
      updateHostingPlan: async () => { throw new Error("Hosting plan service is not configured"); },
      updateHostingPlanStatus: async () => { throw new Error("Hosting plan service is not configured"); },
    },
  });
  app.register(maintenancePlanRoutes, {
    prefix: "/api/maintenance-plans",
    service: maintenancePlanService ?? {
      listMaintenancePlans: async () => { throw new Error("Maintenance plan service is not configured"); },
      getMaintenancePlan: async () => { throw new Error("Maintenance plan service is not configured"); },
      createMaintenancePlan: async () => { throw new Error("Maintenance plan service is not configured"); },
      updateMaintenancePlan: async () => { throw new Error("Maintenance plan service is not configured"); },
      updateMaintenancePlanStatus: async () => { throw new Error("Maintenance plan service is not configured"); },
    },
  });
  app.register(projectRoutes, {
    prefix: "/api/projects",
    service: projectService ?? {
      listProjects: async () => { throw new Error("Project service is not configured"); },
      getProject: async () => { throw new Error("Project service is not configured"); },
      createProject: async () => { throw new Error("Project service is not configured"); },
      updateProject: async () => { throw new Error("Project service is not configured"); },
    },
  });
  app.register(projectFeatureRoutes, {
    prefix: "/api/projects",
    service: projectFeatureService ?? {
      addFeature: async () => { throw new Error("Project feature service is not configured"); },
      updateFeature: async () => { throw new Error("Project feature service is not configured"); },
      removeFeature: async () => { throw new Error("Project feature service is not configured"); },
      replaceSelections: async () => { throw new Error("Project feature service is not configured"); },
    },
  });
  app.register(projectDesignRoutes, {
    prefix: "/api/projects",
    service: projectDesignService ?? {
      setDesign: async () => { throw new Error("Project design service is not configured"); },
      removeDesign: async () => { throw new Error("Project design service is not configured"); },
    },
  });
  app.register(projectHostingRoutes, {
    prefix: "/api/projects",
    service: projectHostingService ?? {
      addHosting: async () => { throw new Error("Project hosting service is not configured"); },
      updateHosting: async () => { throw new Error("Project hosting service is not configured"); },
      removeHosting: async () => { throw new Error("Project hosting service is not configured"); },
    },
  });
  app.register(projectMaintenanceRoutes, {
    prefix: "/api/projects",
    service: projectMaintenanceService ?? {
      addMaintenance: async () => { throw new Error("Project maintenance service is not configured"); },
      removeMaintenance: async () => { throw new Error("Project maintenance service is not configured"); },
    },
  });
  app.register(calculationRoutes, {
    prefix: "/api/projects",
    service: calculationService ?? {
      calculateProject: async () => { throw new Error("Calculation service is not configured"); },
      calculateProjectSnapshot: async () => { throw new Error("Calculation service is not configured"); },
    },
  });
  app.register(quotationRoutes, {
    prefix: "/api/projects",
    service: quotationService ?? {
      createDraftQuotation: async () => { throw new Error("Quotation service is not configured"); },
      recalculateDraftQuotation: async () => { throw new Error("Quotation service is not configured"); },
    },
  });
  app.register(quotationRecalculationRoutes, {
    prefix: "/api/quotations",
    service: quotationService ?? {
      createDraftQuotation: async () => { throw new Error("Quotation service is not configured"); },
      recalculateDraftQuotation: async () => { throw new Error("Quotation service is not configured"); },
    },
  });

  return app;
}
