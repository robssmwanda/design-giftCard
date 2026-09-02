import mongoose from 'mongoose';

const { Schema } = mongoose;

const giftCardOfferSchema = new Schema({
  categoryId: {
    type: String,
    required: true,
    index: true
  },

  cardId: {
    type: String,
    required: true
  },

  categoryName: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  priceUsd: {
    type: Number,
    required: true
  },

  stock: {
    type: Number,
    default: 0
  },

  minOrderQuantity: {
    type: Number,
    default: 1
  },

  maxOrderQuantity: {
    type: Number,
    default: 1
  },

  note: {
    type: String,
    default: ''
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Empêche les doublons dans une même catégorie
giftCardOfferSchema.index(
  {
    categoryId: 1,
    cardId: 1
  },
  {
    unique: true
  }
);

export default mongoose.model('GiftCardOffer', giftCardOfferSchema);
