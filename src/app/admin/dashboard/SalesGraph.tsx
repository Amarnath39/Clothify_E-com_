import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { name: "Jan", totalSales: 4000, onlineSales: 2400, target: 3800 },
  { name: "Feb", totalSales: 3000, onlineSales: 1800, target: 3500 },
  { name: "Mar", totalSales: 5000, onlineSales: 3000, target: 4000 },
  { name: "Apr", totalSales: 4500, onlineSales: 2700, target: 4200 },
  { name: "May", totalSales: 6000, onlineSales: 3600, target: 4500 },
  { name: "Jun", totalSales: 5500, onlineSales: 3300, target: 5000 },
];

const SalesGraph = ({salesOverView}) => {
  const formatCurrency = (value) => `₹${value.toLocaleString()}`;

  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={salesOverView}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value, name: any) => [
                formatCurrency(value),
                name.replace(/([A-Z])/g, " $1").trim(),
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalSales"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Total Sales"
            />
            {/* <Line
              type="monotone"
              dataKey="onlineSales"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
              name="Online Sales"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#ff7300"
              strokeDasharray="5 5"
              name="Sales Target"
            /> */}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesGraph;
