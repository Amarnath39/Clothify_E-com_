"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, verifyOtp } from "@/lib/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FiUser, FiLock } from "react-icons/fi";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import BloodRedButton from "@/components/BloodButton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { MdEmail } from "react-icons/md";
import { getAllBanner } from "@/lib/features/banner";
import { shuffleArray }  from "@/helpers/helpers";

const Login = () => {
  const dispatch = useDispatch<any>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [banner, setBanner] = useState<any[]>([]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerify, setIsVerify] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  useEffect(() => {
    setIsEmailValid(validateEmail(email));
  }, [email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isEmailValid) return;
    setIsLoading(true);
    try {
      const { payload } = await dispatch(login({ name, email }));

      if (payload.success) {
        toast.success(payload.msg);
        setIsOtpSent(true);
        setResendCooldown(30);
      } else {
        toast.error(payload.msg);
      }
      setIsLoading(false);
    } catch (error) {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const { payload } = await dispatch(login({ name, email }));

      if (payload.success) {
        toast.success("OTP resent successfully");
        setResendCooldown(30);
      } else {
        toast.error(payload.msg);
      }
      setIsLoading(false);
    } catch (error) {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsVerify(true);
    try {
      const { payload } = await dispatch(verifyOtp({ email, otp }));

      if (payload.success) {
        toast.success(payload.msg);
        router.back();
      } else {
        toast.error(payload.msg);
      }
      setIsVerify(false);
    } catch (error) {
      toast.error("Something went wrong");
      setIsVerify(false);
    }
  };

  const getBanners = async () => {
    const { payload }: any = await dispatch(getAllBanner());
    if (payload.success) {
      setBanner(shuffleArray(payload.banners));
    }
  };

  useEffect(() => {
    getBanners();
  }, []);

  return (
    <div
      className="min-h-[130vh] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${banner[0]?.img})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <form className="w-full max-w-md lg:max-w-lg  mx-4 z-10">
        <Card className="bg-white shadow-2xl rounded-3xl overflow-hidden border-0">
          <div className="bg-white text-gray-800 py-8 px-8">
            <h2 className="text-3xl font-bold">Welcome </h2>
            <p className="text-gray-700 mt-2">
              Sign in or Create a new account
            </p>
          </div>
          <CardContent className="px-8 py-4 space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <FiUser className="absolute top-4 left-3 text-gray-400" />
                <Input
                  required
                  id="name"
                  placeholder="Name"
                  className="pl-10 py-6 bg-gray-50 border-gray-200 focus:border-black focus:ring-black transition rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <MdEmail className="absolute top-4 left-3 text-gray-400" />
                <Input
                  required
                  id="email"
                  type="email"
                  placeholder="Email"
                  className={`pl-10 py-6 bg-gray-50 border-gray-200 focus:border-black focus:ring-black transition rounded-lg ${
                    email && !isEmailValid ? "border-red-500" : ""
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email && !isEmailValid && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>
            </div>

            {isOtpSent && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiLock className="mr-2" /> Enter OTP
                </label>
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
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="link"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm"
                  >
                    {resendCooldown > 0
                      ? `Resend OTP (${resendCooldown}s)`
                      : "Resend OTP"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 px-8 py-6">
            <BloodRedButton
              className="w-full"
              onClick={isOtpSent ? handleVerifyOtp : handleLogin}
              loading={isLoading || isVerify}
              disabled={!isEmailValid || isLoading || isVerify}
            >
              {isOtpSent ? "Verify OTP" : "Submit"}
            </BloodRedButton>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default Login;
