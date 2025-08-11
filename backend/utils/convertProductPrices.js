// utils/convertProductPrices.js
const { convertPrice } = require('./currency'); // your existing price converter
const convertProductPrices = async (product, currency = 'aed') => {
  if (!product) return null;

  const productObj = product?.toObject ? product.toObject() : product;

  // Convert main prices
  const mainPrice = await convertPrice(productObj.price, currency);
  const oldPrice = productObj.oldPrice
    ? await convertPrice(productObj.oldPrice, currency)
    : null;

  // Convert variants
  const variants = await Promise.all(
    (productObj.variants || []).map(async (variant) => {
      const variantPrice = variant.price
        ? await convertPrice(variant.price, currency)
        : null;

      // Convert sizes
      const sizes = await Promise.all(
        (variant.sizes || []).map(async (size) => ({
          ...size,
          price: size.price ? await convertPrice(size.price, currency) : undefined,
        }))
      );

      return {
        ...variant,
        price: variantPrice,
        sizes,
      };
    })
  );

  return {
    ...productObj,
    price: mainPrice,
    oldPrice,
    variants,
    currency,
  };
};
const convertCartItemPrices = async (item, currency = 'aed') => {
  const convertedPrice = await convertPrice(item.product.price, currency);
  const convertedSubtotal = await convertPrice(item.subtotal, currency);

  return {
    ...item,
    product: {
      ...item.product,
      price: convertedPrice,
    },
    subtotal: convertedSubtotal,
    currency,
  };
};
module.exports = {
  convertProductPrices,
  convertCartItemPrices,
};


