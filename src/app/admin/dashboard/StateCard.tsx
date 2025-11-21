import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatCard = ({ title, value, icon: Icon, description }) => {
  // Handle cases where value might be an object or null
  const getDisplayValue = () => {
    if (value === undefined || value === null) return "—";

    if (typeof value === "object" && value.overall !== undefined) {
      return value.overall; // show only overall
    }

    return value; // fallback for normal number/string
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{getDisplayValue()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
