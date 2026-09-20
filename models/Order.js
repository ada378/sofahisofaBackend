import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  fabricChoice: String,
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Guest order info (when user is not logged in)
    guestInfo: {
      fullName: String,
      phone: String,
      email: String,
    },
    items: [orderItemSchema],
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    paymentResult: { id: String, status: String, updateTime: String },
    itemsPrice: Number,
    shippingPrice: { type: Number, default: 0 },
    totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ["Placed", "Confirmed", "Dispatched", "OutForDelivery", "Delivered", "Cancelled", "Returned"],
      default: "Placed",
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

// Indexes for frequent queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
