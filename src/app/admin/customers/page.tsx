"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AdminUserPage = () => {
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

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
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: any) => {
    try {
      const response = await fetch("/api/admin/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to make user an admin");
      }

      const data = await response.json();
      toast.success(data.message);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error)
    return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin User Management</h1>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Addresses
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-4 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-4 whitespace-nowrap">{user.phone}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {user.address ? user.address.length : 0}
                </td>
                <td className="px-4 py-4">
                  {user.defaultAddress ? (
                    <div>
                      <p>{user.defaultAddress.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.defaultAddress.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.defaultAddress.mobile}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.defaultAddress.country},{" "}
                        {user.defaultAddress.state} -{" "}
                        {user.defaultAddress.zipCode}
                      </p>
                      <p className="text-xs text-gray-400">
                        Type: {user.defaultAddress.addressType}
                      </p>
                    </div>
                  ) : (
                    "No default address"
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                {/* <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => makeAdmin(user._id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                  >
                    Make Admin
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserPage;
