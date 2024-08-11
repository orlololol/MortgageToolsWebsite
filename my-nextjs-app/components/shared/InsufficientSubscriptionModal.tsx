"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const InsufficientSubscriptionModal = () => {
  const router = useRouter();

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex-between">
            <p className="p-16-semibold text-dark-400">Subscription Required</p>
            <AlertDialogCancel
              className="border-0 p-0 hover:bg-transparent"
              onClick={() => router.push("/profile")}
            >
              <Image
                src="/assets/icons/close.svg"
                alt="close"
                width={24}
                height={24}
                className="cursor-pointer"
              />
            </AlertDialogCancel>
          </div>

          <Image
            src="/assets/images/stacked-coins.png"
            alt="subscription image"
            width={462}
            height={122}
          />

          <AlertDialogTitle className="p-24-bold text-dark-600">
            Oops... It looks like you dont have an active subscription!
          </AlertDialogTitle>

          <AlertDialogDescription className="p-16-regular py-3">
            To access this feature and enjoy our full range of services, please
            subscribe to one of our plans.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="button w-full bg-purple-100 text-dark-400"
            onClick={() => router.push("/credits")}
          >
            Not Now
          </AlertDialogCancel>
          <AlertDialogAction
            className="button w-full bg-purple-gradient bg-cover"
            onClick={() => router.push("/credits")}
          >
            View Subscription Plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
