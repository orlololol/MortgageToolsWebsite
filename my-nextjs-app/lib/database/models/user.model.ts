import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  isSubscribed: {
    type: Boolean,
    default: false,
  },
  subscriptionEndDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  spreadsheetStatus: {
    type: String,
    default: "pending",
  },
  spreadsheetIds: {
    uploadDocumentA: {
      type: String,
      default: "",
    },
    uploadDocumentBC: {
      type: String,
      default: "",
    },
  },
});

const User = models?.User || model("User", UserSchema);

export default User;
