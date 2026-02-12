"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, StatCardSimple } from "@/theme/components";
import { TrendingUp, Users, DollarSign, RotateCcw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import TopSellingProducts from "./TopSelling";
import SalesGraph from "./SalesGraph";
import ProductSalesChart from "./ProductSalesChart";

const DashboardPage = () => {
  const [stats, setStats] = useState<any>({});
  const [salesOverView, setSalesOverView] = useState<any>([]);
  const [performanceOverView, setPerformanceOverview] = useState<any>([]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`/api/admin/dashboard/stats`);
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSalesoverview = async () => {
    try {
      const { data } = await axios.get(`/api/admin/dashboard/salesoverview`);
      if (data.success) {
        setSalesOverView(data.salesData);
      }
    } catch (error) { }
  };

  const fetchPerformanceOverView = async () => {
    try {
      const { data } = await axios.get(`/api/admin/dashboard/productperformance`);
      if (data.success) {
        setPerformanceOverview(data.topProducts);
      }
    } catch (error) { }
  };

  useEffect(() => {
    fetchStats();
    fetchSalesoverview();
    fetchPerformanceOverView();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Dashboard"
        description="Monitor your store's performance, track sales, and analyze customer behavior."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSimple
          label="Total Revenue"
          value={`₹${stats.totalRevenue?.overall?.toLocaleString() || "0"}`}
          icon={<DollarSign size={20} className="text-white" />}
          change="+12.5%"
          changePositive={true}
          highlighted
        />
        <StatCardSimple
          label="Total Sales"
          value={stats.totalSales || "0"}
          icon={<TrendingUp size={20} className="text-[#7C1D3E]" />}
          change="+8.2%"
          changePositive={true}
        />
        <StatCardSimple
          label="New Customers"
          value={stats.totalUsers || "0"}
          icon={<Users size={20} className="text-[#E91E7B]" />}
          change="+24%"
          changePositive={true}
        />
        <StatCardSimple
          label="Repeat Orders"
          value={stats.repeatOrders || "0"}
          icon={<RotateCcw size={20} className="text-[#C2185B]" />}
          change="-2.4%"
          changePositive={false}
        />
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesGraph salesOverView={salesOverView} />
        <ProductSalesChart performanceOverView={performanceOverView} />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-black text-gray-900 leading-tight">Top Performing Products</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Inventory & Sales Analysis</p>
        </div>
        <TopSellingProducts />
      </div>
    </div>
  );
};

export default DashboardPage;

