import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    role: { type: String, enum: ["patient", "clinic", "admin"], default: "patient" },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true, sparse: true },
    phone: { type: String, trim: true },
    passHash: { type: String },
    credits: { type: Number, default: 0 },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" }
  },
  { timestamps: true }
);

export const DEFAULT_HOURS = [
  { d: "Mon", open: "10:00 AM", close: "8:00 PM", closed: false },
  { d: "Tue", open: "10:00 AM", close: "8:00 PM", closed: false },
  { d: "Wed", open: "10:00 AM", close: "8:00 PM", closed: false },
  { d: "Thu", open: "10:00 AM", close: "8:00 PM", closed: false },
  { d: "Fri", open: "10:00 AM", close: "8:00 PM", closed: false },
  { d: "Sat", open: "11:00 AM", close: "9:00 PM", closed: false },
  { d: "Sun", open: "10:00 AM", close: "8:00 PM", closed: true }
];

const clinicSchema = new Schema(
  {
    name: { type: String, required: true },
    area: String,
    address: String,
    phone: String,
    about: String,
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false }, // set by admin
    paused: { type: Boolean, default: false }, // set by the owner (hidden from search, no new bookings)
    photo: String,
    amenities: [String],
    hours: { type: [{ d: String, open: String, close: String, closed: Boolean }], default: () => DEFAULT_HOURS },
    services: [
      {
        name: String,
        mins: Number,
        price: Number,
        on: { type: Boolean, default: true }
      }
    ]
  },
  { timestamps: true }
);

const bookingSchema = new Schema(
  {
    ref: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    clinicName: String,
    clinicPhoto: String,
    address: String,
    treatment: { type: String, required: true },
    price: { type: Number, required: true }, // final total after any credits discount
    listPrice: Number,
    discountPct: { type: Number, default: 0 },
    creditsUsed: { type: Number, default: 0 },
    mins: Number,
    day: String,
    time: String,
    patientName: String,
    patientPhone: String,
    pref: String,
    note: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: String
  },
  { timestamps: true }
);

const applicationSchema = new Schema(
  {
    clinic: { type: String, required: true },
    owner: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    passHash: String, // becomes the owner's clinic account on approval
    phone: String,
    area: String,
    address: String,
    license: String,
    services: [String],
    note: String,
    adminNote: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const User = model("User", userSchema);
export const Clinic = model("Clinic", clinicSchema);
export const Booking = model("Booking", bookingSchema);
export const Review = model("Review", reviewSchema);
export const Application = model("Application", applicationSchema);
export const Counter = model("Counter", counterSchema);

export async function nextRef() {
  const c = await Counter.findByIdAndUpdate(
    "booking",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "SCH-" + new Date().getFullYear() + "-" + String(c.seq).padStart(4, "0");
}
