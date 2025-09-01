export const formatDate = (date) => {
  if (date == null) return "";
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
};

export function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export const formatCurrency = (amount, upto = 2) => {
  const numberAmount = parseFloat(amount);

  if (Number.isInteger(numberAmount)) {
    return `$${numberAmount.toString()}`;
  }

  return `$${numberAmount.toFixed(upto)}`;
};

export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

export const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const processCartOffers = (cartProducts: any[]) => {
  const result = {
    productsWithOffers: [] as any[],
    freeProducts: [] as any[],
    remainingProducts: [] as any[],
  };

  const cartProductMap = new Map(
    cartProducts.map((product) => [product._id, { ...product, remainingQuantity: product.quantity }])
  );

  cartProducts.forEach((product) => {
    let remainingQuantity: number = product.quantity;
    let offerApplied = false;

    // Check if the product has offers
    if (product.offers && product.offers.length > 0) {
      product.offers.forEach((offer: any) => {
        const offerApplications = Math.floor(remainingQuantity / offer.purchaseQuantity);
        if (offerApplications > 0) {
          offerApplied = true;
          const quantityWithOffer = offerApplications * offer.purchaseQuantity;
          
          // Add the product with the offer
          result.productsWithOffers.push({
            ...product,
            quantity: quantityWithOffer,
            offerApplied: true,
          });

          // Process free products
          offer.products.forEach((freeProduct: any) => {
            const cartProduct = cartProductMap.get(freeProduct._id);
            if (cartProduct) {
              const freeQuantity = offerApplications * offer.freeQuantity;
              
              // Add to freeProducts
              const existingFreeProduct = result.freeProducts.find(
                (p) => p._id === freeProduct._id
              );
              if (existingFreeProduct) {
                existingFreeProduct.quantity += freeQuantity;
              } else {
                result.freeProducts.push({
                  ...cartProduct,
                  quantity: freeQuantity,
                  actualPrice: 0,
                  offerPrice: 0,
                });
              }

              // Adjust the remaining quantity of the free product
              cartProduct.remainingQuantity = Math.max(0, cartProduct.remainingQuantity - freeQuantity);
            }
          });

          remainingQuantity -= quantityWithOffer;
        }
      });
    }

    // Add remaining quantity as a separate product if offer was applied or if no offer was applied
    if (remainingQuantity > 0) {
      result.remainingProducts.push({
        ...product,
        quantity: remainingQuantity,
      });
    }
  });

  // Create a map of free product IDs to their quantities
  const freeProductMap = new Map(
    result.freeProducts.map(product => [product._id, product.quantity])
  );

  // Adjust remaining quantities for products that were given as free and add freeProductQuantity
  cartProductMap.forEach((product, productId) => {
    const remainingProduct = result.remainingProducts.find(p => p._id === productId);
    if (remainingProduct) {
      remainingProduct.quantity = product.remainingQuantity;
      if (freeProductMap.has(productId)) {
        remainingProduct.freeProductQuantity = freeProductMap.get(productId);
      }
    } else if (product.remainingQuantity > 0) {
      const newRemainingProduct = {
        ...product,
        quantity: product.remainingQuantity,
      };
      if (freeProductMap.has(productId)) {
        newRemainingProduct.freeProductQuantity = freeProductMap.get(productId);
      }
      result.remainingProducts.push(newRemainingProduct);
    }
  });

  return result;
};