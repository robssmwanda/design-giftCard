import mongoose from 'mongoose';

const { Schema } = mongoose;

const giftCardCategorySchema = new Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },

  region: {
    type: String,
    default: ''
  },

  image: {
    type: String,
    default: ''
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GiftCardCategory', giftCardCategorySchema);
