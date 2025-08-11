const axios = require("axios");

let exchangeRates = {}; // cached
let lastUpdated = null;
const roundUp = (price) => Math.ceil(price);

// Fetch and cache rates
const getExchangeRates = async () => {
    const now = Date.now();
    if (!lastUpdated || now - lastUpdated > 60 * 60 * 1000) {
        const res = await axios.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aed.json");
        exchangeRates = res.data.aed;
        lastUpdated = now;
    }
    return exchangeRates;
};


// Convert AED to selected currency
const convertPrice = async (aedPrice, toCurrency) => {
    if (toCurrency === "aed") return aedPrice;
    const rates = await getExchangeRates();
    const rate = rates[toCurrency.toLowerCase()];
    if (!rate) throw new Error("Currency not supported");
    const converted = aedPrice * rate;
    
    return roundUp(converted);
};

module.exports = { getExchangeRates, convertPrice };
