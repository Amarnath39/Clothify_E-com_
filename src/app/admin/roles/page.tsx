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
import {
  PageHeader,
  Card,
  Button,
  Badge,
  ZapanInput,
} from "@/theme/components";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FiPlus, FiTrash2, FiInfo, FiMail, FiUser, FiShield, FiLock } from "react-icons/fi";
import { LuLoader } from "react-icons/lu";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setLoading(true);
    try {
      const response = await fetch("/api/admin/user", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      const filteredUsers = data.users.filter((user: any) => user.role !== "SuperAdmin");
      setUsers(filteredUsers);
    } catch (err) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin({ ...newAdmin, [name]: value });
  };

  const handleRoleChange = (value: string) => {
    setNewAdmin({ ...newAdmin, role: value });
  };

  const handleSubmitNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/user/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) throw new Error("Failed to create admin");

      toast.success("Admin created successfully");
      setIsModalOpen(false);
      setNewAdmin({ name: "", email: "", password: "", role: "Admin" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Error creating admin");
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/user/${userId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete user");
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (err: any) {
        toast.error(err.message || "Error deleting user");
      }
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update user role");
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Error updating user role");
    }
  };

  const roleInfo: any = {
    Admin: "Full administrative access excluding manage other admins.",
    SuperAdmin: "Full system access including root configurations.",
    "Sales person": "Restricted access to orders, products and inventory.",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Admin Management"
        description="Invite and manage staff members with specific roles and permissions."
        action={
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <FiPlus className="mr-2" size={16} /> Add New Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 text-center">
                  Create Staff Member
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitNewAdmin} className="pt-4 space-y-6">
                <ZapanInput
                  label="Full Name"
                  name="name"
                  value={newAdmin.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
                <ZapanInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
                <ZapanInput
                  label="Temporary Password"
                  type="password"
                  name="password"
                  value={newAdmin.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Assign Role</label>
                  <Select value={newAdmin.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50/50">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl z-[99999]" position="popper">
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Sales person">Sales Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl h-12" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button className="flex-[1.5] rounded-xl h-12 shadow-lg shadow-[#7C1D3E]/10 font-bold uppercase tracking-widest text-xs" type="submit">Create Account</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden border-gray-100 shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">User Info</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Assigned Role</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-center">Status</TableHead>
                <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E] mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-gray-400">
                    <FiShield className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No staff accounts found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-none">{user.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user._id, newRole)}
                        >
                          <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs rounded-lg border-gray-100 bg-white/50 focus:ring-[#7C1D3E]/20">
                            <SelectValue placeholder={user.role} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Sales person">Sales Person</SelectItem>
                          </SelectContent>
                        </Select>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 cursor-help hover:text-[#7C1D3E] hover:bg-[#7C1D3E]/10 transition-colors">
                                <FiInfo size={12} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 text-white border-none p-3 rounded-xl shadow-xl">
                              <p className="text-xs max-w-[200px] leading-relaxed">{roleInfo[user.role]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Badge variant={user.role === 'Admin' ? 'brand' : 'neutral'}>
                        ACTIVE
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(user._id)}
                        className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <FiTrash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminPage;
