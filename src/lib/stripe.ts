import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: 'Evently - Event Management Platform',
    version: '0.1.0',
  },
  typescript: true,
});