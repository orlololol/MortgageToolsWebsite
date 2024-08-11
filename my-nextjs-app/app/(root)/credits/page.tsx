import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

import Header from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { plans } from "@/constants";
import { getUserById } from "@/lib/actions/user.actions";
import Checkout from "@/components/shared/Checkout";

const SubscriptionPage = async () => {
  const { userId } = auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <div className="justify-center">
      <Header
        title="Subscription"
        subtitle="Get access to uploading documents"
      />

      {/* Profile Section */}
      <section className="profile mb-8">
        <div className="profile-balance bg-light-2 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <p className="p-14-medium md:p-16-medium justify-center">
            CURRENT PLAN
          </p>
          {/* <div className="mt-4 flex items-center gap-4">
            <Image
              src="/assets/icons/coins.svg"
              alt="coins"
              width={50}
              height={50}
              className="size-9 md:size-12"
            />
            <h2 className="h2-bold text-dark-600">{user.creditBalance}</h2>
          </div> */}
          <h2 className="h2-bold text-dark-600">
            {user.isSubscribed ? "Premium" : "Free"}
          </h2>
          {user.isSubscribed && user.subscriptionEndDate && (
            <p className="p-14-medium mt-2">
              Renews on:{" "}
              {new Date(user.subscriptionEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </section>

      {/* Buy Credits Section */}
      <section>
        <h3 className="h3-bold mb-5">Subscription Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="credits-item bg-light-2 rounded-lg p-6"
            >
              <h4 className="h4-bold text-purple-500 mb-4">{plan.name}</h4>
              <p className="h2-bold text-dark-600 mb-6">${plan.price}/month</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Image
                      src="/assets/icons/check.svg"
                      alt="check"
                      width={16}
                      height={16}
                    />
                    <p className="p-14-regular">{feature}</p>
                  </li>
                ))}
              </ul>
              {plan.name === "Free" ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!user.isSubscribed}
                >
                  {user.isSubscribed ? "Downgrade" : "Current Plan"}
                </Button>
              ) : (
                <SignedIn>
                  {user.isSubscribed ? (
                    <Button variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  ) : (
                    <Checkout buyerId={user._id} />
                  )}
                </SignedIn>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPage;
