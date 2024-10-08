"use server";

import { revalidatePath } from "next/cache";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import {
  duplicateSpreadsheet,
  shareSpreadsheet,
} from "../../app/api/googleSheets/googleSheetsServices";

// CREATE
export async function createUser(user: CreateUserParams) {
  console.log("Creating user", user);
  try {
    await connectToDatabase();
    let existingUser = await User.findOne({ clerkId: user.clerkId });

    if (existingUser) {
      console.log("User with this clerkId already exists:", existingUser);
      existingUser = Object.assign(existingUser, user);
    } else {
      existingUser = new User({
        ...user,
        isSubscribed: false,
        subscriptionEndDate: null,
      });
    }
    const newUser = await existingUser.save();
    console.log("User created or updated in DB", newUser);

    // Initialize spreadsheet status
    newUser.spreadsheetStatus = "pending";
    await newUser.save();

    // Schedule spreadsheet operations
    handleSpreadsheetOperations(newUser);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    handleError(error);
  }
}

async function handleSpreadsheetOperations(user: any) {
  console.log("Starting spreadsheet operations for user:", user._id);
  const templateIdA = process.env.TEMPLATE_SPREADSHEET_ID_A || "";
  const templateIdBC = process.env.TEMPLATE_SPREADSHEET_ID_BC || "";

  try {
    const spreadsheetIdA = await duplicateSpreadsheet(
      templateIdA,
      `Fannie Mae 1040 Spreadsheet`
    );
    console.log("SpreadsheetIdA created:", spreadsheetIdA);

    const spreadsheetIdBC = await duplicateSpreadsheet(
      templateIdBC,
      `Income Calculation Spreadsheet`
    );
    console.log("SpreadsheetIdBC created:", spreadsheetIdBC);

    await shareSpreadsheet(spreadsheetIdA, user.email);
    await shareSpreadsheet(spreadsheetIdBC, user.email);
    console.log("Spreadsheets shared with user:", user.email);
    user.spreadsheetIds = {
      uploadDocumentA: spreadsheetIdA,
      uploadDocumentBC: spreadsheetIdBC,
    };
    user.spreadsheetStatus = "completed";
    await user.save();
    console.log("Spreadsheet IDs saved to user:", user.spreadsheetIds);
  } catch (error) {
    console.error("Error in spreadsheet operations:", error);
    // Here you could implement a retry mechanism or alert system
  }
}

// READ
export async function getUserById(userId: string) {
  console.log("Fetching user in getUserById", userId);
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      console.log("User not found for clerkId:", userId);
      return null;
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  console.log("Deleting user", clerkId);
  try {
    await connectToDatabase();

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

// UPDATE USER SUBSCRIPTION
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

    if (!updatedUser) throw new Error("User subscription update failed");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// GET USER ID FROM CLERK ID
export async function getUserIdFromClerkId(clerkId: string) {
  try {
    const user = await User.findOne({ clerkId: clerkId });
    if (!user) {
      throw new Error("User not found");
    }
    return user._id.toString(); // Convert ObjectId to string
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

// CHECK SUBSCRIPTION STATUS
export async function checkSubscriptionStatus(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    const isSubscriptionActive =
      user.isSubscribed && user.subscriptionEndDate > new Date();

    return isSubscriptionActive;
  } catch (error) {
    handleError(error);
  }
}
