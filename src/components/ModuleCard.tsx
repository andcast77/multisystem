import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@multisystem/ui";
import { ArrowRight, Lock } from "lucide-react";

type ModuleCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
  href?: string;
  disabled?: boolean;
};

export function ModuleCard({
  icon,
  title,
  description,
  features,
  href,
  disabled = false,
}: ModuleCardProps) {
  const content = (
    <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-primary/10 group">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className="text-5xl p-3 rounded-lg bg-secondary/60 group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
          {disabled && <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>
          {features && features.length > 0 && (
            <ul className="space-y-3 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
        {!disabled ? (
          <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
            Acceder <ArrowRight className="w-4 h-4" />
          </div>
        ) : (
          <div className="text-muted-foreground font-medium text-sm opacity-60">
            Próximamente
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div className="opacity-75 cursor-not-allowed">{content}</div>;
  }

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
