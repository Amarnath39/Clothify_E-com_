"use client";

import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  SearchInput,
  Badge,
} from "@/theme/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LuLoader, LuUser, LuMail, LuPhone, LuMapPin } from "react-icons/lu";

const AdminUserPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/customer");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LuLoader className="w-8 h-8 animate-spin text-[#7C1D3E]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Customers"
        description="View and manage your registered customers and their contact information."
      />

      <Card className="p-6">
        <div className="w-full max-w-md">
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Search Customers</label>
          <SearchInput
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(val: string) => setSearchTerm(val)}
          />
        </div>
      </Card>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-100">
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Customer Info</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Contact</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Default Address</TableHead>
                  <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6">Registration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-gray-500">
                      No customers found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C1D3E] to-[#E91E7B] flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase() || <LuUser />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Badge variant="neutral" className="text-[9px] h-4">ID: {user._id.slice(-6)}</Badge></span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-600 flex items-center gap-2"><LuMail className="text-gray-400" size={14} /> {user.email}</span>
                          <span className="text-sm text-gray-600 flex items-center gap-2"><LuPhone className="text-gray-400" size={14} /> {user.phone || "No phone"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 min-w-[300px]">
                        {user.defaultAddress ? (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-gray-800 text-xs">{user.defaultAddress.name}</p>
                              <Badge variant="brand" className="text-[8px] h-4 uppercase">{user.defaultAddress.addressType}</Badge>
                            </div>
                            <p className="text-[11px] text-gray-500 flex items-start gap-1">
                              <LuMapPin className="mt-0.5 flex-shrink-0" size={10} />
                              {user.defaultAddress.address}, {user.defaultAddress.city}, {user.defaultAddress.state} - {user.defaultAddress.zipCode}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No default address set</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.address?.length || 0} Saved Addresses</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminUserPage;
