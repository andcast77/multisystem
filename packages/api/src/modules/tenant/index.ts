/**
 * Tenant Module
 *
 * Handles: company CRUD, member management, module subscriptions.
 * This module manages the multi-tenancy layer.
 */
export { registerRoutes as registerCompanyRoutes } from '../../controllers/companies.controller.js'
export { registerRoutes as registerMemberRoutes } from '../../controllers/company-members.controller.js'
