export const navLinks = [
  // {
  //   label: "Home",
  //   route: "/",
  //   icon: "/assets/icons/home.svg",
  // },
  {
    label: "Process 1040",
    route: "/transformations/add/uploadDocumentA",
    icon: "/assets/icons/image.svg",
  },
  {
    label: "Process Paystub or W2",
    route: "/transformations/add/uploadDocumentBC",
    icon: "/assets/icons/stars.svg",
  },
  // {
  //   label: "Profile",
  //   route: "/profile",
  //   icon: "/assets/icons/profile.svg",
  // },
  {
    label: "Subscription Page",
    route: "/credits",
    icon: "/assets/icons/bag.svg",
  },
];

export const plans = [
  {
    name: "Free",
    price: 0,
    features: ["View product information", "Browse available features"],
  },
  {
    name: "Premium",
    price: 100,
    priceId: "price_0PmzyxlmRkSiWwnVAuBhW7Lq", // Replace with actual Stripe price ID
    features: [
      "Full access to all features",
      "Unlimited uploads",
      "Priority customer support",
    ],
  },
];

export const transformationTypes = {
  uploadDocumentA: {
    type: "uploadDocumentA",
    title: "Upload a 1040 form",
    subTitle: "Upload and process a 1040 form",
    config: { documentType: "A" },
    icon: "image.svg",
  },
  uploadDocumentBC: {
    type: "uploadDocumentBC",
    title: "Upload a paystub or a w2 form",
    subTitle: "Upload and process a paystub or a w2 pdf file",
    config: { documentType: "BC" },
    icon: "camera.svg",
  },
};

export const aspectRatioOptions = {
  "1:1": {
    aspectRatio: "1:1",
    label: "Square (1:1)",
    width: 1000,
    height: 1000,
  },
  "3:4": {
    aspectRatio: "3:4",
    label: "Standard Portrait (3:4)",
    width: 1000,
    height: 1334,
  },
  "9:16": {
    aspectRatio: "9:16",
    label: "Phone Portrait (9:16)",
    width: 1000,
    height: 1778,
  },
};

export const defaultValues = {
  title: "",
  aspectRatio: "",
  color: "",
  prompt: "",
  publicId: "",
};

export const creditFee = -5;
