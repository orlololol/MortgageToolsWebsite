"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import User from "../database/models/user.model";

export async function createSubscription({
  priceId,
  buyerId,
}: {
  priceId: string;
  buyerId: string;
}) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/credits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/credits?canceled=true`,
    client_reference_id: buyerId,
  });

  redirect(session.url!);
}

export async function updateUserSubscription(
  userId: string,
  isSubscribed: boolean,
  endDate: Date | null
) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isSubscribed, subscriptionEndDate: endDate },
      { new: true }
    );

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}
