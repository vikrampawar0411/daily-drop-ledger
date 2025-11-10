import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManagement from "@/components/vendor/ProductManagement";
import ProductRequestsManagement from "./ProductRequestsManagement";
import { MasterTablesManagement } from "./MasterTablesManagement";

const UnifiedProductManagement = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Product Management</h2>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="requests">Approval Requests</TabsTrigger>
          <TabsTrigger value="master">Master Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <ProductRequestsManagement />
        </TabsContent>

        <TabsContent value="master" className="mt-6">
          <MasterTablesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedProductManagement;
