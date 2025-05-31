
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, Newspaper, Users, Receipt, TrendingUp, Calendar } from "lucide-react";
import CustomerList from "@/components/CustomerList";
import DailyEntry from "@/components/DailyEntry";
import MonthlyBills from "@/components/MonthlyBills";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-3 py-2 rounded-lg">
                <Milk className="h-6 w-6" />
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Daily Drop Ledger</h1>
                <p className="text-sm text-gray-600">Vendor Distribution Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Daily Entry</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Monthly Bills</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerList />
          </TabsContent>

          <TabsContent value="daily">
            <DailyEntry />
          </TabsContent>

          <TabsContent value="bills">
            <MonthlyBills />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
