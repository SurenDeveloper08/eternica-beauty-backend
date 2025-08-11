const mongoose = require('mongoose');

function mergeVariants(existingVariants = [], incomingVariants = []) {
  return incomingVariants.map(incoming => {
    const existingVariant = existingVariants.find(v => v._id?.toString() === incoming._id?.toString());
    const variantId = existingVariant?._id || new mongoose.Types.ObjectId();

    const updatedSizes = (incoming.sizes || []).map(size => {
      const existingSize = existingVariant?.sizes?.find(s => s._id?.toString() === size._id?.toString());
      const sizeId = existingSize?._id || new mongoose.Types.ObjectId();

      return {
        _id: sizeId,
        name: size.name,
        price: Number(size.price || 0),
        stock: Number(size.stock || 0),
        images: size.images || [],
        longImages: size.longImages || [],
      };
    });

    return {
      _id: variantId,
      color: incoming.color,
      colorCode: incoming.colorCode,
      price: Number(incoming.price || 0),
      stock: Number(incoming.stock || 0),
      images: incoming.images || [],
      longImages: incoming.longImages || [],
      sizes: updatedSizes,
    };
  });
}
