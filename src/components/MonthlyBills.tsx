
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Eye, Milk, Newspaper, Calculator, IndianRupee } from "lucide-react";

const MonthlyBills = () => {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  
  const bills = [
    {
      id: 1,
      customerName: "Rajesh Kumar",
      route: "Route A",
      milkQuantity: 30,
      milkRate: 55,
      newspaperDays: 28,
      newspaperRate: 4,
      totalMilk: 1650,
      totalNewspaper: 112,
      total: 1762,
      status: "paid",
      paidDate: "2024-01-31"
    },
    {
      id: 2,
      customerName: "Priya Sharma",
      route: "Route A",
      milkQuantity: 60,
      milkRate: 55,
      newspaperDays: 0,
      newspaperRate: 4,
      totalMilk: 3300,
      totalNewspaper: 0,
      total: 3300,
      status: "pending",
      paidDate: null
    },
    {
      id: 3,
      customerName: "Mohammad Ali",
      route: "Route B",
      milkQuantity: 0,
      milkRate: 55,
      newspaperDays: 30,
      newspaperRate: 4,
      totalMilk: 0,
      totalNewspaper: 120,
      total: 120,
      status: "overdue",
      paidDate: null
    }
  ];

  const getTotals = () => {
    return {
      totalAmount: bills.reduce((sum, bill) => sum + bill.total, 0),
      paidAmount: bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.total, 0),
      pendingAmount: bills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + bill.total, 0),
      overdueAmount: bills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + bill.total, 0)
    };
  };

  const totals = getTotals();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'border-2 border-orange-500 text-orange-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Bills</h2>
          <p className="text-gray-600">Generate and manage monthly customer bills</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">January 2024</SelectItem>
                <SelectItem value="2023-12">December 2023</SelectItem>
                <SelectItem value="2023-11">November 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Bills</p>
                <p className="text-2xl font-bold">₹{totals.totalAmount}</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Paid</p>
                <p className="text-2xl font-bold">₹{totals.paidAmount}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending</p>
                <p className="text-2xl font-bold">₹{totals.pendingAmount}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-orange-700">₹{totals.overdueAmount}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Bills for {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{bill.customerName}</h3>
                      <Badge className={getStatusColor(bill.status)}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">Route: {bill.route}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Milk Details */}
                      {bill.milkQuantity > 0 && (
                        <div className="flex items-center space-x-2">
                          <Milk className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            {bill.milkQuantity}L × ₹{bill.milkRate} = ₹{bill.totalMilk}
                          </span>
                        </div>
                      )}
                      
                      {/* Newspaper Details */}
                      {bill.newspaperDays > 0 && (
                        <div className="flex items-center space-x-2">
                          <Newspaper className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            {bill.newspaperDays} days × ₹{bill.newspaperRate} = ₹{bill.totalNewspaper}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">₹{bill.total}</div>
                      {bill.paidDate && (
                        <div className="text-sm text-gray-500">Paid on {bill.paidDate}</div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyBills;
