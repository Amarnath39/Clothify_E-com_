"use client";

import React from "react";
import { Card } from "@/theme/components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FiPackage } from "react-icons/fi";

const ProductSalesChart = ({ performanceOverView }: { performanceOverView: any[] }) => {
  const truncateName = (name: string, maxLength = 20) => {
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{truncateName(label, 40)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{entry.name}:</p>
              <p className="text-sm font-black text-gray-900">
                {entry.name === "Revenue" ? `₹${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-gray-900 leading-tight">Product Performance</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Revenue vs Units Sold</p>
        </div>
        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
          <FiPackage size={20} />
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={performanceOverView}
            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={false}
              height={10}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(val) => `₹${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar
              yAxisId="left"
              dataKey="totalUnitsSold"
              fill="#E91E7B"
              name="Units Sold"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="#7C1D3E"
              name="Revenue"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProductSalesChart;
