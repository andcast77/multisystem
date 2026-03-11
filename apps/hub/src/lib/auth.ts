/**
 * Re-export shared auth utilities.
 * Apps can import directly from @multisystem/shared/auth
 * or use this local re-export for backward compatibility.
 */
export { getTokenFromCookie, setTokenCookie, clearTokenCookie } from '@multisystem/shared/auth'
