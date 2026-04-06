import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { AUTH_BRAND_CARD_CLASS } from "./tokens";

export interface AuthBrandCardProps {
  cardTitle: React.ReactNode;
  cardDescription: React.ReactNode;
  children: React.ReactNode;
  /** Rendered inside CardContent after children (e.g. login footer links outside &lt;form&gt;) */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Glass card shell for login/register MFA/main form — same structure everywhere.
 */
export function AuthBrandCard({
  cardTitle,
  cardDescription,
  children,
  footer,
  className,
}: AuthBrandCardProps) {
  return (
    <Card className={`${AUTH_BRAND_CARD_CLASS}${className ? ` ${className}` : ""}`}>
      <CardHeader>
        <CardTitle className="text-white">{cardTitle}</CardTitle>
        <CardDescription className="text-white/60">{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {footer}
      </CardContent>
    </Card>
  );
}
