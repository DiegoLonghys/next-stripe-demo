import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: any) {

  const body = await req.text();

  const signature = (await headers()).get('stripe-signature');

  let data: any;
  let eventType: any;
  let event: Stripe.Event;

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  data = event.data;
  eventType = event.type;

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        let user;
        const session = await stripe.checkout.sessions.retrieve(
          data.object.id,
          {
            expand: ['line_items']
          }
        );
        const customerId = session?.customer;
        // Extra: >>>>> send email to dashboard <<<<
        console.log('Customer ID:', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        // ❌ Revoke access to the product
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        console.log('Subscription deleted:', data.object.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        // This fires every renewal. 
        // Update "lastPaidAt" or ensure "hasAccess" remains true.
        console.log('Invoice paid:', invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // Payment failed (e.g., expired card). 
        // Optionally set hasAccess = false or send a warning email.
        console.log('Invoice payment failed:', invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription);
        break;
      }

      default:
        console.log(`Unhandled event type ${eventType}`);
    }
  } catch (e: any) {
    console.error(
      'stripe error: ' + e.message + ' | EVENT TYPE: ' + eventType
    );
  }

  return NextResponse.json({});
}
