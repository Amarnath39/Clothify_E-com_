"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiLoader,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllAddress,
  makeDefaultAddress,
  updateAddress,
  deleteAddress,
  AddNewAddress,
  setAddressState,
} from "@/lib/features/address";
import toast from "react-hot-toast";
import { getUserDetails, updateUserDetails } from "@/lib/features/auth";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FaCartPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { indianStates } from "./state";

const Profile = () => {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    _id: "",
  });
  const dispatch = useDispatch<any>();
  const [addresses, setAddresses] = useState<any[]>([]);

  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState("");
  const [userDetails, setUserDetails] = useState<any>({});
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const cartItems = useSelector((state: any) => state.cart.items);
  const { token } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const initialAddressState = {
    address: "",
    mobile: "",
    country: "India",
    state: "",
    name: "",
    addressType: "Home",
    zipCode: "",
    city: "",
  };

  console.log(addresses, "address");

  const [newAddress, setNewAddress] = useState(initialAddressState);

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleNewAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const callGetAllAddress = async () => {
    try {
      const { payload } = await dispatch(getUserDetails());

      if (payload.success) {
        setAddresses(payload?.user?.address);
        setPersonalInfo({
          name: payload?.user?.name,
          email: payload.user.email,
          phone: payload.user.phone,
          _id: payload.user._id,
        });

        setNewEmail(payload.user.email);
        setUserDetails(payload.user);
        if (payload?.user?.defaultAddress) {
          setDefaultAddress(payload?.user?.defaultAddress?._id);
          dispatch(setAddressState(payload?.user?.defaultAddress?.state));
        }
      } else {
        // toast.error(payload.msg);
        toast.error("Please Login First");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
    callGetAllAddress();
  }, []);

  const handleAddressSubmit = async () => {
    // Check if any field is empty

    const isAnyFieldEmpty = Object.values(newAddress).some(
      (value) => typeof value === "string" && value.trim() === ""
    );

    if (isAnyFieldEmpty) {
      toast.error("Please fill in all address fields");
      return;
    }

    try {
      let payload;
      if (editingAddress) {
        payload = await dispatch(
          updateAddress({
            id: editingAddress._id,
            address: newAddress,
          })
        );
      } else {
        payload = await dispatch(AddNewAddress(newAddress));
      }

      if (payload.payload.success) {
        toast.success(payload.payload.msg);
        setNewAddress(initialAddressState);
        setIsAddressModalOpen(false);
        callGetAllAddress();
      } else {
        toast.error(payload.payload.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to add/update address");
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const { payload } = await dispatch(deleteAddress(id));
      if (payload.success) {
        toast.success(payload.msg);
        callGetAllAddress();
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const { payload } = await dispatch(
        makeDefaultAddress({
          addressId: id,
        })
      );
      if (payload.success) {
        toast.success(payload.msg);
        callGetAllAddress();
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to set default address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (personalInfo.email !== newEmail) {
      await updateProfile();
      setNewEmail(personalInfo.email);
      setIsOtpModalOpen(true);
    } else {
      await updateProfile();
    }
  };

  const updateProfile = async () => {
    setProfileUpdating(true);
    try {
      const payloadApi = {
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
      };
      const { payload } = await dispatch(updateUserDetails(payloadApi));
      if (payload.success) {
        toast.success(payload.msg);
      } else {
        toast.error(payload.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setProfileUpdating(true);
      const response = await fetch("/api/user/email-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newEmail, otp }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Email verified successfully");
        setIsOtpModalOpen(false);
      } else {
        toast.error(data.msg || "Email verification failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to verify email");
    } finally {
      setProfileUpdating(false);
    }
  };

  const isProfileIncomplete =
    !personalInfo.name || !personalInfo.email || !personalInfo.phone;

  const isNameValid = personalInfo.name && personalInfo.name.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email);
  const isPhoneValid = /^\d{10}$/.test(personalInfo.phone);

  const isFormValid = isNameValid && isEmailValid && isPhoneValid;

  return (
    <div className="container mx-auto p-6 space-y-6 mt-20">
      <div className=" mx-auto py-8 sm:min-w-[70vw]">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-gray-900">
            Personal Information
          </h2>
          <div className="mt-1 h-1 w-20 bg-gradient-to-r from-gray-800 to-gray-400 rounded-full" />
          {isProfileIncomplete && (
            <p className="mt-4 text-red-500 text-sm flex items-center">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2" />
              Please complete your profile to order
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-6 sm:space-y-0 sm:flex gap-4 flex-row items-center ">
          <div className="relative group ">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiUser className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            </div>
            <Input
              name="name"
              value={personalInfo.name}
              onChange={handlePersonalInfoChange}
              placeholder="Name"
              className="pl-10 py-6 bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-all"
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-800 group-focus-within:w-full transition-all duration-300" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiMail className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            </div>
            <Input
              name="email"
              value={personalInfo.email}
              onChange={handlePersonalInfoChange}
              placeholder="Email"
              className="pl-10 py-6 bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-all"
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-800 group-focus-within:w-full transition-all duration-300" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiPhone className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            </div>
            <Input
              name="phone"
              value={personalInfo.phone}
              onChange={handlePersonalInfoChange}
              placeholder="Phone"
              className="pl-10 py-6 bg-gray-50 border-gray-200 rounded-lg focus:bg-white transition-all"
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-800 group-focus-within:w-full transition-all duration-300" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={handleUpdateProfile}
            className="w-full py-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 max-w-96"
            disabled={profileUpdating || !isFormValid}
          >
            {profileUpdating ? (
              <>
                <FiLoader className="animate-spin h-5 w-5" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Personal Info</span>
            )}
          </Button>
        </div>
      </div>
      {addresses.length > 0 && cartItems.length > 0 && (
        <div className="text-right">
          <Button onClick={() => router.push("/cart")} className="py-5">
            <FaCartPlus className="mr-2" /> Proceed to Cart
          </Button>
        </div>
      )}

      {/* <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to your email {personalInfo.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <InputOTP
              required
              value={otp}
              onChange={(otp) => setOtp(otp)}
              maxLength={6}
            >
              <InputOTPGroup className="gap-2">
                {[1, 1, 1, 1, 1, 1].map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="rounded-lg border-gray-200 focus:border-black focus:ring-black transition"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button onClick={handleVerifyEmail} className="w-full">
              {profileUpdating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      <div className="mx-auto py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-medium text-gray-900">
              Shipping Addresses
            </h2>
            <div className="mt-1 h-0.5 w-20 bg-gradient-to-r from-gray-900 to-gray-400" />
          </div>

          <Dialog
            open={isAddressModalOpen}
            onOpenChange={setIsAddressModalOpen}
          >
            <DialogTrigger asChild>
              <div
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg flex items-center cursor-pointer z-[9999]"
                onClick={() => {
                  setEditingAddress(null);
                  setNewAddress(initialAddressState);
                }}
              >
                <FiPlus className="md:mr-2" />{" "}
                <span className="hidden md:block"> Add New </span>
              </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] h-[75vh] mt-4 overflow-y-scroll">
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  {editingAddress
                    ? "Edit your shipping address details below."
                    : "Enter your new shipping address details."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newAddress.name}
                    onChange={handleNewAddressChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={newAddress.address}
                    onChange={handleNewAddressChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mobile" className="text-right">
                    Mobile
                  </Label>
                  <Input
                    type="number"
                    id="mobile"
                    name="mobile"
                    value={newAddress.mobile}
                    onChange={handleNewAddressChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="state" className="text-right">
                    State
                  </Label>
                  <Select
                    name="state"
                    value={newAddress.state}
                    required
                    onValueChange={(value) =>
                      handleNewAddressChange({
                        target: { name: "state", value },
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="z-50" style={{ zIndex: 99999 }}>
                      {indianStates.map((item, index) => {
                        return (
                          <SelectItem key={index} value={item}>
                            {item}
                          </SelectItem>
                        );
                      })}
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="country" className="text-right">
                    Country
                  </Label>
                  <Select
                    name="country"
                    required
                    value={newAddress.country}
                    onValueChange={(value) =>
                      handleNewAddressChange({
                        target: { name: "country", value },
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="pt-10">
                      <SelectItem value="India">India</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="zipCode" className="text-right">
                    Pin Code
                  </Label>
                  <Input
                    type="number"
                    id="zipCode"
                    name="zipCode"
                    required
                    value={newAddress.zipCode}
                    onChange={handleNewAddressChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="addressType" className="text-right">
                    Type
                  </Label>
                  <Select
                    name="addressType"
                    value={newAddress.addressType}
                    required
                    onValueChange={(value) =>
                      handleNewAddressChange({
                        target: { name: "addressType", value },
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Address Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="text-white bg-black hover:bg-gray-800" onClick={handleAddressSubmit}>
                {editingAddress ? "Update Address" : "Add Address"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty State */}
        {addresses.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No addresses yet
            </h3>
            <p className="mt-2 text-gray-500">
              Add your first shipping address to get started
            </p>
            <Button
              onClick={() => setIsAddressModalOpen(true)}
              className="mt-6 bg-gray-900 hover:bg-gray-800 text-white"
            >
              <FiPlus className="mr-2" /> Add New Address
            </Button>
          </div>
        ) : (
          // Addresses Grid
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="group relative bg-white p-6 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200"
              >
                {/* Default Badge */}
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}

                {/* Address Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{addr.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {addr.addressType}
                    </span>
                  </div>

                  <div className="text-gray-600 text-sm space-y-1">
                    <p>{addr.address}</p>
                    <p>
                      {addr.city}, {addr.state}
                    </p>
                    <p>
                      {addr.country} - {addr.zipCode}
                    </p>
                    <p className="text-gray-500">Phone: {addr.mobile}</p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={addr._id === defaultAddress}
                        onCheckedChange={() =>
                          handleSetDefaultAddress(addr._id)
                        }
                        className="data-[state=checked]:bg-gray-900"
                      />
                      <Label className="text-sm text-gray-600">
                        Set as default
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAddress(addr)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
