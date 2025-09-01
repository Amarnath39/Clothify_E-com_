

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Mail, Phone, Lock, ArrowRight, Check } from 'lucide-react';
import OTPInput from '@/components/ui/OTPInput';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { smsLogin,emailLogin } from "@/lib/features/auth/actions";
import { createSlice } from "@reduxjs/toolkit";




// Country code list
const countryCodes = [  { code: '+91', country: 'India', flag: '🇮🇳' },
];


const Login = () => {
  const dispatch = useDispatch<any>();

  const [otp, setOtp] = useState('');
const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sms' | 'email'>('sms');
  const [emailLoginType, setEmailLoginType] = useState<'password' | 'otp'>('password');

  const [emailData, setEmailData] = useState<{
    email: string;
    password: string;
    otp: string;
    sessionId?: string;
  }>({
    email: '',
    password: '',
    otp: '',
    sessionId: undefined,
  });
  const handleForgotPassword = () => {
    // Redirect to your password reset page
    router.push('/reset-password');
  };
  const [smsData, setSmsData] = useState<{
    countryCode: string;
    phone: string;
    otp: string;
    sessionId?: string;
  }>({
    countryCode: '+91',
    phone: '',
    otp: '',
    sessionId: undefined,
  });
  const [smsOtpSent, setSmsOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!emailData.email || !emailData.password) {
    return toast({
      title: "Missing Fields",
      description: "Please enter both email and password.",
      variant: "destructive",
    });
  }

  setIsLoading(true);

  try {
    const response = await fetch("/api/auth/loginwithpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailData.email.trim(),
        password: emailData.password,
        type: "login", // 👈 REQUIRED!
      }),
    });

    const res = await response.json();

    if (!response.ok) {
      if (
        res.msg === "User not found. Please register." ||
        res.msg === "Email, password, and type are required"
      ) {
        router.push(
          `/register?${new URLSearchParams({ email: emailData.email })}`
        );
        return;
      }
      throw new Error(res.msg || "Login failed");
    }

    await dispatch(emailLogin({ email: emailData.email.trim() }));

    toast({ title: 'Login Successful', description: 'Welcome!' });

    router.push('/profile');
    setTimeout(() => {
      window.location.href = '/profile';
    }, 1000);
  } catch (err: any) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};



  const handleSendEmailOtp = async (e: any) => {
  e.preventDefault();

  if (!emailData.email) return toast({ title: 'Enter email', variant: 'destructive' });

  setIsLoading(true);

  try {
    const r = await fetch('/api/auth/loginwithemail/sendotp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailData.email }),
    });

    const res = await r.json();

    if (!r.ok) {
      if (['Email not registered'].includes(res.message || res.error)) {
        router.push(`/register?${new URLSearchParams({ email: emailData.email })}`);
        return;
      }
      throw new Error(res.error || 'OTP send failed');
    }

    setEmailOtpSent(true);
    toast({ title: 'OTP Sent', description: `Check ${emailData.email}` });
  } catch (err: any) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};



