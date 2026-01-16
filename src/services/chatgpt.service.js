// src/services/chatgpt.service.js
import apiClient from "./api.js";

/**
 * Get price estimate from ChatGPT API for a product/item
 * @param {string} itemName - Name of the item/product
 * @param {string} itemDescription - Optional description
 * @returns {Promise<number>} - Estimated price in VND
 */
export const getPriceFromChatGPT = async (itemName, itemDescription = "") => {
  try {
    // Option 1: Call backend API that calls ChatGPT
    const response = await apiClient.post("/chatgpt/get-price", {
      itemName,
      itemDescription,
    });

    if (response.data?.success && response.data?.price) {
      return parseFloat(response.data.price);
    }

    // Option 2: Direct ChatGPT API call (if API key is available)
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    if (OPENAI_API_KEY) {
      const prompt = `Estimate the price in VND (Vietnamese Dong) for: ${itemName}${
        itemDescription ? ` - ${itemDescription}` : ""
      }. Return only a number, no currency symbols or text.`;

      const chatResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a price estimation assistant. Return only numbers.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 50,
            temperature: 0.3,
          }),
        }
      );

      if (chatResponse.ok) {
        const data = await chatResponse.json();
        const priceText = data.choices[0]?.message?.content?.trim();
        const price = parseFloat(priceText.replace(/[^\d.]/g, ""));
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
    }

    // Fallback: Return default price based on item type
    return getDefaultPrice(itemName);
  } catch (error) {
    console.error("Error getting price from ChatGPT:", error);
    return getDefaultPrice(itemName);
  }
};

/**
 * Get default price based on item name (fallback)
 */
const getDefaultPrice = (itemName) => {
  const name = itemName.toLowerCase();

  if (name.includes("projector") || name.includes("screen")) return 500000;
  if (name.includes("microphone") || name.includes("speaker")) return 300000;
  if (name.includes("laptop") || name.includes("macbook")) return 20000000;
  if (name.includes("table") || name.includes("chair")) return 200000;
  if (name.includes("camera")) return 10000000;
  if (name.includes("lighting")) return 1000000;
  if (name.includes("printed") || name.includes("material")) return 5000;

  return 100000; // Default price
};

export default {
  getPriceFromChatGPT,
};
