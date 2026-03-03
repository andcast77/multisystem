'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  module?: string
  onClick?: () => void
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export interface SidebarUser {
  name?: string
  email?: string
  role?: string
  avatar?: string
  companyId?: string
  company?: {
    name?: string
  }
}

export interface SidebarBranding {
  name: string
  shortName: string
  logo?: React.ReactNode
}

// Navigation dependencies to be injected by the consuming app
export interface NavigationDeps {
  Link: React.ComponentType<any>
  usePathname: () => string
}

export interface SidebarProps {
  navGroups: NavGroup[]
  user?: SidebarUser | null
  branding: SidebarBranding
  isLoadingUser?: boolean
  onLogout?: () => void
  
  // Navigation dependencies (required for framework-agnostic usage)
  navigation: NavigationDeps
  
  // Optional permission check - if provided, will filter nav items
  checkModuleAccess?: (module: string) => boolean
  
  // Optional company selector
  companySelector?: React.ReactNode
  
  // Optional store selector
  storeSelector?: React.ReactNode
  
  // Optional footer content (besides user profile)
  footerContent?: React.ReactNode
  
  // Slots for custom content
  prependContent?: React.ReactNode  // Content before nav groups
  appendContent?: React.ReactNode   // Content after nav groups
  
  // Styling options
  variant?: 'light' | 'dark'
  
  // Custom user avatar component
  renderUserAvatar?: (user: SidebarUser) => React.ReactNode
  
  // Custom role badge component
  renderRoleBadge?: (role: string) => React.ReactNode
  
  // Callbacks
  onNavigate?: () => void
}

// Default user avatar component
function DefaultUserAvatar({ user }: { user: SidebarUser }) {
  const safeName = typeof user.name === 'string' ? user.name : user.email ?? ''
  const initials =
    safeName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
      {initials}
    </div>
  )
}

// Default role badge component
function DefaultRoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: 'bg-blue-100', text: 'text-blue-800' },
    SUPERVISOR: { bg: 'bg-green-100', text: 'text-green-800' },
    CASHIER: { bg: 'bg-gray-100', text: 'text-gray-800' },
    HR: { bg: 'bg-purple-100', text: 'text-purple-800' },
  }

  const colors = roleColors[role.toUpperCase()] || roleColors.CASHIER

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text
      )}
    >
      {role}
    </span>
  )
}

// Individual nav item component
function NavItemComponent({
  item,
  pathname,
  onNavigate,
  checkModuleAccess,
  variant = 'light',
  Link,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
  checkModuleAccess?: (module: string) => boolean
  variant?: 'light' | 'dark'
  Link: React.ComponentType<any>
}) {
  // Check permission if module is specified
  const hasAccess = item.module && checkModuleAccess ? checkModuleAccess(item.module) : true

  if (!hasAccess) {
    return null
  }

  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  const handleClick = () => {
    item.onClick?.()
    onNavigate?.()
  }

  const baseStyles = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  
  const lightStyles = isActive
    ? 'bg-gray-100 text-gray-900 font-semibold'
    : 'text-gray-600 hover:text-gray-900'
  
  const darkStyles = isActive
    ? 'bg-gray-800 text-white'
    : 'text-gray-300 hover:bg-gray-800 hover:text-white'

  return (
    <Link
      to={item.href}
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(baseStyles, variant === 'dark' ? darkStyles : lightStyles)}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          variant === 'dark'
            ? isActive
              ? 'text-white'
              : 'text-gray-400'
            : isActive
              ? 'text-gray-900'
              : 'text-gray-500'
        )}
      />
      <span>{item.title}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

// Icon-only nav item for mobile
function IconNavItem({
  item,
  pathname,
  onNavigate,
  checkModuleAccess,
  variant = 'light',
  Link,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
  checkModuleAccess?: (module: string) => boolean
  variant?: 'light' | 'dark'
  Link: React.ComponentType<any>
}) {
  const hasAccess = item.module && checkModuleAccess ? checkModuleAccess(item.module) : true

  if (!hasAccess) {
    return null
  }

  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  const handleClick = () => {
    item.onClick?.()
    onNavigate?.()
  }

  const lightStyles = isActive
    ? 'bg-indigo-600 text-white shadow-sm'
    : 'text-slate-600 hover:bg-slate-100'
  
  const darkStyles = isActive
    ? 'bg-gray-800 text-white shadow-sm'
    : 'text-gray-400 hover:bg-gray-800 hover:text-white'

  return (
    <Link
      to={item.href}
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      title={item.title}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        variant === 'dark' ? darkStyles : lightStyles
      )}
    >
      <Icon className="h-5 w-5" />
    </Link>
  )
}

