"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createSubscription } from "@/lib/actions/transaction.action";
import { Button } from "../ui/button";
import { plans } from "@/constants";

const Checkout = ({ buyerId }: { buyerId: string }) => {
  const { toast } = useToast();

  useEffect(() => {
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }, []);

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      toast({
        title: "Subscription started!",
        description: "You will receive an email confirmation",
        duration: 5000,
        className: "success-toast",
      });
    }

    if (query.get("canceled")) {
      toast({
        title: "Subscription canceled!",
        description: "You can subscribe anytime to access all features",
        duration: 5000,
        className: "error-toast",
      });
    }
  }, [toast]);

  const onCheckout = async () => {
    await createSubscription({
      priceId: plans[1]?.priceId || "", // Premium plan price ID with default value
      buyerId,
    });
  };

  return (
    <form action={onCheckout}>
      <section>
        <Button
          type="submit"
          role="link"
          className="w-full rounded-full bg-purple-gradient bg-cover"
        >
          Subscribe Now
        </Button>
      </section>
    </form>
  );
};

export default Checkout;
