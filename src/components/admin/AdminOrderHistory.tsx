import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";
import * as XLSX from 'xlsx-js-style';

const AdminOrderHistory = () => {
  const { orders, loading } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  const vendors = useMemo(() => {
    return [...new Set(orders.map(o => o.vendor.name))];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customerName = order.customer?.name || "";
      const matchesSearch = 
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesVendor = vendorFilter === "all" || order.vendor.name === vendorFilter;
      
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [orders, searchTerm, statusFilter, vendorFilter]);

  const getStatusBadge = (status: string) => {
    const colors = {
      delivered: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || ""}>
        {status}
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const delivered = filteredOrders.filter(o => o.status === "delivered").length;
    const pending = filteredOrders.filter(o => o.status === "pending").length;
    const totalAmount = filteredOrders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    return { total, delivered, pending, totalAmount };
  }, [filteredOrders]);

  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => ({
      'Order ID': order.id.slice(0, 8),
      'Date': format(new Date(order.order_date), "PP"),
      'Customer': order.customer?.name || "N/A",
      'Vendor': order.vendor.name,
      'Product': order.product.name,
      'Quantity': `${order.quantity} ${order.unit}`,
      'Total': order.total_amount,
      'Status': order.status,
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    // Prepare order data rows
    const orderRows = filteredOrders.map(order => [
      order.id.slice(0, 8),
      format(new Date(order.order_date), "PP"),
      order.customer?.name || "N/A",
      order.vendor.name,
      order.product.name,
      order.quantity,
      order.unit,
      order.total_amount,
      order.status
    ]);

    // Header row
    const headerRow = ['Order ID', 'Date', 'Customer', 'Vendor', 'Product', 'Quantity', 'Unit', 'Total', 'Status'];
    
    const summaryStartRow = orderRows.length + 4;
    const orderDataEndRow = orderRows.length + 1;
    
    // Get unique statuses
    const statuses = [...new Set(filteredOrders.map(o => o.status))];
    
    // Summary rows with formulas
    const summaryRows = statuses.map((status) => [
      status.toUpperCase(),
      { f: `COUNTIF(I2:I${orderDataEndRow},"${status}")` },
      { f: `SUMIF(I2:I${orderDataEndRow},"${status}",H2:H${orderDataEndRow})` }
    ]);
    
    // Grand total
    const grandTotalRow = [
      'GRAND TOTAL',
      { f: `COUNTA(I2:I${orderDataEndRow})` },
      { f: `SUM(H2:H${orderDataEndRow})` }
    ];
    
    const allData = [
      headerRow,
      ...orderRows,
      [],
      [],
      ['STATUS SUMMARY'],
      ['Status', 'Order Count', 'Total Amount (₹)'],
      ...summaryRows,
      grandTotalRow
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    ws['!cols'] = [
      { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }
    ];
    
    // Add borders to all cells
    const solidBorder = { style: 'thin', color: { rgb: '000000' } };
    const dottedBorder = { style: 'dotted', color: { rgb: '000000' } };
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        
        if (!cell) continue;
        if (!cell.s) cell.s = {};
        
        const isHeaderRow = row === 0;
        const isLastRow = row === range.e.r;
        const isFirstDataRow = row === 1;
        
        cell.s.border = {
          top: isHeaderRow || isFirstDataRow ? solidBorder : dottedBorder,
          bottom: isHeaderRow || isLastRow ? solidBorder : dottedBorder,
          left: solidBorder,
          right: solidBorder
        };
      }
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Orders');
    XLSX.writeFile(wb, `orders-with-summary-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Orders</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{stats.totalAmount}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.order_date), "PP")}</TableCell>
                    <TableCell className="font-medium">
                      {order.customer?.name || "N/A"}
                    </TableCell>
                    <TableCell>{order.vendor.name}</TableCell>
                    <TableCell>{order.product.name}</TableCell>
                    <TableCell>{order.quantity} {order.unit}</TableCell>
                    <TableCell className="font-semibold">₹{order.total_amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderHistory;
