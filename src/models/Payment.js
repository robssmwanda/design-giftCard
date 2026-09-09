import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  orderRef: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'pawapay'],
    required: true,
    index: true,
  },
  method: {
    type: String,
    enum: ['card', 'mobile_money'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  providerTransactionId: {
    type: String,
    default: '',
    index: true,
  },
  providerReference: {
    type: String,
    default: '',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  failureReason: {
    type: String,
    default: '',
  },
  webhookReceived: {
    type: Boolean,
    default: false,
  },
  webhookEvents: [{
    eventId: String,
    type: String,
    receivedAt: Date,
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

paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ providerTransactionId: 1, provider: 1 }, { unique: true, sparse: true });

export default mongoose.model('Payment', paymentSchema);
