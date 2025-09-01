import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const dummyProductSales = [
  { name: 'Product A', sales: 4000, revenue: 80000, profit: 20000 },
  { name: 'Product B', sales: 3000, revenue: 60000, profit: 15000 },
  { name: 'Product C', sales: 2000, revenue: 40000, profit: 10000 },
  { name: 'Product D', sales: 2780, revenue: 55600, profit: 13900 },
  { name: 'Product E', sales: 1890, revenue: 37800, profit: 9450 },
];

const ProductSalesChart = () => {
  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <CardTitle>Product Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dummyProductSales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip 
              formatter={(value, name:any) => [
                `${name === 'profit' ? '$' : ''}${value.toLocaleString()}`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Units Sold" />
            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
            <Bar yAxisId="right" dataKey="profit" fill="#ffc658" name="Profit ($)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductSalesChart;