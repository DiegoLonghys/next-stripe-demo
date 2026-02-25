# Integrazione di Stripe in Next.js (Abbonamenti e Cancellazioni)

Questa guida fornisce una panoramica su come integrare Stripe in un'applicazione Next.js per gestire pagamenti ricorrenti (subscription) e cancellazioni.

L'obiettivo è spiegare il flusso generale e approfondire in particolare:

- Configurazione iniziale
- Variabili d'ambiente necessarie
- Webhook
- Eventi più comuni (con spiegazione di quando usarli)

---

# 1. Installazione e Setup Base

## Installazione pacchetti

Installa Stripe nel progetto:

```
npm install stripe
```

Se utilizzi TypeScript:

```
npm install -D @types/node
```

---

# 2. Variabili d'Ambiente

Crea un file .env.local nella root del progetto.

```ts
// .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```


### Spiegazione

- STRIPE_SECRET_KEY → Chiave privata (server-side only)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Chiave pubblica (client-side)
- STRIPE_WEBHOOK_SECRET → Necessaria per verificare l'autenticità dei webhook

⚠️ Non esporre mai la STRIPE_SECRET_KEY nel frontend.

---

# 3. Inizializzazione Stripe (Server Side)

Crea un file helper, ad esempio:


```ts
// ./lib/stripe.ts

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 apiVersion: "2023-10-16",
});
```

Stripe deve essere usato solo nelle API Route o Route Handlers di Next.js.

---

# 4. Flusso Abbonamento (Overview)

## 1️⃣ Creazione Checkout Session

Dal server crei una sessione di checkout con modalità subscription.

```ts
await stripe.checkout.sessions.create({
 mode: "subscription",
 payment_method_types: ["card"],
 line_items: [
 {
 price: "price_id",
 quantity: 1,
 },
 ],
 success_url: "http://localhost:3000/success",
 cancel_url: "http://localhost:3000/cancel",
});
```

## 2️⃣ L'utente completa il pagamento

Stripe gestisce l'intero flusso di pagamento.

## 3️⃣ Stripe invia eventi via Webhook

Qui avviene la parte più importante dell'integrazione.

---

# 5. Webhook in Next.js

I webhook permettono al tuo backend di essere notificato quando accadono eventi su Stripe.

Sono fondamentali per:

- Attivare un abbonamento
- Aggiornare stato utente
- Gestire rinnovi
- Gestire cancellazioni
- Gestire pagamenti falliti

---

## Creazione Route Webhook

Esempio in:


/app/api/webhooks/stripe/route.ts


⚠️ Devi leggere il body RAW per verificare la firma.

Esempio semplificato:

```ts
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
 const body = await req.text();
 const signature = headers().get("stripe-signature")!;

 let event;

 try {
 event = stripe.webhooks.constructEvent(
 body,
 signature,
 process.env.STRIPE_WEBHOOK_SECRET!
 );
 } catch (err) {
 return new Response("Webhook error", { status: 400 });
 }

 // Gestione eventi
 switch (event.type) {
 case "checkout.session.completed":
 break;
 }

 return new Response("OK", { status: 200 });
}
```

---

# 6. Eventi Stripe più Comuni (Fondamentali per Subscription)

Questa è la parte più importante dell'integrazione.

---

## 🔹 checkout.session.completed

### Quando avviene?
Quando un utente completa il pagamento nel checkout.

### Quando è utile?
- Attivare l'abbonamento nel database
- Salvare customer_id
- Collegare utente ↔ subscription

È il punto iniziale di attivazione.

---

## 🔹 customer.subscription.created

### Quando avviene?
Quando viene creata una nuova subscription.

### Quando è utile?
- Confermare attivazione
- Salvare subscription_id
- Impostare stato utente = "active"

---

## 🔹 customer.subscription.updated

### Quando avviene?
Quando una subscription viene modificata.

Esempi:
- Upgrade piano
- Downgrade piano
- Cambio metodo pagamento
- Cancellazione programmata

### Quando è utile?
- Aggiornare livello accesso
- Gestire cancel_at_period_end

---

## 🔹 customer.subscription.deleted

### Quando avviene?
Quando una subscription viene cancellata definitivamente.

### Quando è utile?
- Revocare accesso premium
- Aggiornare stato utente = "inactive"
- Bloccare funzionalità

Evento fondamentale per gestire la disattivazione.

---

## 🔹 invoice.payment_succeeded

### Quando avviene?
Ogni volta che un pagamento ricorrente va a buon fine.

### Quando è utile?
- Confermare rinnovo
- Estendere periodo di validità
- Aggiornare data scadenza

Molto importante per gestire rinnovi automatici.

---

## 🔹 invoice.payment_failed

### Quando avviene?
Quando un pagamento ricorrente fallisce.

### Quando è utile?
- Notificare l'utente
- Mettere account in stato "grace period"
- Bloccare temporaneamente accesso

Essenziale per evitare accessi non pagati.

---

## 🔹 customer.subscription.trial_will_end

### Quando avviene?
Prima che il periodo di prova termini.

### Quando è utile?
- Inviare email di reminder
- Preparare upgrade automatico

---

# 7. Flusso Completo Subscription

1. Utente clicca "Abbonati"
2. Server crea checkout session
3. Stripe gestisce pagamento
4. Stripe invia checkout.session.completed
5. Backend salva subscription
6. Stripe invia invoice.payment_succeeded ad ogni rinnovo
7. Se utente cancella → customer.subscription.deleted

---

# 8. Gestione Cancellazione

Puoi cancellare una subscription via API:

```ts
await stripe.subscriptions.update(subscriptionId, {
 cancel_at_period_end: true,
});
```

Oppure cancellazione immediata:

```ts
await stripe.subscriptions.cancel(subscriptionId);
```

La cancellazione genererà eventi webhook che dovrai intercettare.

---

# 9. Perché i Webhook sono Fondamentali

Non bisogna mai fidarsi solo del frontend.

Stripe è la fonte di verità.

Il tuo sistema deve aggiornare lo stato utente SOLO quando riceve eventi webhook verificati.

---

# 10. Best Practice

- Verificare sempre la firma webhook
- Salvare customer_id e subscription_id
- Gestire pagamenti falliti
- Loggare tutti gli eventi Stripe
- Non aggiornare stato utente solo lato client

---

# Conclusione

L'integrazione Stripe in Next.js per abbonamenti si basa su:

- Checkout Session per avviare il pagamento
- Webhook per sincronizzare lo stato reale
- Eventi subscription per gestire attivazione, rinnovo e cancellazione

Il cuore dell'architettura è la gestione corretta degli eventi webhook.

Senza webhook, il sistema di subscription non è affidabile.