const handleVerifyEmailOtp = async (e: any) => {
  e.preventDefault();

  if (emailData.otp.length !== 6) {
    return toast({ title: 'Complete OTP', variant: 'destructive' });
  }

  if (!emailData.email) {
    return toast({ title: 'Missing Email', variant: 'destructive' });
  }

  setIsLoading(true);

  try {
    const r = await fetch('/api/auth/loginwithemail/verifyotp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailData.email,
        otp: emailData.otp,
      }),
    });

    const res = await r.json();

    if (!r.ok) {
      if (
        ['Member not found with this email'].includes(res.message || res.error)
      ) {
        router.push(`/register?${new URLSearchParams({ email: emailData.email })}`);
        return;
      }
      throw new Error(res.error || 'OTP verify failed');
    }

    // ✅ Redux dispatch just like SMS login
    await dispatch(emailLogin({ email: emailData.email.trim() }));

    toast({ title: 'Login Successful', description: 'Welcome!' });

    router.push('/profile');
    setTimeout(() => {
      window.location.href = '/profile';
    }, 1000);
  } catch (err: any) {
    toast({ title: 'Error', description: err.message, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};
const [phoneNumber, setPhoneNumber] = useState('');
<input
  type="tel"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
  placeholder="Enter phone number"
/>

  const handleSendOtp = async (e: any) => {

  e.preventDefault();
 
  if (!smsData.phone) {

    return toast({ title: 'Enter phone number', variant: 'destructive' });

  }
 
  setIsLoading(true);
 
  try {

    const response = await fetch('/api/auth/loginwithotp/sendotp', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ phone: smsData.phone.trim() }),

    });
 
    const res = await response.json();
 
    if (!response.ok) throw new Error(res.error || 'OTP send failed');
 
    setSmsData((prev) => ({ ...prev, sessionId: res.sessionId }));

    setSmsOtpSent(true);

    toast({ title: 'OTP Sent', description: `Sent to ${smsData.phone}` });

  } catch (error: any) {

    toast({ title: 'Error', description: error.message, variant: 'destructive' });

  } finally {

    setIsLoading(false);

  }

};

 

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (smsData.otp.length !== 6) {
      return toast({ title: 'Enter 6-digit OTP', variant: 'destructive' });
    }

    if (!smsData.sessionId) {
      return toast({ title: 'Session expired. Try again.', variant: 'destructive' });
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/loginwithotp/verifyotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: smsData.sessionId,
          otp: smsData.otp.trim(),
        }),
      });

      const res = await response.json();

      if (!response.ok) throw new Error(res.error || 'OTP verification failed');

      toast({ title: 'Success', description: 'Phone verified!' });
      await dispatch(smsLogin({ phone: smsData.phone.trim()}));
      router.push("/profile");
      setTimeout(() => {
  window.location.href = '/profile';
}, 1000);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <img
          src="/assets/static/logo/shopping1.png"
          alt="Fitness Background"
          className="object-cover object-center w-full h-[850px]"
        />
      </div>

