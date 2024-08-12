"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { SignIn } from "@clerk/clerk-react";
import { useRouter } from "next/navigation"; // Import useRouter

const AuthFlow = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect to profile page if the user is signed in
      router.push("/transformations/add/uploadDocumentA");
    }
  }, [isLoaded, isSignedIn, router]); // Add dependencies

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <SignIn />;
  }

  return (
    <div>Welcome, {user.firstName}! Redirecting to your application...</div>
  );
};

export default AuthFlow;
