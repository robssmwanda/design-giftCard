import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartItemSchema = new Schema({
   userId: {
     type: Schema.Types.ObjectId,
     ref: 'User',
     required: true
   },

   // 🆕 Identifiants FazerCards
   categoryId: {
     type: String
   },

   cardId: {
     type: String
   },

   productName: {
     type: String,
     required: true
   },

   region: {
     type: String,
     required: true
   },

   cardValue: {
     type: String,
     required: true
   },

   prix: {
     type: Number,
     required: true
   },

   devise: {
     type: String,
     required: true
   },
  image: {
    type: String,
    default: ""
  },

  provider: {
    type: String,
    default: "FazerCards"
  },

   emailLivraison: {
     type: String,
     required: true
   },

   // 🆕 Quantité
   quantity: {
     type: Number,
     default: 1
   },

   ajouteLe: {
     type: Date,
     default: Date.now
   }
})

export default mongoose.model('CartItem', cartItemSchema)
