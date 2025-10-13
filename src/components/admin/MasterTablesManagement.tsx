import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { Plus, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const MasterTablesManagement = () => {
  const { products, addProduct, updateProduct } = useProducts();
  const { areas, createArea, deleteArea } = useAreas();
  const { societies, createSociety, deleteSociety } = useSocieties();

  const [newProduct, setNewProduct] = useState({ name: "", description: "", category: "", price: "", unit: "" });
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
            <CardDescription>Manage all products available in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input placeholder="Product name*" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
              <Input placeholder="Category*" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
              <Input placeholder="Price*" type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
              <Input placeholder="Unit*" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} />
              <Button onClick={() => { 
                if(newProduct.name && newProduct.category && newProduct.price && newProduct.unit) {
                  addProduct({name: newProduct.name, category: newProduct.category, price: parseFloat(newProduct.price), unit: newProduct.unit, availability: "Daily", description: newProduct.description || null, status: "active"}); 
                  setNewProduct({name: "", description: "", category: "", price: "", unit: ""});
                }
              }} disabled={!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.unit}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No products added yet</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category} • ₹{p.price} per {p.unit}</div>
                    </div>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="areas">
        <Card>
          <CardHeader>
            <CardTitle>Areas Master List</CardTitle>
            <CardDescription>Manage geographical areas for delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Area name*" value={newArea.name} onChange={(e) => setNewArea({...newArea, name: e.target.value})} />
              <Input placeholder="Description (optional)" value={newArea.description} onChange={(e) => setNewArea({...newArea, description: e.target.value})} />
              <Button onClick={() => { 
                if(newArea.name) {
                  createArea({name: newArea.name, description: newArea.description || null}); 
                  setNewArea({name: "", description: ""});
                }
              }} disabled={!newArea.name}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {areas.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No areas added yet</p>
              ) : (
                areas.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <div className="font-medium">{a.name}</div>
                      {a.description && <div className="text-sm text-muted-foreground">{a.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === 'active' ? 'default' : 'secondary'}>{a.status}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Area</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure? This will also affect societies in this area.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteArea(a.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="societies">
        <Card>
          <CardHeader>
            <CardTitle>Societies Master List</CardTitle>
            <CardDescription>Manage societies within areas (add Area first, then Society)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select value={newSociety.area_id} onValueChange={(value) => setNewSociety({...newSociety, area_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Area*" />
                </SelectTrigger>
                <SelectContent>
                  {areas.filter(a => a.status === 'active').map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Society name*" value={newSociety.name} onChange={(e) => setNewSociety({...newSociety, name: e.target.value})} />
              <Input placeholder="Description (optional)" value={newSociety.description} onChange={(e) => setNewSociety({...newSociety, description: e.target.value})} />
              <Button onClick={() => { 
                if(newSociety.area_id && newSociety.name) {
                  createSociety({name: newSociety.name, description: newSociety.description || null, area_id: newSociety.area_id}); 
                  setNewSociety({name: "", description: "", area_id: ""});
                }
              }} disabled={!newSociety.area_id || !newSociety.name}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {societies.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No societies added yet. Add an area first.</p>
              ) : (
                societies.map((s) => {
                  const area = areas.find(a => a.id === s.area_id);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex-1">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {area?.name || 'Unknown Area'} {s.description && `• ${s.description}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Society</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this society?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSociety(s.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
