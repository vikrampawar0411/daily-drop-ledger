import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/hooks/useProducts";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const MasterTablesManagement = () => {
  const { products, addProduct, updateProduct } = useProducts();
  const { areas, createArea } = useAreas();
  const { societies, createSociety } = useSocieties();

  const [newProduct, setNewProduct] = useState({ name: "", description: "" });
  const [newArea, setNewArea] = useState({ name: "", description: "" });
  const [newSociety, setNewSociety] = useState({ name: "", description: "", area_id: "" });

  return (
    <Tabs defaultValue="products" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="areas">Areas</TabsTrigger>
        <TabsTrigger value="societies">Societies</TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        <Card>
          <CardHeader>
            <CardTitle>Products Master List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
              <Input placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
              <Button onClick={() => { addProduct({name: newProduct.name, category: "General", price: 0, unit: "unit", availability: "Daily", description: newProduct.description, status: "active"}); setNewProduct({name: "", description: ""}); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.description}</div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="areas">
        <Card>
          <CardHeader>
            <CardTitle>Areas Master List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Area name" value={newArea.name} onChange={(e) => setNewArea({...newArea, name: e.target.value})} />
              <Input placeholder="Description" value={newArea.description} onChange={(e) => setNewArea({...newArea, description: e.target.value})} />
              <Button onClick={() => { createArea({name: newArea.name, description: newArea.description}); setNewArea({name: "", description: ""}); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-sm text-muted-foreground">{a.description}</div>
                  </div>
                  <Badge>{a.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="societies">
        <Card>
          <CardHeader>
            <CardTitle>Societies Master List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Society name" value={newSociety.name} onChange={(e) => setNewSociety({...newSociety, name: e.target.value})} />
              <Input placeholder="Description" value={newSociety.description} onChange={(e) => setNewSociety({...newSociety, description: e.target.value})} />
              <Button onClick={() => { if(newSociety.area_id) createSociety({name: newSociety.name, description: newSociety.description, area_id: newSociety.area_id}); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {societies.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.description}</div>
                  </div>
                  <Badge>{s.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
