"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import toast from "react-hot-toast";

const RulesPage = () => {
  const [rules, setRules] = useState<any>([]);
  const [newRule, setNewRule] = useState<any>("");

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

  const addRule = async () => {
    try {
      const response = await axios.post(
        "/api/admin/rules",
        { rule: newRule },
        {
          headers: { "x-admin-id": "your-admin-id-here" },
        }
      );
      setRules([...rules, response.data.rules]);
      setNewRule("");
      toast.success("Rule added successfully");
    } catch (error) {
      toast.error("Failed to add rule");
    }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`/api/admin/rules/${id}`, {
        headers: { "x-admin-id": "your-admin-id-here" },
      });
      setRules(rules.filter((rule) => rule._id !== id));
      toast.success("Rule deleted successfully");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  return (
    <div className="container mx-auto p-4">
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Rule Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter new rule"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={addRule}>Add Rule</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>{rule.rule}</TableCell>
                  <TableCell className="text-right">
                    <Button
                     
                      onClick={() => deleteRule(rule._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesPage;
