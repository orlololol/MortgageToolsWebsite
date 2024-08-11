import Header from "@/components/shared/Header";
import PDFUploadForm from "@/components/shared/PDFUploader";
import { transformationTypes } from "@/constants";
import {
  getUserById,
  checkSubscriptionStatus,
} from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Define the type for transformation types
type TransformationTypeKey = keyof typeof transformationTypes;

interface SearchParamProps {
  params: { type: TransformationTypeKey };
}

const AddTransformationTypePage = async ({
  params: { type },
}: SearchParamProps) => {
  const { userId } = auth();
  console.log("userId", userId);

  if (!userId) {
    console.log("No userId found. Redirecting to sign-in...");
    redirect("/sign-in");
  }

  const user = await getUserById(userId);

  if (!user) {
    console.log("User not found in database. Redirecting to sign-in...");
    redirect("/sign-in");
  }

  const isSubscribed = await checkSubscriptionStatus(user._id);

  if (!isSubscribed) {
    console.log("User is not subscribed. Redirecting to subscription page...");
    redirect("/subscription");
  }

  const transformation = transformationTypes[type];

  if (!transformation) {
    redirect("/404"); // Handle invalid transformation type
  }

  return (
    <>
      <section className="mt-10">
        <Header
          title={transformation.title}
          subtitle={transformation.subTitle}
        />
        <div className="mt-8">
          <PDFUploadForm
            action="Add"
            clerkId={user.clerkId}
            type={transformation.type as TransformationTypeKey}
          />
        </div>
      </section>
    </>
  );
};

export default AddTransformationTypePage;
