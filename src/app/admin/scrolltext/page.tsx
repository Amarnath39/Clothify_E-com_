"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

const ScrollTextPage = () => {
  const [text, setText] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchText();
  }, []);

  const fetchText = async () => {
    try {
      const res = await fetch("/api/scrolltext");
      const data = await res.json();
      setText(data.text);
      setIsVisible(data.isVisible);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch scroll text",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrolltext", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Scroll text updated successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update scroll text",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    setIsVisible(checked);
    try {
      const res = await fetch("/api/scrolltext", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: checked }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Marquee ${checked ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setIsVisible(!checked); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update marquee visibility",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Marquee Text</h1>
      <div className="space-y-6">
        {/* Visibility Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <label className="text-sm font-medium">Marquee Visibility</label>
            <p className="text-sm text-gray-600">Enable or disable the marquee text display on the website</p>
          </div>
          <Switch
            checked={isVisible}
            onCheckedChange={handleVisibilityToggle}
          />
        </div>

        {/* Text Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Marquee Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text to display in the marquee"
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Text"}
        </Button>
      </div>
    </div>
  );
};

export default ScrollTextPage;