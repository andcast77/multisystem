/**
 * Auth Module
 *
 * Handles: login, register, logout, token verification, session management.
 * This module is stateless (no tenant context required for most operations).
 */
export { registerRoutes } from '../../controllers/v1/auth.controller.js'
export { requireAuth } from '../../core/auth.js'
