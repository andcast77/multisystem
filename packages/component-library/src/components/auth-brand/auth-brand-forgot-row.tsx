import * as React from "react";

/**
 * Right-aligned row for “¿Olvidaste tu contraseña?” — child should apply
 * {@link AUTH_BRAND_FORGOT_LINK_CLASS} on the anchor/Link.
 */
export function AuthBrandForgotPasswordRow({ children }: { children: React.ReactNode }) {
  return <div className="text-right">{children}</div>;
}
