import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  giftCardId: { type: String, required: true },
  brandId: { type: String, required: true },
  brandName: { type: String, required: true },
  brandSlug: { type: String, default: '' },
  denomination: { type: Number, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  deliveryEmail: { type: String, required: true },
  accentColor: { type: String, default: '#0F172A' },
  accentColor2: { type: String, default: '#334155' },
});

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  customerEmail: {
    type: String,
    required: true,
    index: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  deliveryResults: [{
    giftCardId: String,
    success: Boolean,
    code: String,
    error: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Order', orderSchema);
