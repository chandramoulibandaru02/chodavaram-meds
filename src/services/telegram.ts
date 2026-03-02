// Telegram Bot API integration for order notifications
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "";

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

// Track sent orders to prevent duplicates
const sentOrders = new Set<string>();

export const sendTelegramNotification = async (order: TelegramOrder): Promise<boolean> => {
  // Prevent duplicate sends
  if (sentOrders.has(order.orderId)) return true;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram credentials not configured. Set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID.");
    // Save notification to localStorage for later manual review
    const pending = JSON.parse(localStorage.getItem("pharmacy_pending_notifications") || "[]");
    pending.push({ ...order, timestamp: new Date().toISOString() });
    localStorage.setItem("pharmacy_pending_notifications", JSON.stringify(pending));
    return false;
  }

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
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (response.ok) {
      sentOrders.add(order.orderId);
      return true;
    }
    
    console.error("Telegram API error:", await response.text());
    return false;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    // Save to localStorage as fallback
    const pending = JSON.parse(localStorage.getItem("pharmacy_pending_notifications") || "[]");
    pending.push({ ...order, timestamp: new Date().toISOString() });
    localStorage.setItem("pharmacy_pending_notifications", JSON.stringify(pending));
    return false;
  }
};
