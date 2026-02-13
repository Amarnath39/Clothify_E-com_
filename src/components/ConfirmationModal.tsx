

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/theme/components";
import { FiAlertTriangle } from "react-icons/fi";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-[#7C1D3E] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
            <FiAlertTriangle size={32} />
          </div>
          <AlertDialogTitle className="text-xl font-black uppercase tracking-wide">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70 font-medium text-sm mt-2">
            {message}
          </AlertDialogDescription>
        </div>

        <div className="p-6 bg-white space-y-3">
          <AlertDialogFooter className="flex-col gap-3 sm:space-x-0">
            <AlertDialogAction asChild>
              <Button
                variant="primary"
                className="w-full h-12 rounded-xl text-sm font-bold shadow-xl shadow-[#7C1D3E]/20"
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </AlertDialogAction>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-bold border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 mt-0"
                onClick={onClose}
              >
                {cancelText}
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
