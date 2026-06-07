"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, ZapanInput, PageHeader, Card as ZapanCard, Badge } from "@/theme/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiPlus, FiTrash2, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";

const RulesPage = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get("/api/rules");
      setRules(response.data.rules);
    } catch (error) {
      toast.error("Failed to fetch rules");
    }
  };

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post("/api/admin/rules", { rule: newRule });
      setRules([...rules, response.data.rules]);
      setNewRule("");
      toast.success("Rule added successfully");
      setLoading(false);
    } catch (error) {
      toast.error("Failed to add rule");
      setLoading(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await axios.delete(`/api/admin/rules/${id}`);
      setRules(rules.filter((rule) => rule._id !== id));
      toast.success("Rule deleted successfully");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Shopping Rules"
        description="Define rules and policies for product orders and customer behavior."
        action={
          <Badge variant="neutral">
            <FiAlertCircle className="mr-2" /> Policy Management
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add Rule Section */}
        <div className="lg:col-span-1">
          <ZapanCard className="p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#7C1D3E]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#7C1D3E]">
                <FiPlus size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Add New Rule</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new policy statement to display to customers.</p>
            </div>

            <form onSubmit={addRule} className="space-y-4">
              <ZapanInput
                label="Rule Description"
                placeholder="e.g., No returns on sale items"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                required
              />
              <Button
                className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest"
                type="submit"
                disabled={loading || !newRule.trim()}
              >
                {loading ? "Adding..." : "Add Rule"}
              </Button>
            </form>
          </ZapanCard>
        </div>

        {/* Rules List */}
        <div className="lg:col-span-2">
          <ZapanCard className="overflow-hidden border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Active Rules</h3>
              <Badge variant="neutral" className="bg-white">{rules.length} Items</Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 w-full">Rule Statement</TableHead>
                    <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-wider py-4 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-12 text-gray-400">
                        No rules found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                        <TableCell className="py-4 px-6 font-medium text-gray-700">
                          <div className="flex items-start gap-3">
                            <FiCheckCircle className="text-green-500 mt-1 shrink-0" size={16} />
                            <span>{rule.rule}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule._id)}
                            className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ZapanCard>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
