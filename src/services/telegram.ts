const BOT_TOKEN = "LTUxODc2MjUyNTA";
const CHAT_ID = "Chandra_022005";

interface OrderItem {
  name: string;
  quantity: number;
  finalPrice: number;
}

interface TelegramOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  address: string;
  paymentMethod: string;
}

export const sendTelegramNotification = async (order: TelegramOrder) => {
  const itemsList = order.items
    .map((item, i) => `${i + 1}. ${item.name} x${item.quantity} - ₹${item.finalPrice * item.quantity}`)
    .join("\n");

  const message = `
🏥 *New Order Received!*

📋 *Order ID:* ${order.orderId}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}

🛒 *Items:*
${itemsList}

💰 *Total:* ₹${order.totalAmount}
📍 *Address:* ${order.address}
💳 *Payment:* ${order.paymentMethod}

⏰ ${new Date().toLocaleString("en-IN")}
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
};
