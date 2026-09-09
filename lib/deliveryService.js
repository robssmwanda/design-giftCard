import { connectDB, mongoose } from './mongodb.js';
import GiftCardOffer from '../src/models/GiftCardOffer.js';

export async function processDelivery(order) {
  await connectDB();

  if (order.delivered) {
    console.log(`[Delivery] Order ${order.orderId} already delivered, skipping`);
    return { alreadyDelivered: true, results: [] };
  }

  const results = [];

  for (const item of order.items) {
    try {
      if (mongoose.connection.readyState === 1) {
        const offer = await GiftCardOffer.findOne({
          categoryId: item.brandId,
          cardId: item.giftCardId,
        });

        if (offer) {
          const newStock = Math.max(0, offer.stock - item.quantity);
          await GiftCardOffer.updateOne(
            { _id: offer._id },
            { $set: { stock: newStock, updatedAt: new Date() } }
          );
          console.log(`[Delivery] Stock updated for ${item.brandName} - ${item.giftCardId}: ${newStock}`);
        }
      }

      results.push({
        giftCardId: item.giftCardId,
        brandName: item.brandName,
        success: true,
        deliveryEmail: item.deliveryEmail,
        denomination: item.denomination,
        quantity: item.quantity,
      });
    } catch (err) {
      console.error(`[Delivery] Error delivering ${item.giftCardId}:`, err.message);
      results.push({
        giftCardId: item.giftCardId,
        success: false,
        error: err.message,
      });
    }
  }

  return { alreadyDelivered: false, results };
}