// Navigation group component
function NavGroupComponent({
  group,
  pathname,
  onNavigate,
  checkModuleAccess,
  variant,
  Link,
}: {
  group: NavGroup
  pathname: string
  onNavigate?: () => void
  checkModuleAccess?: (module: string) => boolean
  variant?: 'light' | 'dark'
  Link: React.ComponentType<any>
}) {
  // Filter items by permissions
  const visibleItems = group.items.filter((item) => {
    if (!item.module || !checkModuleAccess) return true
    return checkModuleAccess(item.module)
  })

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          {group.title}
        </h3>
      </div>
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            checkModuleAccess={checkModuleAccess}
            variant={variant}
            Link={Link}
          />
        ))}
      </div>
    </div>
  )
}

export function Sidebar({
  navGroups,
  user,
  branding,
  isLoadingUser = false,
  onLogout,
  navigation,
  checkModuleAccess,
  companySelector,
  storeSelector,
  footerContent,
  prependContent,
  appendContent,
  variant = 'light',
  renderUserAvatar,
  renderRoleBadge,
  onNavigate,
}: SidebarProps) {
  const pathname = navigation.usePathname()
  const Link = navigation.Link

  const UserAvatar = renderUserAvatar
    ? () => renderUserAvatar(user!)
    : () => <DefaultUserAvatar user={user!} />

  const RoleBadge = renderRoleBadge
    ? ({ role }: { role: string }) => renderRoleBadge(role)
    : DefaultRoleBadge

  const sidebarBg = variant === 'dark' ? 'bg-gray-900' : 'bg-slate-50'
  const borderColor = variant === 'dark' ? 'border-gray-700' : 'border-slate-200'
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900'

  return (
    <>
      {/* Mobile icon rail */}
      <aside
        className={cn(
          'lg:hidden sticky top-0 z-40 h-screen w-16 shrink-0 border-r shadow-xl',
          sidebarBg,
          borderColor
        )}
        aria-label="Navegación principal"
        role="navigation"
      >
        <div className="flex h-full flex-col items-center py-4">
          <Link
            to="/"
            href="/"
            className={cn(
              'mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white',
              variant === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'
            )}
            aria-label="Ir al inicio"
          >
            {branding.shortName}
          </Link>
          <ScrollArea className="flex-1 w-full">
            <nav className="flex flex-col items-center gap-2 py-2" aria-label="Navegación principal">
              {navGroups.map((group) => (
                <div key={group.title} className="flex flex-col items-center gap-2">
                  {group.items.map((item) => (
                    <IconNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={onNavigate}
                      checkModuleAccess={checkModuleAccess}
                      variant={variant}
                      Link={Link}
                    />
                  ))}
                </div>
              ))}
            </nav>
          </ScrollArea>
          <div className="pt-3">
            {user && (
              <Link
                to="/account"
                href="/account"
                onClick={onNavigate}
                aria-label="Ver mi cuenta"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl',
                  variant === 'dark' ? 'bg-gray-800' : 'bg-slate-100'
                )}
              >
                <UserAvatar />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex sticky top-0 z-40 h-screen shrink-0 border-r shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none',
          sidebarBg,
          borderColor
        )}
        aria-label="Navegación principal"
        role="navigation"
      >
        <div className={cn('flex h-full flex-col', sidebarBg)}>
          {/* Header */}
          <div className={cn('border-b px-4 py-3 min-w-0', borderColor)}>
            {companySelector || storeSelector ? (
              <div className="space-y-3">
                {companySelector}
                {storeSelector}
              </div>
            ) : (
              <div className="flex items-center gap-2 min-h-11 px-1">
                {branding.logo}
                <h1 className={cn('text-lg font-bold truncate', textColor)}>{branding.name}</h1>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className={cn('flex-1', sidebarBg)}>
            <nav className={cn('p-4 space-y-4', sidebarBg)} aria-label="Navegación principal">
              {prependContent && (
                <div className="mb-4">
                  {prependContent}
                </div>
              )}
              {navGroups.map((group, groupIndex) => (
                <div key={group.title}>
                  <NavGroupComponent
                    group={group}
                    pathname={pathname}
                    onNavigate={onNavigate}
                    checkModuleAccess={checkModuleAccess}
                    variant={variant}
                    Link={Link}
                  />
                  {groupIndex < navGroups.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
              {appendContent && (
                <div className="mt-4 pt-4 border-t">
                  {appendContent}
                </div>
              )}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className={cn('border-t p-4', sidebarBg, borderColor)}>
            {footerContent}
            {isLoadingUser ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ) : user ? (
              <div className="space-y-3">
                <Link
                  to="/account"
                  href="/account"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    variant === 'dark'
                      ? 'hover:bg-gray-800 text-white'
                      : 'hover:bg-gray-100'
                  )}
                  onClick={onNavigate}
                  aria-label="Ver mi cuenta"
                >
                  <UserAvatar />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', textColor)}>
                      {user.name || user.email}
                    </p>
                    {user.role && (
                      <div className="mt-1">
                        <RoleBadge role={user.role} />
                      </div>
                    )}
                  </div>
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors font-medium"
                  >
                    Cerrar Sesión
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}
