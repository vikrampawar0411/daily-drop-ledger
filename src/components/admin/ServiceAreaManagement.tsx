import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Map, MapPin, Building2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";

export const ServiceAreaManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { states, refetch: refetchStates } = useStates();
  const { cities } = useCities();
  const { areas } = useAreas();
  const { societies } = useSocieties();

  const [stateForm, setStateForm] = useState({ name: "", description: "" });
  const [cityForm, setCityForm] = useState({ name: "", description: "", state_id: "" });
  const [areaForm, setAreaForm] = useState({ name: "", description: "", city_id: "" });
  const [societyForm, setSocietyForm] = useState({ name: "", description: "", area_id: "" });

  const handleAddState = async () => {
    try {
      if (!stateForm.name) {
        toast({ title: "Error", description: "State name is required", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("states").insert([stateForm]);
      if (error) throw error;

      toast({ title: "Success", description: "State added successfully" });
      setStateForm({ name: "", description: "" });
      refetchStates();
      queryClient.invalidateQueries({ queryKey: ["states"] });
    } catch (error: any) {
      toast({ title: "Error adding state", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteState = async (id: string) => {
    try {
      const { error } = await supabase.from("states").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "State deleted successfully" });
      refetchStates();
      queryClient.invalidateQueries({ queryKey: ["states"] });
    } catch (error: any) {
      toast({ title: "Error deleting state", description: error.message, variant: "destructive" });
    }
  };

  const handleAddCity = async () => {
    try {
      if (!cityForm.name || !cityForm.state_id) {
        toast({ title: "Error", description: "City name and state are required", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("cities").insert([cityForm]);
      if (error) throw error;

      toast({ title: "Success", description: "City added successfully" });
      setCityForm({ name: "", description: "", state_id: "" });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    } catch (error: any) {
      toast({ title: "Error adding city", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCity = async (id: string) => {
    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "City deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    } catch (error: any) {
      toast({ title: "Error deleting city", description: error.message, variant: "destructive" });
    }
  };

  const handleAddArea = async () => {
    try {
      if (!areaForm.name || !areaForm.city_id) {
        toast({ title: "Error", description: "Area name and city are required", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("areas").insert([areaForm]);
      if (error) throw error;

      toast({ title: "Success", description: "Area added successfully" });
      setAreaForm({ name: "", description: "", city_id: "" });
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    } catch (error: any) {
      toast({ title: "Error adding area", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteArea = async (id: string) => {
    try {
      const { error } = await supabase.from("areas").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Area deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    } catch (error: any) {
      toast({ title: "Error deleting area", description: error.message, variant: "destructive" });
    }
  };

  const handleAddSociety = async () => {
    try {
      if (!societyForm.name || !societyForm.area_id) {
        toast({ title: "Error", description: "Society name and area are required", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("societies").insert([societyForm]);
      if (error) throw error;

      toast({ title: "Success", description: "Society added successfully" });
      setSocietyForm({ name: "", description: "", area_id: "" });
      queryClient.invalidateQueries({ queryKey: ["societies"] });
    } catch (error: any) {
      toast({ title: "Error adding society", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSociety = async (id: string) => {
    try {
      const { error } = await supabase.from("societies").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Society deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["societies"] });
    } catch (error: any) {
      toast({ title: "Error deleting society", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Service Area Management</h2>
        <p className="text-muted-foreground">Manage states, cities, areas, and societies</p>
      </div>

      <Tabs defaultValue="states" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="societies">Societies</TabsTrigger>
        </TabsList>

        {/* States Tab */}
        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Add New State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state-name">State Name *</Label>
                  <Input
                    id="state-name"
                    value={stateForm.name}
                    onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                    placeholder="e.g., Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-desc">Description</Label>
                  <Input
                    id="state-desc"
                    value={stateForm.description}
                    onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <Button onClick={handleAddState}>
                <Plus className="h-4 w-4 mr-2" />
                Add State
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {states.map((state) => (
              <Card key={state.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{state.name}</CardTitle>
                    <Badge variant={state.status === 'active' ? 'default' : 'secondary'}>
                      {state.status}
                    </Badge>
                  </div>
                  {state.description && (
                    <p className="text-sm text-muted-foreground">{state.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteState(state.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Add New City
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-state">State *</Label>
                  <Select
                    value={cityForm.state_id}
                    onValueChange={(value) => setCityForm({ ...cityForm, state_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-name">City Name *</Label>
                  <Input
                    id="city-name"
                    value={cityForm.name}
                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                    placeholder="e.g., Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-desc">Description</Label>
                  <Input
                    id="city-desc"
                    value={cityForm.description}
                    onChange={(e) => setCityForm({ ...cityForm, description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button onClick={handleAddCity}>
                <Plus className="h-4 w-4 mr-2" />
                Add City
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <Card key={city.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{city.name}</CardTitle>
                    <Badge variant={city.status === 'active' ? 'default' : 'secondary'}>
                      {city.status}
                    </Badge>
                  </div>
                  {city.description && (
                    <p className="text-sm text-muted-foreground">{city.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCity(city.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Areas Tab */}
        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Add New Area
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area-city">City *</Label>
                  <Select
                    value={areaForm.city_id}
                    onValueChange={(value) => setAreaForm({ ...areaForm, city_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area-name">Area Name *</Label>
                  <Input
                    id="area-name"
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    placeholder="e.g., Andheri"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area-desc">Description</Label>
                  <Input
                    id="area-desc"
                    value={areaForm.description}
                    onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button onClick={handleAddArea}>
                <Plus className="h-4 w-4 mr-2" />
                Add Area
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card key={area.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <Badge variant={area.status === 'active' ? 'default' : 'secondary'}>
                      {area.status}
                    </Badge>
                  </div>
                  {area.description && (
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteArea(area.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Societies Tab */}
        <TabsContent value="societies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Add New Society
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="society-area">Area *</Label>
                  <Select
                    value={societyForm.area_id}
                    onValueChange={(value) => setSocietyForm({ ...societyForm, area_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
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
                <div className="space-y-2">
                  <Label htmlFor="society-name">Society Name *</Label>
                  <Input
                    id="society-name"
                    value={societyForm.name}
                    onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                    placeholder="e.g., Green Park Society"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="society-desc">Description</Label>
                  <Input
                    id="society-desc"
                    value={societyForm.description}
                    onChange={(e) => setSocietyForm({ ...societyForm, description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button onClick={handleAddSociety}>
                <Plus className="h-4 w-4 mr-2" />
                Add Society
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {societies.map((society) => (
              <Card key={society.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{society.name}</CardTitle>
                    <Badge variant={society.status === 'active' ? 'default' : 'secondary'}>
                      {society.status}
                    </Badge>
                  </div>
                  {society.description && (
                    <p className="text-sm text-muted-foreground">{society.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSociety(society.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
