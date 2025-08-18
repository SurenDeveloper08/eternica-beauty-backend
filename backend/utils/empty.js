const addToCart = async (qty) => {
  setIsLoading(true);
  setErrorMsg('');
  setSuccess(false);
  setAddQty(qty);

  if (!product?.slug) {
    setErrorMsg("Product slug is required.");
    setIsLoading(false);
    return;
  }

  try {
    if (token) {
      // 🔹 Logged-in flow → send directly to API
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/cart/add?qty=${qty}`,
        {
          slug: product?.slug,
          ...(selectedVariant?.variantId && { variantId: selectedVariant.variantId }),
          ...(selectedVariant?.sizeId && { sizeId: selectedVariant.sizeId }),
          ...(color && { color }),
          ...(size && { size }),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.success) {
        setSuccess(true);
        setMessage(res.data.message);
        await fetchUserCartQty();
        dispatch(getUserCart(token, currency));
      } else {
        setErrorMsg(res.data.message || "Failed to add to cart.");
      }

    } else {
      // 🔹 Guest flow → save locally + sync with API
      const guestCart = getGuestCart();

      // Check if product already in cart
      const existingIndex = guestCart.findIndex(
        (item) =>
          item.slug === product.slug &&
          item.color === color &&
          item.size === size
      );

      if (existingIndex > -1) {
        guestCart[existingIndex].quantity += qty;
      } else {
        guestCart.push({
          slug: product.slug,
          quantity: qty,
          color,
          size,
          variantId: selectedVariant?.variantId || null,
          sizeId: selectedVariant?.sizeId || null,
          priceConverted: price,
        });
      }

      saveGuestCart(guestCart);

      // 🔹 Call guest cart API (for totals, currency conversions, etc.)
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/cart/get?currency=${currency}`,
        { items: guestCart }
      );

      dispatch(cartSuccess({ ...data, isGuest: true }));

      setSuccess(true);
      setMessage("Item added to guest cart.");
    }
  } catch (error) {
    if (error.response?.status === 401) {
      navigate('/login');
    } else if (error.response?.data?.message) {
      setErrorMsg(error.response.data.message);
    } else {
      setErrorMsg("Network error. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
};
