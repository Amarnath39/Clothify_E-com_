"use client";

// components/ExchangeModal.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiUpload } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDispatch } from "react-redux";
import { getOrdersData } from "@/lib/features/order";
import toast from "react-hot-toast";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  id: string;
  fetchOrderDetails: () => void;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  orderId,
  id,
  fetchOrderDetails,
}) => {
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const dispatch = useDispatch<any>();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: any = new FormData();
    formData.append("orderId", id);
    formData.append("reason", reason);
    images.forEach((image) => {
      formData.append(`file`, image);
    });

    try {
      const response = await fetch("/api/order/exchange", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onClose();
        toast("Exchange Processing");
        fetchOrderDetails();
      } else {
        // Handle error
        console.error("Exchange request failed");
      }
    } catch (error) {
      console.error("Error submitting exchange request:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Exchange</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for Exchange</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for the exchange..."
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="images">Upload Images</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files || []))}
              className="mt-1"
            />
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FiUpload className="mr-2" />
              <span>Upload up to 5 images</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit Exchange Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
