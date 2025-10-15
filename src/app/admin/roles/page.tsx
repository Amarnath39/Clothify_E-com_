"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoIcon } from "lucide-react";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/user", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      // Filter out SuperAdmin users
      const filteredUsers = data.users.filter(
        (user) => user.role !== "SuperAdmin"
      );
      setUsers(filteredUsers);
    } catch (err) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin({ ...newAdmin, [name]: value });
  };

  const handleRoleChange = (value) => {
    setNewAdmin({ ...newAdmin, role: value });
  };

  const handleSubmitNewAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/user/add-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) {
        throw new Error("Failed to create admin");
      }

      const data = await response.json();
      toast.success("Admin created successfully");
      setShowAdminForm(false);
      setNewAdmin({ name: "", email: "", password: "", role: "Admin" });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Error creating admin");
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/user/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        const data = await response.json();
        toast.success(data.message || "User deleted successfully");
        fetchUsers();
      } catch (err) {
        toast.error(err.message || "Error deleting user");
      }
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      const data = await response.json();
      toast.success(data.message || "User role updated successfully");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Error updating user role");
    }
  };

  const roleInfo = {
    Admin: "Has access to everything except admin management",
    SuperAdmin: "Has access to everything",
    "Sales person": "Has access to products and orders",
  };

  return (
    <div className="container mx-auto px-4 py-8">
     
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <Button className="bg-black text-white hover:bg-black" onClick={() => setShowAdminForm(!showAdminForm)}>
          Add Admin
        </Button>
      </div>

      {showAdminForm && (
        <form onSubmit={handleSubmitNewAdmin} className="mb-8 space-y-4">
          <Input
            type="text"
            id="name"
            name="name"
            value={newAdmin.name}
            onChange={handleInputChange}
            placeholder="Name"
            required
          />
          <Input
            type="email"
            id="email"
            name="email"
            value={newAdmin.email}
            onChange={handleInputChange}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            id="password"
            name="password"
            value={newAdmin.password}
            onChange={handleInputChange}
            placeholder="Password"
            required
          />
          <Select value={newAdmin.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Sales person">Sales Person</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-black text-white hover:bg-black" type="submit">Create Admin</Button>
        </form>
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={user.role}
                      onValueChange={(newRole) =>
                        updateUserRole(user._id, newRole)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder={user.role} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Sales person">
                          Sales Person
                        </SelectItem>
                        {/* <SelectItem value="SuperAdmin">SuperAdmin</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button  size="icon">
                            <InfoIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{roleInfo[user.role]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Button
                   
                    onClick={() => deleteUser(user._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminPage;
