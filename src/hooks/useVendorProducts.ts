import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VendorProduct {
  id: string;
  vendor_id: string;
  product_id: string;
  price_override: number | null;
  is_active: boolean;
  stock_quantity: number;
  stock_reserved: number;
  stock_available: number;
  in_stock: boolean;
  last_stock_update: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    description: string | null;
    image_url: string | null;
    status: string;
  };
}

export const useVendorProducts = (vendorId?: string) => {
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVendorProducts = useCallback(async () => {
    try {
      let query = supabase
        .from("vendor_products")
        .select(`
          *,
          product:products(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Only filter by vendor_id if provided
      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setVendorProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching vendor products:", error);
      toast({
        title: "Error fetching vendor products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [vendorId, toast]);

  useEffect(() => {
    fetchVendorProducts();
  }, [fetchVendorProducts]);

  const addVendorProduct = async (productId: string, priceOverride?: number) => {
    if (!vendorId) return;

    try {
      // First, check if an inactive vendor_product exists for this vendor+product combo
      console.log("🔍 [ADD_CHECK_INACTIVE] Checking for inactive vendor_product...");
      const { data: existingInactive, error: checkError } = await supabase
        .from("vendor_products")
        .select("id, is_active")
        .eq("vendor_id", vendorId)
        .eq("product_id", productId)
        .eq("is_active", false)
        .maybeSingle();

      if (checkError) {
        console.error("❌ [ERROR_CHECK_INACTIVE]", checkError);
        throw checkError;
      }

      let data;
      let error;

      if (existingInactive) {
        // Reactivate the existing inactive vendor_product
        console.log("♻️  [REACTIVATE_EXISTING] Found inactive vendor_product, reactivating:", existingInactive.id);
        const result = await supabase
          .from("vendor_products")
          .update({ is_active: true })
          .eq("id", existingInactive.id)
          .select(`
            *,
            product:products(*)
          `)
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create a new vendor_product
        console.log("✨ [ADD_NEW] No inactive record found, creating new vendor_product");
        const result = await supabase
          .from("vendor_products")
          .insert([{
            vendor_id: vendorId,
            product_id: productId,
            price_override: priceOverride || null,
            order_cutoff: arguments[2] || null,
            delivery_time: arguments[3] || null,
          }])
          .select(`
            *,
            product:products(*)
          `)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("❌ [ERROR_ADD_VENDOR_PRODUCT]", error);
        throw error;
      }

      console.log("✅ [ADD_SUCCESS] Vendor product added/reactivated");
      setVendorProducts((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Product added to your list",
      });
      return data;
    } catch (error: any) {
      console.error("❌ [ERROR_ADD_VENDOR_PRODUCT_CATCH]", error);
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendorProduct = async (id: string, updates: Partial<VendorProduct>) => {
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          product:products(*)
        `)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Error updating product",
          description: "Product not found or could not be updated.",
          variant: "destructive",
        });
        throw new Error("Product not found or could not be updated.");
      }

      setVendorProducts((prev) =>
        prev.map((vp) => (vp.id === id ? data : vp))
      );
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeVendorProduct = async (id: string) => {
    try {
      console.log("🗑️ [DEACTIVATE_START] Attempting to deactivate vendor product:", id, "for vendor:", vendorId);

      // Find vendorProduct locally to include product metadata in messages
      const vp = vendorProducts.find(v => v.id === id);
      console.log("📦 [LOCAL_LOOKUP] Found local vendorProduct:", vp?.id, "product name:", vp?.product?.name);

      // Determine today's cutoff for "future" orders (start of today)
      const nowIso = new Date().toISOString();
      console.log("⏰ [TIME_CUTOFF] Using ISO cutoff for future orders:", nowIso);

      // Fetch future orders that reference this vendor_product
      console.log("📋 [FETCH_ORDERS] Querying orders with vendor_product_id =", id, "and order_date >=", nowIso);
      const { data: futureOrders, error: fetchOrdersError } = await supabase
        .from("orders")
        .select(`id, customer_id`)
        .eq("vendor_product_id", id)
        .gte("order_date", nowIso);

      if (fetchOrdersError) {
        console.error("❌ [ERROR_FETCH_ORDERS] Failed to fetch future orders:", fetchOrdersError);
        throw fetchOrdersError;
      }

      console.log("✅ [ORDERS_FETCHED] Found", futureOrders?.length || 0, "future orders");
      const affectedCustomerIds = Array.from(new Set((futureOrders || []).map((o: any) => o.customer_id).filter(Boolean)));
      console.log("👥 [AFFECTED_CUSTOMERS] Distinct customer IDs:", affectedCustomerIds.length);

      // If there are future orders, delete them first and notify customers
      if (futureOrders && futureOrders.length > 0) {
        console.log("🗑️  [DELETE_ORDERS] Deleting", futureOrders.length, "future orders");
        // Delete future orders
        const { data: deleteResult, error: deleteOrdersError, count: deletedCount } = await supabase
          .from("orders")
          .delete()
          .eq("vendor_product_id", id)
          .gte("order_date", nowIso)
          .select();

        if (deleteOrdersError) {
          console.error("❌ [ERROR_DELETE_ORDERS] Failed to delete future orders:", deleteOrdersError);
          throw deleteOrdersError;
        }

        console.log("✅ [ORDERS_DELETED] Deleted", deleteResult?.length || 0, "orders");

        // Prepare notifications per customer
        const notifications = affectedCustomerIds.map((customerId) => ({
          customer_id: customerId,
          vendor_id: vendorId || null,
          product_id: vp?.product?.id || null,
          message: vp?.product?.name
            ? `The product \"${vp.product.name}\" has been removed by the vendor. Your future subscribed orders for this product have been cancelled.`
            : "A product you subscribed to has been removed by the vendor. Your future subscribed orders have been cancelled.",
          vendor_contact: null,
          is_read: false,
          created_at: new Date().toISOString(),
        }));

        if (notifications.length > 0) {
          console.log("📢 [INSERT_NOTIFICATIONS] Inserting", notifications.length, "notifications");
          const { data: notifResult, error: insertNotifError } = await supabase
            .from("customer_notifications")
            .insert(notifications)
            .select();

          if (insertNotifError) {
            console.error("⚠️  [WARN_INSERT_NOTIFICATIONS] Error inserting notifications (non-fatal):", insertNotifError);
            // Non-fatal: continue with deletion but log
          } else {
            console.log("✅ [NOTIFICATIONS_INSERTED] Inserted", notifResult?.length || 0, "notifications");
          }
        }

        toast({
          title: "Deleted future orders",
          description: `${futureOrders.length} future order(s) deleted for ${affectedCustomerIds.length} customer(s). They will be notified.`,
        });
      }

      // Now DEACTIVATE (soft-delete) the vendor_product by setting is_active = false
      console.log("🔄 [DEACTIVATE_VENDOR_PRODUCT] Setting is_active = false for vendor_product:", id);
      const { data: vpUpdateResult, error } = await supabase
        .from("vendor_products")
        .update({ is_active: false })
        .eq("id", id)
        .eq("vendor_id", vendorId)
        .select();

      if (error) {
        console.error("❌ [ERROR_DEACTIVATE_VENDOR_PRODUCT] Error deactivating vendor product:", error);
        console.error("   Error details:", error.message, "Code:", error.code, "Details:", error.details);
        throw error;
      }

      console.log("✅ [VENDOR_PRODUCT_DEACTIVATED] Deactivated vendor_product. Result rows:", vpUpdateResult?.length || 0);
      
      // Update local state and refetch fresh
      console.log("🔄 [UPDATE_LOCAL_STATE] Removing product from local state");
      setVendorProducts((prev) => prev.filter((v) => v.id !== id));
      
      // Small delay before refetch to ensure DB consistency
      console.log("⏳ [DELAY_BEFORE_REFETCH] Waiting 120ms for DB consistency");
      await new Promise(resolve => setTimeout(resolve, 120));
      
      console.log("🔄 [REFETCH_PRODUCTS] Refetching all vendor products");
      await fetchVendorProducts();

      console.log("✅ [DEACTIVATE_SUCCESS] Product successfully deactivated");
      toast({
        title: "Success",
        description: "Product removed from your list",
      });
    } catch (error: any) {
      console.error("❌ [ERROR_REMOVE_VENDOR_PRODUCT] Error in removeVendorProduct:", error);
      console.error("   Error type:", error.constructor.name);
      console.error("   Full error object:", JSON.stringify(error, null, 2));
      // On error, refetch to restore correct state from DB
      console.log("🔄 [REFETCH_ON_ERROR] Refetching to restore state");
      await fetchVendorProducts();
      toast({
        title: "Error removing product",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStock = async (vendorProductId: string, quantity: number) => {
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .update({ 
          stock_quantity: quantity,
          last_stock_update: new Date().toISOString()
        })
        .eq("id", vendorProductId)
        .select(`*, product:products(*)`)
        .single();

      if (error) throw error;

      setVendorProducts(prev =>
        prev.map(vp => vp.id === vendorProductId ? data : vp)
      );

      toast({
        title: "Stock Updated",
        description: "Stock quantity updated successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addStock = async (vendorProductId: string, quantity: number) => {
    try {
      const currentVP = vendorProducts.find(vp => vp.id === vendorProductId);
      if (!currentVP) throw new Error("Product not found");

      const { data, error } = await supabase
        .from("vendor_products")
        .update({ 
          stock_quantity: (currentVP.stock_quantity || 0) + quantity
        })
        .eq("id", vendorProductId)
        .select(`*, product:products(*)`)
        .single();

      if (error) throw error;

      setVendorProducts(prev =>
        prev.map(vp => vp.id === vendorProductId ? data : vp)
      );

      toast({
        title: "Stock Updated",
        description: `Added ${quantity} units to stock`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStockStatus = async (vendorProductId: string, isActive: boolean) => {
    try {
      console.log("Updating product status to isActive:", isActive, "for ID:", vendorProductId);
      
      const { data, error } = await supabase
        .from("vendor_products")
        .update({ is_active: isActive })
        .eq("id", vendorProductId)
        .select(`*, product:products(*)`)
        .single();

      if (error) throw error;

      setVendorProducts(prev =>
        prev.map(vp => vp.id === vendorProductId ? data : vp)
      );

      toast({
        title: "Success",
        description: isActive ? "Product activated" : "Product deactivated",
      });

      return data;
    } catch (error: any) {
      console.error("Error updating product status:", error);
      toast({
        title: "Error updating product status",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePrice = async (vendorProductId: string, price: number) => {
    return updateVendorProduct(vendorProductId, { price_override: price });
  };

  const getProductStats = async (vendorProductId: string) => {
    try {
      const nowIso = new Date().toISOString();

      // Get future orders for this vendor_product
      const { data: futureOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, customer_id")
        .eq("vendor_product_id", vendorProductId)
        .gte("order_date", nowIso);

      if (ordersError) throw ordersError;

      // Count distinct customers
      const distinctCustomerIds = Array.from(
        new Set((futureOrders || []).map((o: any) => o.customer_id).filter(Boolean))
      );

      return {
        futureOrdersCount: futureOrders?.length || 0,
        connectedCustomersCount: distinctCustomerIds.length,
      };
    } catch (error: any) {
      console.error("Error fetching product stats:", error);
      return {
        futureOrdersCount: 0,
        connectedCustomersCount: 0,
      };
    }
  };

  return {
    vendorProducts,
    loading,
    addVendorProduct,
    updateVendorProduct,
    removeVendorProduct,
    addStock,
    updateStock,
    updateStockStatus,
    updatePrice,
    getProductStats,
    refetch: fetchVendorProducts,
  };
};
