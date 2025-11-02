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

    // Get current date and end of next month
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    // Calculate end of next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const endDate = nextMonth.toISOString().split('T')[0];

    console.log(`Generating orders from ${startDate} to ${endDate}`);

    // Get all active subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gte.${endDate}`);

    if (subscriptionError) {
      throw subscriptionError;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    let ordersCreated = 0;
    const errors: string[] = [];

    // For each subscription, generate orders
    for (const subscription of subscriptions || []) {
      try {
        // Get dates to generate orders for based on frequency
        const datesToGenerate: string[] = [];
        let currentDate = new Date(Math.max(new Date(subscription.start_date).getTime(), today.getTime()));
        const subscriptionEndDate = subscription.end_date ? new Date(subscription.end_date) : nextMonth;
        const finalEndDate = new Date(Math.min(nextMonth.getTime(), subscriptionEndDate.getTime()));

        while (currentDate <= finalEndDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
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
            order_date: date,
            quantity: subscription.quantity,
            unit: subscription.unit,
            price_per_unit: subscription.price_per_unit,
            total_amount: subscription.quantity * subscription.price_per_unit,
            status: 'pending',
            created_by_user_id: subscription.created_by_user_id,
          }));

        if (ordersToInsert.length > 0) {
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
