
'use client';

import { useState, useEffect } from 'react';
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
import { smsLogin, emailLogin } from "@/lib/features/auth/actions";
import { createSlice } from "@reduxjs/toolkit";
import Modal from '@/components/ui/Modal'; // Update the path as per your file structure



// Country code list
const countryCodes = [{ code: '+91', country: 'India', flag: '🇮🇳' },
];


const Login = () => {
  const dispatch = useDispatch<any>();

  const [otp, setOtp] = useState('');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"email" | "sms">("email");
  const [emailLoginType, setEmailLoginType] = useState<'password' | 'otp'>('password');

  //pop up
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
  }>({
    title: '',
    description: '',
    type: 'info',
  });

  const showModal = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModalContent({ title, description, type });
    setModalOpen(true);
  };
  const [agree, setAgree] = useState(false);

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

      // toast({ title: 'Login Successful', description: 'Welcome!' });

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
      // toast({ title: 'OTP Sent', description: `Check ${emailData.email}` });
      showModal('OTP Sent', `Check your inbox at ${emailData.email}`, 'success');
    } catch (err: any) {
      // toast({ title: 'Error', description: err.message, variant: 'destructive' });
      showModal('Error', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };



  const handleVerifyEmailOtp = async (e: any) => {
    e.preventDefault();

    // if (emailData.otp.length !== 6) {
    //   return toast({ title: 'Complete OTP', variant: 'destructive' });
    // }

    // if (!emailData.email) {
    //   return toast({ title: 'Missing Email', variant: 'destructive' });
    // }
    if (emailData.otp.length !== 6) {
      return showModal('Incomplete OTP', 'Please enter the full 6-digit OTP.', 'error');
    }

    if (!emailData.email) {
      return showModal('Missing Email', 'Please provide your email address.', 'error');
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

      // showModal('Login Successful', 'Welcome!', 'success');

      router.push('/profile');

      // Optional: Delay full reload for smoother UX
      setTimeout(() => {
        window.location.href = '/profile';
      }, 1000);

    } catch (err: any) {
      showModal('Error', err.message, 'error');
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
      return showModal('Missing Phone Number', 'Please enter your phone number to proceed.', 'error');
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

      showModal('OTP Sent', `OTP has been sent to ${smsData.countryCode} ${smsData.phone}`, 'success');

    } catch (error: any) {
      showModal('Error Sending OTP', error.message || 'Something went wrong.', 'error');


    } finally {

      setIsLoading(false);

    }

  };



  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (smsData.otp.length !== 6) {
      return showModal('Invalid OTP', 'Please enter the complete 6-digit OTP.', 'error');
    }

    if (!smsData.sessionId) {
      return showModal('Session Expired', 'Your OTP session has expired. Please request a new OTP.', 'error');
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

      showModal('Success', 'Phone verified!', 'success');

      await dispatch(smsLogin({ phone: smsData.phone.trim() }));

      router.push("/profile");
      setTimeout(() => {
        window.location.href = '/profile';
      }, 1000);

    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when 6-digit OTP entered
  useEffect(() => {
    if (smsData.otp.length === 6) handleVerifyOtp({ preventDefault: () => { } } as React.FormEvent);
  }, [smsData.otp]);

  useEffect(() => {
    if (emailData.otp.length === 6) handleVerifyEmailOtp({ preventDefault: () => { } });
  }, [emailData.otp]);



  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-roboto">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <img src="/assets/static/logo/ogimage.png" alt="Swaarasya" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-quicksand">
            Account Login
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Select your preferred method to continue
          </p>
        </div>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'email' | 'sms')}
              className="w-full"
            >
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1 rounded-xl h-12">
                  <TabsTrigger
                    value="email"
                    className="flex items-center gap-2 rounded-lg text-slate-500 data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow-sm border-none font-semibold text-xs h-full transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </TabsTrigger>
                  <TabsTrigger
                    value="sms"
                    className="flex items-center gap-2 rounded-lg text-slate-500 data-[state=active]:bg-white data-[state=active]:text-brand data-[state=active]:shadow-sm border-none font-semibold text-xs h-full transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                {/* SMS Authentication Flow */}
                <TabsContent value="sms" className="space-y-6 m-0 outline-none">
                  {!smsOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                          Mobile Number
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={smsData.countryCode}
                            onValueChange={(code) => setSmsData((prev) => ({ ...prev, countryCode: code }))}
                          >
                            <SelectTrigger className="w-[90px] h-11 bg-white border-slate-200 rounded-xl focus:ring-1 focus:ring-brand font-medium text-sm">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 shadow-lg rounded-xl">
                              {countryCodes.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                  className="text-slate-700 hover:bg-slate-50 cursor-pointer rounded-lg m-1 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="relative flex-1">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="00000 00000"
                              value={smsData.phone}
                              onChange={(e) => setSmsData((prev) => ({ ...prev, phone: e.target.value }))}
                              className="pl-10 h-11 border-slate-200 rounded-xl focus:ring-1 focus:ring-brand transition-all text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 px-1">
                        <input
                          type="checkbox"
                          id="agree-sms"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer accent-brand"
                        />
                        <label htmlFor="agree-sms" className="text-[12px] text-slate-500 leading-normal select-none cursor-pointer">
                          By continuing, you agree to our <a href="/policy/privacy-policy" className="text-brand font-bold hover:underline">Privacy Policy</a> and <a href="/policy/terms-condition" className="text-brand font-bold hover:underline">Terms of Service</a>.
                        </label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={isLoading || !agree}
                      >
                        {isLoading ? (
                          <div className="loader !border-slate-100/30 !border-t-white" />
                        ) : (
                          <>
                            Send Access Code
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                          <Check className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Verify Identity</h3>
                        <p className="text-slate-500 text-sm mt-1">
                          Code sent to <span className="font-bold text-slate-900">{smsData.countryCode} {smsData.phone}</span>
                        </p>
                      </div>

                      <div className="flex justify-center py-2">
                        <OTPInput
                          value={smsData.otp}
                          onChange={(otp) => setSmsData((prev) => ({ ...prev, otp }))}
                          numInputs={6}
                        />
                      </div>

                      <div className="space-y-4">
                        <Button
                          onClick={handleVerifyOtp}
                          className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all"
                          disabled={isLoading}
                        >
                          {isLoading ? <div className="loader" /> : 'Complete Sign In'}
                        </Button>
                        <button
                          type="button"
                          className="w-full text-xs text-slate-400 hover:text-brand font-bold transition-colors"
                          onClick={() => setSmsOtpSent(false)}
                        >
                          Change phone number
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Email Authentication Flow */}
                <TabsContent value="email" className="space-y-6 m-0 outline-none">
                  {!emailOtpSent ? (
                    <form onSubmit={handleSendEmailOtp} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email-otp" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="email-otp"
                            type="email"
                            placeholder="e.g. name@domain.com"
                            value={emailData.email}
                            onChange={(e) => setEmailData((prev) => ({ ...prev, email: e.target.value }))}
                            className="pl-10 h-11 border-slate-200 rounded-xl focus:ring-1 focus:ring-brand transition-all text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-3 px-1">
                        <input
                          type="checkbox"
                          id="agree-email"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer accent-brand"
                        />
                        <label htmlFor="agree-email" className="text-[12px] text-slate-500 leading-normal select-none cursor-pointer">
                          By continuing, you agree to our <a href="/policy/privacy-policy" className="text-brand font-bold hover:underline">Privacy Policy</a> and <a href="/policy/terms-condition" className="text-brand font-bold hover:underline">Terms of Service</a>.
                        </label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={isLoading || !agree}
                      >
                        {isLoading ? (
                          <div className="loader !border-slate-100/30 !border-t-white" />
                        ) : (
                          <>
                            Proceed with Email
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                          <Check className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Check Your Inbox</h3>
                        <p className="text-slate-500 text-sm mt-1">
                          Access code sent to <br />
                          <span className="font-bold text-slate-900">{emailData.email}</span>
                        </p>
                      </div>

                      <div className="flex justify-center py-2">
                        <OTPInput
                          value={emailData.otp}
                          onChange={(otp) => setEmailData((prev) => ({ ...prev, otp }))}
                          numInputs={6}
                        />
                      </div>

                      <div className="space-y-4">
                        <Button
                          onClick={handleVerifyEmailOtp}
                          className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl shadow-md transition-all"
                          disabled={isLoading}
                        >
                          {isLoading ? <div className="loader" /> : 'Verify & Continue'}
                        </Button>
                        <button
                          type="button"
                          className="w-full text-xs text-slate-400 hover:text-brand font-bold transition-colors"
                          onClick={() => setEmailOtpSent(false)}
                        >
                          Use different email
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Member of{' '}
            <a href="https://www.webgeon.com/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand transition-colors underline-offset-4 decoration-slate-200">
              Webgeon Results
            </a>
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        description={modalContent.description}
        type={modalContent.type}
      />
    </div>
  );

};


export default Login;




