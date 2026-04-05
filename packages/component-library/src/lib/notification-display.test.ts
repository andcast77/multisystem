import { describe, it, expect } from 'vitest'
import {
  getNotificationSource,
  getNotificationSourceLabel,
  getInAppNotificationMeta,
} from './notification-display'

describe('notification-display (PLAN-23)', () => {
  describe('getNotificationSource', () => {
    it('maps COLLAB and plan17 data to plan17', () => {
      expect(getNotificationSource('COLLAB')).toBe('plan17')
      expect(getNotificationSource('INFO', { plan: 'plan17' })).toBe('plan17')
      expect(getNotificationSource('INFO', { source: 'collab' })).toBe('plan17')
    })

    it('maps SECURITY and MFA/security data to plan24', () => {
      expect(getNotificationSource('SECURITY')).toBe('plan24')
      expect(getNotificationSource('INFO', { plan: 'plan24' })).toBe('plan24')
      expect(getNotificationSource('INFO', { source: 'mfa' })).toBe('plan24')
      expect(getNotificationSource('INFO', { source: 'security' })).toBe('plan24')
    })

    it('maps automation types to plan20', () => {
      expect(getNotificationSource('LOW_STOCK')).toBe('plan20')
      expect(getNotificationSource('IMPORTANT_SALE')).toBe('plan20')
      expect(getNotificationSource('PENDING_TASK')).toBe('plan20')
      expect(getNotificationSource('SYSTEM')).toBe('plan20')
      expect(getNotificationSource('INFO', { plan: 'plan20' })).toBe('plan20')
    })

    it('returns generic for unknown combinations', () => {
      expect(getNotificationSource('INFO')).toBe('generic')
      expect(getNotificationSource('WARNING')).toBe('generic')
    })
  })

  describe('getNotificationSourceLabel', () => {
    it('returns Spanish labels', () => {
      expect(getNotificationSourceLabel('plan17')).toBe('Colaboración')
      expect(getNotificationSourceLabel('plan20')).toBe('Automatización')
      expect(getNotificationSourceLabel('plan24')).toBe('Seguridad')
      expect(getNotificationSourceLabel('generic')).toBe('General')
    })
  })

  describe('getInAppNotificationMeta', () => {
    it('returns source and sourceLabel', () => {
      const meta = getInAppNotificationMeta('SECURITY', null)
      expect(meta.source).toBe('plan24')
      expect(meta.sourceLabel).toBe('Seguridad')
    })
  })
})
