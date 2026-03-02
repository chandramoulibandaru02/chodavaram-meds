// CallMeBot WhatsApp API integration for order notifications
const PHARMACY_PHONE = "+917799303531";

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
    .map((item, i) => `${i + 1}. ${item.name} x${item.quantity} - Rs.${item.finalPrice * item.quantity}`)
    .join("\n");

  const message = `🏥 *New Order Received!*

📋 Order ID: ${order.orderId}
👤 Customer: ${order.customerName}
📞 Phone: ${order.customerPhone}

🛒 Items:
${itemsList}

💰 Total: Rs.${order.totalAmount}
📍 Address: ${order.address}
💳 Payment: ${order.paymentMethod}

⏰ ${new Date().toLocaleString("en-IN")}`.trim();

  try {
    const encodedMessage = encodeURIComponent(message);
    const apiKey = "YOUR_CALLMEBOT_API_KEY"; // Replace with actual CallMeBot API key
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(PHARMACY_PHONE)}&text=${encodedMessage}&apikey=${apiKey}`;

    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error("WhatsApp notification failed:", error);
    return false;
  }
};
