"use client";

import React, { useEffect, useState } from "react";

import { FaDollarSign, FaUsers, FaChartLine, FaRedoAlt } from "react-icons/fa";

import SalesGraph from "./SalesGraph";
import ProductSalesChart from "./ProductSalesChart";
import MostSellingProductsPage from "./TopSelling";
import SalesDataTable from "./Sales";
import StatCard from "./StateCard";
import axios from "axios";
import toast from "react-hot-toast";

const OrdersPage = () => {
  const [stats, setStats] = useState<any>({});
  const [salesOverView, setSalesOverView] = useState<any>([]);
  const [performanceOverView, setPerformanceOverview] = useState<any>([]);
  const [mostSelling, setMostSelling] = useState<any>([]);
  const [salesData, setSalesData] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`/api/admin/dashboard/stats`);
      
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {}
  };

  const fetchSalesoverview = async () => {
    try {
      const { data } = await axios.get(`/api/admin/dashboard/salesoverview`);

      if (data.success) {
        setSalesOverView(data.salesData);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {}
  };

  const fetchPerformanceOverView = async () => {
    try {
      const { data } = await axios.get(
        `/api/admin/dashboard/productperformance`
      );

      if (data.success) {
        setPerformanceOverview(data.topProducts);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {}
  };

  const fetchMostSellingProduct = async () => {
    const queryParams = new URLSearchParams({
      page: page.toString(),

      search: searchTerm,
    });
    try {
      const { data } = await axios.get(`/api/admin/dashboard/mostselling`);

      if (data.success) {
        setMostSelling(data.mostSellingProducts);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchPerformanceOverView();
    fetchSalesoverview();
    fetchStats();

    fetchMostSellingProduct();
  }, []);

  return (
    <div className="container mx-auto px-6 pt-4 pb-2 space-y-6">
      <div className="space-y-2 flex flex-col items-start">
        <img 
          src="/assets/static/logo/2_4__1_-removebg-preview (1).png" 
          alt="Logo" 
          className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 object-contain"
          style={{ marginTop: 0, marginBottom: 0 }}
        />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={stats.totalSales}
          icon={FaChartLine}
          description="Total number of sales"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={FaDollarSign}
          description="Total revenue generated"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FaUsers}
          description="Total number of registered users"
        />
        <StatCard
          title="Repeat Orders"
          value={stats.repeatOrders}
          icon={FaRedoAlt}
          description="Number of repeat orders"
        />
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <SalesGraph salesOverView={salesOverView} />
        <ProductSalesChart performanceOverView={performanceOverView} />
      </div> */}

      <div className="grid grid-cols-1 ">
        <MostSellingProductsPage />
      </div>
      {/* <div className="grid grid-cols-1 ">
        <SalesDataTable />
      </div> */}
    </div>
  );
};

export default OrdersPage;