<div className="flex items-center justify-center w-full md:w-1/2 px-4" style={{ backgroundColor: '#fafaf9' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-[#902371] bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-700 font-medium">Choose your preferred login method</p>
          </div>

          <Card className="w-full max-w-md shadow-xl border-2 rounded-2xl">
            <CardHeader
  className="text-white bg-white px-8 py-6" // px = horizontal, py = vertical
>
  <div className="flex justify-center">
    <img src="/assets/static/logo/bg-removed.png" alt="Logo" className="h-[70px] w-[250px]" />
  </div>
</CardHeader>


            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'email' | 'sms')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                  <TabsTrigger value="sms" className="flex items-center gap-2 data-[state=active]:bg-white text-gray-800">
                    <Phone className="w-4 h-4" /> SMS
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:bg-white text-gray-800">
                    <Mail className="w-4 h-4" /> Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sms" className="space-y-4 animate-fade-in">
                  {!smsOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <Label htmlFor="phone" className="text-gray-800 font-semibold">Phone Number</Label>
                      <div className="flex gap-2">
                        <Select value={smsData.countryCode} onValueChange={(value) => setSmsData(prev => ({ ...prev, countryCode: value }))}>
                          <SelectTrigger className="w-32 h-12 border-gray-200 text-gray-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code} className="text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={smsData.phone}
                            onChange={(e) => setSmsData(prev => ({ ...prev, phone: e.target.value }))}
                            className="pl-10 h-12 border-gray-200 text-gray-800"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 text-white font-semibold rounded-lg" style={{ background: 'linear-gradient(to right, #902371, #d63384)' }}
 disabled={isLoading}>
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#bbe4ca' }}>
                          <Check className="w-8 h-8 text-gray-800" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">OTP Sent!</h3>
                        <p className="text-gray-700 text-sm">
                          Enter the 6-digit code sent to<br />
                          <span className="font-medium text-gray-900">
                            {smsData.countryCode} {smsData.phone}
                          </span>
                        </p>
                      </div>
                      <OTPInput
  value={smsData.otp}
  onChange={(otp) => setSmsData((prev) => ({ ...prev, otp }))}
  numInputs={6}
/>

                      <Button type="submit" className="w-full h-12 text-gray-800 font-semibold rounded-lg" style={{ background: 'linear-gradient(to right, #902371, #d63384)' }}
 disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-gray-700" onClick={() => setSmsOtpSent(false)}>
                        Change phone number
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="email" className="space-y-4 animate-fade-in">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
  <Button
    type="button"
    size="sm"
    className={`flex-1 text-xs ${
      emailLoginType === 'password'
        ? 'bg-[#902371] text-white hover:bg-[#7e1e64]'
        : 'bg-transparent text-[#902371] hover:bg-[#f3e6f0]'
    }`}
    onClick={() => {
      setEmailLoginType('password');
      setEmailOtpSent(false);
    }}
  >
    Password
  </Button>

  <Button
    type="button"
    size="sm"
    className={`flex-1 text-xs ${
      emailLoginType === 'otp'
        ? 'bg-[#902371] text-white hover:bg-[#7e1e64]'
        : 'bg-transparent text-[#902371] hover:bg-[#f3e6f0]'
    }`}
    onClick={() => {
      setEmailLoginType('otp');
      setEmailOtpSent(false);
    }}
  >
    OTP
  </Button>
</div>


                  {emailLoginType === 'password' ? (
                    <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                      <Label htmlFor="email" className="text-gray-800 font-semibold">Email Address</Label>
                      <Input id="email" type="email" placeholder="Enter email" value={emailData.email} onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))} required />
                      <Label htmlFor="password" className="text-gray-800 font-semibold">Password</Label>
                      <Input id="password" type="password" placeholder="Enter password" value={emailData.password} onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))} required />
                      <div className="text-right">
                        <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:underline">
                          Forgot Password?
                        </button>
                      </div>
                      <Button type="submit" className="w-full h-12 text-white font-semibold rounded-lg" style={{ background: 'linear-gradient(to right, #902371, #d63384)' }}
 disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In with Password'}
                      </Button>
                    </form>
                  ) : !emailOtpSent ? (
                    <form onSubmit={handleSendEmailOtp} className="space-y-4">
                      <Label htmlFor="email-otp" className="text-gray-800 font-semibold">Email Address</Label>
                      <Input id="email-otp" type="email" placeholder="Enter email" value={emailData.email} onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))} required />
                      <Button type="submit" className="w-full h-12 text-white font-semibold rounded-lg" style={{ background: 'linear-gradient(to right, #902371, #d63384)' }}
 disabled={isLoading}>
                        {isLoading ? 'Sending OTP...' : 'Send Email OTP'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#bbe4ca' }}>
                          <Check className="w-8 h-8 text-gray-800" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">OTP Sent!</h3>
                        <p className="text-gray-700 text-sm">
                          Enter the 6-digit code sent to<br />
                          <span className="font-medium text-gray-900">{emailData.email}</span>
                        </p>
                      </div>
                    <OTPInput
  value={emailData.otp}
  onChange={(otp) => setEmailData((prev) => ({ ...prev, otp }))}
  numInputs={6}
/>

                      <Button type="submit" className="w-full h-12 text-gray-800 font-semibold rounded-lg" style={{ background: 'linear-gradient(to right, #902371, #d63384)' }}
 disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-gray-700" onClick={() => setEmailOtpSent(false)}>
                        Change email address
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Powered by{' '}
              <a href="https://www.webgeon.com/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 font-medium underline text-gray-700">
                Webgeon Results
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

// };

// export default Login;
