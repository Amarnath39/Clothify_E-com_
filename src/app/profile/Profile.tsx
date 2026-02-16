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
  const [errors, setErrors] = useState<{ name?: string }>({});


  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };
  const validateName = (name: string) => {
    if (!name.trim()) {
      return "Name is required";
    }

    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      return "Name should contain only letters";
    }

    return "";
  };

  const validateZipCode = (zipCode: string) => {
    if (zipCode.length !== 6) {
      return "Pin Code must be 6 digits";
    }

    if (!/^\d{6}$/.test(zipCode)) {
      return "Pin Code must contain only digits";
    }

    if (zipCode.startsWith("0")) {
      return "Pin Code cannot start with 0";
    }

    return "";
  };


  // const handleNewAddressChange = (e) => {
  //   setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  // };

  const handleNewAddressChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;

    setNewAddress((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name") {
      const error = validateName(value);
      setErrors((prev) => ({
        ...prev,
        name: error,
      }));
    }
  };

  const validateMobile = (mobile: string) => {
    if (mobile.length !== 10) {
      return "Mobile number must be 10 digits";
    }

    if (!/^[6-9]/.test(mobile)) {
      return "Mobile number must start with 6, 7, 8, or 9";
    }

    return "";
  };


  const handleSubmit = () => {
    const error = validateMobile(newAddress.mobile);

    if (error) {
      toast.error(error);
      return;
    }

    // proceed submit
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
    const mobileError = validateMobile(newAddress.mobile);
    if (mobileError) {
      toast.error(mobileError);
      return;
    }

    const zipError = validateZipCode(newAddress.zipCode);
    if (zipError) {
      toast.error(zipError);
      return;
    }

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
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-roboto">
      <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-quicksand">
              Account Profile
            </h1>
            <p className="text-slate-500 max-w-lg">
              Manage your personal information and delivery addresses for a better shopping experience.
            </p>
          </div>
          {addresses.length > 0 && cartItems.length > 0 && (
            <Button
              onClick={() => router.push("/cart")}
              className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl px-6 h-11 flex items-center gap-2 shadow-sm"
            >
              <FaCartPlus className="w-4 h-4" />
              Go to Cart
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Personal Info Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <div className="flex items-center gap-3 text-brand">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold font-quicksand text-slate-900">Personal Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {isProfileIncomplete && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[13px] text-red-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <p className="font-medium">Complete your profile to place orders.</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Name</Label>
                    <div className="relative group">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand transition-colors" />
                      <Input
                        id="name"
                        name="name"
                        value={personalInfo.name}
                        onChange={handlePersonalInfoChange}
                        placeholder="Full Name"
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <div className="relative group">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        value={personalInfo.email}
                        onChange={handlePersonalInfoChange}
                        placeholder="Email Address"
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone</Label>
                    <div className="relative group">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand transition-colors" />
                      <Input
                        id="phone"
                        name="phone"
                        value={personalInfo.phone}
                        onChange={handlePersonalInfoChange}
                        placeholder="Phone Number"
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-1 focus:ring-brand transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleUpdateProfile}
                    className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={profileUpdating || !isFormValid}
                  >
                    {profileUpdating ? <FiLoader className="animate-spin h-4 w-4" /> : 'Update Info'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addresses Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-brand">
                <div className="p-2 bg-brand/10 rounded-lg">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-quicksand text-slate-900">Saved Addresses</h2>
              </div>

              <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => { setEditingAddress(null); setNewAddress(initialAddressState); }}
                    className="h-10 bg-slate-900 hover:bg-black text-white font-bold rounded-xl px-4 flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add New Address</span>
                    <span className="sm:hidden text-xs">Add New</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[480px] h-[75vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
                  <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl font-bold text-slate-900 font-quicksand">
                        {editingAddress ? "Update Address" : "New Address"}
                      </DialogTitle>
                    </div>
                    <button onClick={() => setIsAddressModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                      <X className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="addr-name" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recipient Name</Label>
                        <Input id="addr-name" name="name" value={newAddress.name} onChange={handleNewAddressChange} className={errors.name ? "border-red-500 rounded-xl" : "rounded-xl"} />
                        {errors.name && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.name}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr-text" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Address Details</Label>
                        <Textarea id="addr-text" name="address" value={newAddress.address} onChange={handleNewAddressChange} className="min-h-[100px] rounded-xl resize-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-mobile" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Mobile Number</Label>
                          <Input type="tel" id="addr-mobile" name="mobile" value={newAddress.mobile} onChange={(e) => {
                            const val = e.target.value;
                            if (!/^\d*$/.test(val) || val.length > 10 || (val.length === 1 && !/^[6-9]$/.test(val))) return;
                            handleNewAddressChange(e);
                          }} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-city" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">City</Label>
                          <Input id="addr-city" name="city" value={newAddress.city} onChange={handleNewAddressChange} className="rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-state" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">State</Label>
                          <Select name="state" value={newAddress.state} onValueChange={(value) => handleNewAddressChange({ target: { name: "state", value } })}>
                            <SelectTrigger className="rounded-xl font-medium">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-[250px] z-[9999]">
                              {indianStates.map((s, i) => <SelectItem key={i} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-zip" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pin Code</Label>
                          <Input id="addr-zip" name="zipCode" value={newAddress.zipCode} onChange={(e) => {
                            const val = e.target.value;
                            if (!/^\d*$/.test(val) || val.length > 6 || (val.length === 1 && val === "0")) return;
                            handleNewAddressChange(e);
                          }} className="rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Country</Label>
                          <Select name="country" value={newAddress.country} onValueChange={(value) => handleNewAddressChange({ target: { name: "country", value } })}>
                            <SelectTrigger className="rounded-xl font-medium">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl z-[9999]">
                              <SelectItem value="India">India</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Type</Label>
                          <Select name="addressType" value={newAddress.addressType} onValueChange={(value) => handleNewAddressChange({ target: { name: "addressType", value } })}>
                            <SelectTrigger className="rounded-xl font-medium">
                              <SelectValue placeholder="Home/Work" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl z-[9999]">
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 mt-auto border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                    <Button variant="ghost" onClick={() => setIsAddressModalOpen(false)} className="rounded-xl font-bold text-slate-500">Cancel</Button>
                    <Button onClick={handleAddressSubmit} className="bg-brand hover:bg-brand-dark text-white font-bold rounded-xl px-6 min-w-[120px]">{editingAddress ? "Update Address" : "Save Address"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Address Grid */}
            {addresses.length === 0 ? (
              <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 flex items-center justify-center rounded-full mx-auto mb-6">
                  <FiMapPin className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-quicksand">No addresses yet</h3>
                <p className="text-slate-400 text-sm mb-8">Add your first shipping address to get started.</p>
                <Button onClick={() => setIsAddressModalOpen(true)} variant="outline" className="rounded-xl px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">
                  <FiPlus className="mr-2 h-4 w-4" /> Add Address
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {addresses.map((addr) => (
                  <div key={addr._id} className={`group relative bg-white p-6 rounded-2xl border transition-all duration-300 ${addr.isDefault ? 'border-brand/40 shadow-sm shadow-brand/5' : 'border-slate-100 hover:border-brand/20 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg">{addr.addressType}</span>
                        {addr.isDefault && <span className="px-2.5 py-1 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-lg border border-brand/10">Default</span>}
                      </div>
                      <div className="flex gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEditAddress(addr)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr._id)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1.5">{addr.name}</h4>
                        <div className="text-slate-500 text-[13px] leading-relaxed">
                          <p>{addr.address}</p>
                          <p>{addr.city}, {addr.state}</p>
                          <p>{addr.country} - {addr.zipCode}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-brand text-xs font-bold bg-brand/5 w-fit px-3 py-1.5 rounded-lg border border-brand/5">
                        <FiPhone className="w-3.5 h-3.5" />
                        <span>{addr.mobile}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={addr._id === defaultAddress}
                            onCheckedChange={() => handleSetDefaultAddress(addr._id)}
                            className="data-[state=checked]:bg-brand"
                          />
                          <Label className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 cursor-pointer uppercase tracking-widest">Default</Label>
                        </div>

                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefaultAddress(addr._id)} className="text-[10px] font-bold uppercase tracking-tighter text-slate-300 hover:text-brand transition-colors">Set Regular</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
