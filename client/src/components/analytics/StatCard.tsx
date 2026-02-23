import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  testId?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, testId }: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
