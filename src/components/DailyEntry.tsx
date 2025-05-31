
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Milk, Newspaper, Save, Check } from "lucide-react";

const DailyEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      route: "Route A",
      regularMilk: 1,
      regularNewspaper: true,
      deliveredMilk: 1,
      deliveredNewspaper: true,
      saved: true
    },
    {
      id: 2,
      name: "Priya Sharma",
      route: "Route A",
      regularMilk: 2,
      regularNewspaper: false,
      deliveredMilk: 2,
      deliveredNewspaper: false,
      saved: false
    },
    {
      id: 3,
      name: "Mohammad Ali",
      route: "Route B",
      regularMilk: 0,
      regularNewspaper: true,
      deliveredMilk: 0,
      deliveredNewspaper: true,
      saved: false
    }
  ]);

  const updateEntry = (id: number, field: string, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, [field]: value, saved: false }
        : entry
    ));
  };

  const saveEntry = (id: number) => {
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, saved: true }
        : entry
    ));
  };

  const saveAllEntries = () => {
    setEntries(entries.map(entry => ({ ...entry, saved: true })));
  };

  const getTotalStats = () => {
    return {
      totalMilk: entries.reduce((sum, entry) => sum + entry.deliveredMilk, 0),
      totalNewspapers: entries.reduce((sum, entry) => sum + (entry.deliveredNewspaper ? 1 : 0), 0),
      unsavedChanges: entries.filter(entry => !entry.saved).length
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Distribution Entry</h2>
          <p className="text-gray-600">Record today's deliveries for all customers</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <Button 
            onClick={saveAllEntries} 
            disabled={stats.unsavedChanges === 0}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All ({stats.unsavedChanges})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Milk</p>
                <p className="text-2xl font-bold">{stats.totalMilk}L</p>
              </div>
              <Milk className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Newspapers</p>
                <p className="text-2xl font-bold">{stats.totalNewspapers}</p>
              </div>
              <Newspaper className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Customers</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <div className="text-orange-200">
                {stats.unsavedChanges === 0 ? <Check className="h-8 w-8" /> : <Save className="h-8 w-8" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Forms */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className={`transition-all ${entry.saved ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{entry.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">{entry.route}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {entry.saved ? (
                    <Badge variant="default" className="bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => saveEntry(entry.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Milk Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Milk className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Milk Delivery</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      Regular: {entry.regularMilk}L
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Delivered:</span>
                      <Input
                        type="number"
                        value={entry.deliveredMilk}
                        onChange={(e) => updateEntry(entry.id, 'deliveredMilk', parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                        min="0"
                        step="0.5"
                      />
                      <span className="text-sm text-gray-600">L</span>
                    </div>
                  </div>
                </div>

                {/* Newspaper Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Newspaper className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Newspaper Delivery</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      Regular: {entry.regularNewspaper ? 'Yes' : 'No'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Delivered:</span>
                      <input
                        type="checkbox"
                        checked={entry.deliveredNewspaper}
                        onChange={(e) => updateEntry(entry.id, 'deliveredNewspaper', e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DailyEntry;
