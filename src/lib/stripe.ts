import Stripe from 'stripe';

// Inizializziamo Stripe con la Secret Key (lato server)
// Utilizziamo l'operatore "!" per dire a TS che siamo certi che la chiave esista nelle env
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: 'Evently - Event Management Platform',
    version: '0.1.0',
  },
  typescript: true,
});