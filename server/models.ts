import mongoose, { Schema, Types } from "mongoose";

export type Role = "main" | "sub" | "admin";

export interface IUser {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: Role;
  parentUserId?: Types.ObjectId;
  walletBalance?: number;
  walletLimit?: number;
  plan?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    twilioAccountSid: String,
    twilioAuthToken: String,
    twilioPhoneNumber: String,
  },
  { timestamps: true },
);

const NumberSchema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    country: String,
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: "User" },
    providerId: String,
  },
  { timestamps: true },
);

const ContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    phoneNumber: { type: String, required: true },
    name: String,
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    folder: { type: String, default: "contacts", enum: ["contacts", "sales"] },
  },
  { timestamps: true },
);

const TransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "transfer", "purchase", "sms"],
      required: true,
    },
    amount: { type: Number, required: true },
    meta: {},
  },
  { timestamps: true },
);

const CheckoutSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["card", "jazzcash", "easypaisa"],
      required: true,
    },
    status: {
      type: String,
      enum: ["initiated", "pending", "succeeded", "failed"],
      default: "initiated",
      index: true,
    },
    meta: {},
  },
  { timestamps: true },
);

const MessageSchema = new Schema(
  {
    numberId: { type: Schema.Types.ObjectId, ref: "Number", index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    body: { type: String, required: true },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    providerSid: { type: String },
    status: { type: String },
    error: { type: String },
  },
  { timestamps: true },
);

const PasswordRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reason: { type: String },
  },
  { timestamps: true },
);

export const User: mongoose.Model<IUser> =
  (mongoose.models.User as unknown as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
export const NumberModel: mongoose.Model<any> =
  (mongoose.models.Number as any) || mongoose.model("Number", NumberSchema);
export const Contact: mongoose.Model<any> =
  (mongoose.models.Contact as any) || mongoose.model("Contact", ContactSchema);
export const Transaction: mongoose.Model<any> =
  (mongoose.models.Transaction as any) ||
  mongoose.model("Transaction", TransactionSchema);
export const Message: mongoose.Model<any> =
  (mongoose.models.Message as any) || mongoose.model("Message", MessageSchema);
export const PasswordRequest: mongoose.Model<any> =
  (mongoose.models.PasswordRequest as any) ||
  mongoose.model("PasswordRequest", PasswordRequestSchema);
export const Checkout: mongoose.Model<any> =
  (mongoose.models.Checkout as any) ||
  mongoose.model("Checkout", CheckoutSchema);
