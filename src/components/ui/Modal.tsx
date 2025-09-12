'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

const iconMap = {
  success: <CheckCircle className="w-12 h-12 text-green-500" />, // Increased size
  error: <XCircle className="w-12 h-12 text-red-500" />,
  info: <Info className="w-12 h-12 text-blue-500" />,
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type = 'info',
}) => {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
           

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
                {iconMap[type]}
              </div>

             {/* Title */}
<h2 className="text-2xl font-bold text-gray-800 tracking-wide">{title}</h2>

{/* Optional Description */}
{description && (
  <p className="text-base text-gray-500 mt-1 leading-relaxed">{description}</p>
)}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
