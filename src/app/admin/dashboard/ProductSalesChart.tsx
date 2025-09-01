import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ProductSalesChart = ({ performanceOverView }) => {
  const truncateName = (name, maxLength = 30) => {
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <CardTitle>Product Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px] ">
        <div className=" h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceOverView}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={false}
                height={20}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "totalUnitsSold") {
                    return [value.toLocaleString(), "Units Sold"];
                  } else if (name === "revenue") {
                    return [`$${value.toLocaleString()}`, "Revenue"];
                  }
                  return [value, name]; // Fallback for any other data keys
                }}
                labelFormatter={(label) => `Product: ${truncateName(label)}`}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="totalUnitsSold"
                fill="#8884d8"
                name="Units Sold"
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="#82ca9d"
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSalesChart;