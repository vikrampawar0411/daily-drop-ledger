import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { useVendorProducts } from "@/hooks/useVendorProducts";

interface VendorDetailsContentProps {
  vendorId?: string;
}

export const VendorDetailsContent = ({ vendorId }: VendorDetailsContentProps) => {
  const { vendorProducts, loading } = useVendorProducts(vendorId);

  if (!vendorId) {
    return <div className="text-muted-foreground">No vendor selected</div>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (vendorProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No Products</p>
        <p className="text-sm text-muted-foreground mt-2">
          This vendor hasn't added any products yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Products ({vendorProducts.length})</h3>
        <div className="grid gap-3">
          {vendorProducts.map((vp) => (
            <Card key={vp.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{vp.product?.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{vp.product?.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {vp.product?.availability}
                      </span>
                    </div>
                    {vp.product?.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {vp.product.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold">
                      ₹{vp.price_override || vp.product?.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {vp.product?.unit}
                    </div>
                    <Badge variant={vp.is_active ? "default" : "secondary"} className="mt-2">
                      {vp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
