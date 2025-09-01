
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  numInputs: number;
}

const OtpInput = ({ value, onChange, numInputs }: OtpInputProps) => {
  const [otp, setOtp] = useState(Array(numInputs).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, numInputs);
      const paddedOtp = [...otpArray, ...Array(numInputs - otpArray.length).fill('')];
      setOtp(paddedOtp);
    }
  }, [value, numInputs]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (digit && index < numInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const digits = pastedData.slice(0, numInputs).split('');
    const newOtp = [...Array(numInputs).fill('')];
    
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });
    
    setOtp(newOtp);
    onChange(newOtp.join(''));
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(digits.length, numInputs - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {otp.map((digit, index) => (
        <Input
          key={index}
ref={(el) => {
  inputRefs.current[index] = el;
}}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300"
          style={{'--tw-ring-color': '#bbe4ca', '--tw-border-opacity': '1'} as React.CSSProperties}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default OtpInput;
