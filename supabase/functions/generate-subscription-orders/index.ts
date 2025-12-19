import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting subscription order generation...');

    const today = new Date();

    // Get all active subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');

    if (subscriptionError) {
      throw subscriptionError;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active subscriptions to process',
        ordersCreated: 0,
        subscriptionsProcessed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let ordersCreated = 0;
    const errors: string[] = [];

    // For each subscription, generate orders
    for (const subscription of subscriptions || []) {
      try {
        // Parse dates properly to avoid timezone issues
        // DATE fields in postgres are in format YYYY-MM-DD
        const startDateParts = subscription.start_date.split('-').map(Number);
        let currentDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
        
        // Use subscription's end_date if provided, otherwise use 90 days from today
        let subscriptionEndDate: Date;
        if (subscription.end_date) {
          const endDateParts = subscription.end_date.split('-').map(Number);
          subscriptionEndDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
        } else {
          // If no end date specified, generate for next 90 days only
          subscriptionEndDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
        }
        
        const finalEndDate = subscriptionEndDate;
        
        console.log(`Generating orders for subscription ${subscription.id}`);
        console.log(`Start: ${subscription.start_date}, End: ${subscription.end_date || 'none'}`);
        console.log(`Parsed - Start: ${currentDate.toISOString().split('T')[0]}, End: ${finalEndDate.toISOString().split('T')[0]}`);
        console.log(`Frequency: ${subscription.frequency}`);
        
        // Get dates to generate orders for based on frequency
        const datesToGenerate: string[] = [];

        while (currentDate <= finalEndDate) {
          // Format date as YYYY-MM-DD consistently
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          // Check if subscription is paused on this date
          const isPaused = subscription.paused_from && subscription.paused_until &&
            dateStr >= subscription.paused_from && dateStr <= subscription.paused_until;

          if (!isPaused) {
            datesToGenerate.push(dateStr);
          }

          // Increment based on frequency
          if (subscription.frequency === 'daily') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (subscription.frequency === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (subscription.frequency === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }

        console.log(`Generating ${datesToGenerate.length} orders for subscription ${subscription.id}`);

        if (datesToGenerate.length === 0) {
          console.log(`No dates to generate for subscription ${subscription.id}`);
          continue;
        }

        console.log(`First few dates: ${datesToGenerate.slice(0, 5).join(', ')}`);

        // Get vendor_product_id which is required for orders
        const { data: vendorProduct, error: vendorProductError } = await supabase
          .from('vendor_products')
          .select('id')
          .eq('vendor_id', subscription.vendor_id)
          .eq('product_id', subscription.product_id)
          .single();

        if (vendorProductError || !vendorProduct) {
          console.error(`Could not find vendor_product for subscription ${subscription.id}:`, vendorProductError);
          errors.push(`Subscription ${subscription.id}: vendor_product not found`);
          continue;
        }

        console.log(`Found vendor_product_id: ${vendorProduct.id}`);

        // Check which orders already exist
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('order_date')
          .eq('customer_id', subscription.customer_id)
          .eq('vendor_id', subscription.vendor_id)
          .eq('product_id', subscription.product_id)
          .in('order_date', datesToGenerate);

        const existingDates = new Set(existingOrders?.map(o => o.order_date) || []);

        // Create orders for dates that don't exist
        const ordersToInsert = datesToGenerate
          .filter(date => !existingDates.has(date))
          .map(date => ({
            customer_id: subscription.customer_id,
            vendor_id: subscription.vendor_id,
            product_id: subscription.product_id,
            vendor_product_id: vendorProduct.id,
            order_date: date,
            quantity: subscription.quantity,
            unit: subscription.unit,
            price_per_unit: subscription.price_per_unit,
            total_amount: subscription.quantity * subscription.price_per_unit,
            status: 'pending',
            created_by_user_id: subscription.created_by_user_id,
            // created_from_subscription_id: subscription.id, // TODO: Add after migration
          }));

        if (ordersToInsert.length > 0) {
          console.log(`Inserting ${ordersToInsert.length} new orders for subscription ${subscription.id}`);
          console.log(`Sample order:`, JSON.stringify(ordersToInsert[0], null, 2));
          
          const { error: insertError } = await supabase
            .from('orders')
            .insert(ordersToInsert);

          if (insertError) {
            console.error(`Error inserting orders for subscription ${subscription.id}:`, insertError);
            errors.push(`Subscription ${subscription.id}: ${insertError.message}`);
          } else {
            ordersCreated += ordersToInsert.length;
            console.log(`Created ${ordersToInsert.length} orders for subscription ${subscription.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Subscription ${subscription.id}: ${error.message}`);
      }
    }

    const response = {
      success: true,
      message: `Generated ${ordersCreated} orders from ${subscriptions?.length || 0} subscriptions`,
      ordersCreated,
      subscriptionsProcessed: subscriptions?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Subscription order generation complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-subscription-orders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
