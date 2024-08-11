/* eslint-disable camelcase */
import { updateUserSubscription } from "@/lib/actions/transaction.action";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ message: "Webhook error", error: err });
  }

  // Get the ID and type
  const eventType = event.type;

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      await updateUserSubscription(
        session.client_reference_id!,
        true,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserSubscription(
        subscription.metadata.userId,
        subscription.status === "active",
        subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null
      );
      break;
  }
  // // CREATE
  // if (eventType === "checkout.session.completed") {
  //   const { id, amount_total, metadata } = event.data.object;

  //   const transaction = {
  //     stripeId: id,
  //     amount: amount_total ? amount_total / 100 : 0,
  //     plan: metadata?.plan || "",
  //     credits: Number(metadata?.credits) || 0,
  //     buyerId: metadata?.buyerId || "",
  //     createdAt: new Date(),
  //   };

  //   const newTransaction = await createTransaction(transaction);

  //   return NextResponse.json({ message: "OK", transaction: sessionStorag });
  // }

  return new Response("", { status: 200 });
}
