"use client";

import React, { useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useDispatch } from "react-redux";
import { loginAdmin } from "@/lib/features/auth";
import { useRouter } from "next/navigation";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: "", password: "" });
  const dispatch = useDispatch<any>();
  const router = useRouter()
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAuthData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const submitForm = async () => {
    try {
      setLoading(true);
      const { payload } = await dispatch(loginAdmin(authData));
      setLoading(false);
      if (payload && payload.success) {
        router.push('/admin/dashboard')
      } else {
        // Handle login failure (e.g., show error message)
      }
    } catch (error) {
      setLoading(false);
      // Handle any errors that occur during login
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style>
        {
          `
                .navbar-main{
                display:none}
                `
        }
      </style>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Admin Login
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                placeholder="Enter your Email"
                className="pl-10"
                value={authData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={authData.password}
                placeholder="Enter your password"
                className="pl-10"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={submitForm} className="w-full bg-black text-white hover:bg-black" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
