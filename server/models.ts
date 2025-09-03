import mongoose, { Schema, Types } from "mongoose";

export type Role = "main" | "sub" | "admin";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: String,
    lastName: String,
    phone: String,
    role: { type: String, enum: ["main", "sub", "admin"], default: "main" },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User" },
    walletBalance: { type: Number, default: 0 },
    walletLimit: { type: Number },
    plan: { type: String, default: "free" },
  },
  { timestamps: true }
);

const NumberSchema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    country: String,
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: "User" },
    providerId: String,
  },
  { timestamps: true }
);

const ContactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    phoneNumber: { type: String, required: true },
    name: String,
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["deposit", "transfer", "purchase", "sms"], required: true },
    amount: { type: Number, required: true },
    meta: {},
  },
  { timestamps: true }
);

const MessageSchema = new Schema(
  {
    numberId: { type: Schema.Types.ObjectId, ref: "Number", index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    body: { type: String, required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true, index: true },
    providerSid: { type: String },
    status: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const NumberModel = mongoose.models.Number || mongoose.model("Number", NumberSchema);
export const Contact = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
