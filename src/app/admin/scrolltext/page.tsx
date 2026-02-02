"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const ScrollTextPage = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchText();
  }, []);

  const fetchText = async () => {
    try {
      const res = await fetch("/api/scrolltext");
      const data = await res.json();
      setText(data.text);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Scroll Text</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scroll Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text to display in the marquee"
            rows={4}
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default ScrollTextPage;