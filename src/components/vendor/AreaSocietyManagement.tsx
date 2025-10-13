import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AreaSocietyManagementProps {
  vendorId: string;
}

export const AreaSocietyManagement = ({ vendorId }: AreaSocietyManagementProps) => {
  const { areas, createArea, deleteArea } = useAreas(vendorId);
  const [newAreaName, setNewAreaName] = useState("");
  
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const { societies, createSociety, deleteSociety } = useSocieties(selectedAreaId, vendorId);
  const [newSocietyName, setNewSocietyName] = useState("");

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAreaName.trim()) {
      createArea({ vendor_id: vendorId, name: newAreaName.trim() });
      setNewAreaName("");
    }
  };

  const handleCreateSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSocietyName.trim() && selectedAreaId) {
      createSociety({ 
        vendor_id: vendorId, 
        area_id: selectedAreaId, 
        name: newSocietyName.trim() 
      });
      setNewSocietyName("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area & Society Management</CardTitle>
        <CardDescription>
          Manage areas and societies for customer addresses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="areas">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="areas">Areas</TabsTrigger>
            <TabsTrigger value="societies">Societies</TabsTrigger>
          </TabsList>

          <TabsContent value="areas" className="space-y-4">
            <form onSubmit={handleCreateArea} className="flex gap-2">
              <Input
                placeholder="New area name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>{area.name}</span>
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
                          Are you sure you want to delete this area? This will also delete all associated societies.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteArea(area.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {areas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No areas added yet
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="societies" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Area</Label>
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAreaId && (
              <>
                <form onSubmit={handleCreateSociety} className="flex gap-2">
                  <Input
                    placeholder="New society name"
                    value={newSocietyName}
                    onChange={(e) => setNewSocietyName(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <div className="space-y-2">
                  {societies.map((society) => (
                    <div key={society.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>{society.name}</span>
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
                            <AlertDialogAction onClick={() => deleteSociety(society.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                  {societies.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No societies added for this area yet
                    </p>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
