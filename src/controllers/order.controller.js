const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { Product } = require('../models/Product');
const Auction = require('../models/Auction');
const PDFDocument = require('pdfkit');

// @desc    Checkout and create a new order from buyer's cart
// @route   POST /api/orders/checkout
// @access  Private
exports.checkout = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Shipping address is required for checkout'
      });
    }

    // Validate shipping address fields
    const { fullName, streetAddress, city, state, zipCode, phoneNumber } = shippingAddress;
    if (!fullName || !streetAddress || !city || !state || !zipCode || !phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'All shipping address fields (fullName, streetAddress, city, state, zipCode, phoneNumber) are required'
      });
    }

    // 1. Fetch the user's cart populated with current product details
    const cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price stock status sellerId'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Your cart is empty'
      });
    }

    // 2. Verify all items are still in stock and available (or are won auctions)
    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        return res.status(400).json({
          status: 'error',
          message: 'One of the items in your cart is no longer available'
        });
      }

      // Check if this is a won auction
      const completedAuction = await Auction.findOne({
        productId: product._id,
        highestBidder: req.user._id,
        status: 'completed'
      });

      if (!completedAuction) {
        if (product.status !== 'available' || product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: `Product "${product.title}" is out of stock or no longer available in the requested quantity`
          });
        }
      }
    }

    // 3. Extract unique seller IDs and prepare snapshot item details
    const sellerIdsSet = new Set();
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.productId;
      
      // Store sellerId (convert to string first to make unique check work in set)
      if (product.sellerId) {
        sellerIdsSet.add(product.sellerId.toString());
      }

      // Check if this is a won auction to override price
      const completedAuction = await Auction.findOne({
        productId: product._id,
        highestBidder: req.user._id,
        status: 'completed'
      });

      const priceAtPurchase = completedAuction ? completedAuction.currentHighestBid : product.price;

      orderItems.push({
        productId: product._id,
        title: product.title,
        priceAtPurchase,
        quantity: item.quantity
      });

      totalAmount += priceAtPurchase * item.quantity;
    }

    const sellerIds = Array.from(sellerIdsSet);

    // 4. Create the new Order document
    const order = await Order.create({
      buyerId: req.user._id,
      sellerIds,
      items: orderItems,
      shippingAddress: {
        fullName,
        streetAddress,
        city,
        state,
        zipCode,
        phoneNumber
      },
      paymentStatus: 'pending', // default pending
      orderStatus: 'processing', // default processing
      totalAmount
    });

    // 5. Update product stock and status safely
    for (const item of cart.items) {
      const product = item.productId;
      if (product.stock > 0) {
        product.stock -= item.quantity;
        if (product.stock <= 0) {
          product.stock = 0;
          product.status = 'sold';
        }
        await product.save();
      }
    }

    // 6. Clear user's Cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in buyer's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'title images category weightGrams jewelryType metalType carat color clarity cut shape description listingType'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in seller's orders
// @route   GET /api/orders/seller-orders
// @access  Private
exports.getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerIds: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'images category'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by order ID
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure the user is authorized (either buyer or one of the sellers)
    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isSeller = order.sellerIds.some(id => id.toString() === req.user._id.toString());

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending order and restore items to user's cart
// @route   POST /api/orders/:orderId/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure only the buyer can cancel their pending order
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this order'
      });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.paymentStatus = 'failed';
    await order.save();

    // Restore items to user's Cart
    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = new Cart({ buyerId: req.user._id, items: [] });
    }

    for (const item of order.items) {
      const itemIndex = cart.items.findIndex(
        cItem => cItem.productId.toString() === item.productId.toString()
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += item.quantity;
      } else {
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtPurchase
        });
      }
    }

    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully and items restored to cart'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order's tracking number and fulfillment status
// @route   PUT /api/orders/:orderId/tracking
// @access  Private (Seller/Admin)
exports.updateTrackingStatus = async (req, res, next) => {
  try {
    const { fulfillmentStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure authorized seller or admin
    const isSeller = order.sellerIds.some(id => id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update tracking for this order'
      });
    }

    if (fulfillmentStatus) {
      const allowedStatus = ['processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowedStatus.includes(fulfillmentStatus)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid fulfillment status'
        });
      }
      order.fulfillmentStatus = fulfillmentStatus;
      order.orderStatus = fulfillmentStatus; // sync
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Order tracking updated successfully',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a PDF invoice for an order
// @route   GET /api/orders/:orderId/invoice
// @access  Private (Buyer/Admin)
exports.getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('buyerId', 'name email phone')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure only the buyer or an admin can access this invoice
    const isBuyer = order.buyerId && order.buyerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view the invoice for this order'
      });
    }

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

    doc.pipe(res);

    // 1. Zivora Vector Logo & Header
    // Circle center: x=70, y=55, r=20, background: Warm Taupe (#A48374)
    doc.circle(70, 55, 20).fill('#A48374');
    
    // Rotated square (diamond shape) inside the circle
    doc.moveTo(70, 46)
       .lineTo(79, 55)
       .lineTo(70, 64)
       .lineTo(61, 55)
       .closePath()
       .fill('#FFFFFF');

    // Zivora Brand Text
    doc.fillColor('#3A2D28')
       .font('Times-Roman')
       .fontSize(22)
       .text('ZIVORA', 105, 42, { characterSpacing: 2 });

    doc.fillColor('#A48374')
       .font('Helvetica-Bold')
       .fontSize(7)
       .text('FINE DIAMONDS', 106, 62, { characterSpacing: 1.5 });

    // Invoice Title (Right Aligned)
    doc.fillColor('#3A2D28')
       .font('Helvetica-Bold')
       .fontSize(16)
       .text('JEWELRY INVOICE', 350, 48, { align: 'right', width: 212 });

    // Thin Divider Line
    doc.strokeColor('#A48374')
       .lineWidth(1)
       .moveTo(50, 85)
       .lineTo(562, 85)
       .stroke();

    // 2. Invoice Meta Details & Billing Information
    // Draw a light beige block for "Invoice Info" section
    doc.fillColor('#F1EDE6')
       .rect(50, 100, 512, 18)
       .fill();

    doc.fillColor('#3A2D28')
       .font('Helvetica-Bold')
       .fontSize(9)
       .text('INVOICE INFORMATION', 58, 105);

    doc.fillColor('#F1EDE6')
       .rect(300, 100, 262, 18)
       .fill();

    doc.fillColor('#3A2D28')
       .font('Helvetica-Bold')
       .fontSize(9)
       .text('SHIPPED / BILLED TO', 308, 105);

    // Left side metadata
    const infoYStart = 128;
    doc.fillColor('#3A2D28').font('Helvetica-Bold').fontSize(8.5).text('Invoice No:', 58, infoYStart);
    doc.font('Helvetica').fontSize(8.5).text(`#${order._id.toString().toUpperCase()}`, 130, infoYStart);

    doc.font('Helvetica-Bold').fontSize(8.5).text('Date Issued:', 58, infoYStart + 15);
    doc.font('Helvetica').fontSize(8.5).text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 130, infoYStart + 15);

    doc.font('Helvetica-Bold').fontSize(8.5).text('Payment Status:', 58, infoYStart + 30);
    doc.font('Helvetica').fontSize(8.5).fillColor(order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B').text(order.paymentStatus.toUpperCase(), 130, infoYStart + 30);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#3A2D28').text('Shipping Status:', 58, infoYStart + 45);
    doc.font('Helvetica').fontSize(8.5).text((order.fulfillmentStatus || order.orderStatus).toUpperCase(), 130, infoYStart + 45);

    if (order.trackingNumber) {
      doc.font('Helvetica-Bold').fontSize(8.5).text('Tracking No:', 58, infoYStart + 60);
      doc.font('Helvetica').fontSize(8.5).text(order.trackingNumber, 130, infoYStart + 60);
    }

    // Right side client details
    const buyerName = order.shippingAddress.fullName || (order.buyerId && order.buyerId.name) || 'Valued Client';
    const buyerEmail = (order.buyerId && order.buyerId.email) || 'N/A';
    const buyerPhone = order.shippingAddress.phoneNumber || (order.buyerId && order.buyerId.phone) || 'N/A';

    doc.fillColor('#3A2D28')
       .font('Helvetica-Bold').fontSize(8.5).text('Name:', 308, infoYStart)
       .font('Helvetica').fontSize(8.5).text(buyerName, 360, infoYStart)
       
       .font('Helvetica-Bold').text('Email:', 308, infoYStart + 15)
       .font('Helvetica').text(buyerEmail, 360, infoYStart + 15)
       
       .font('Helvetica-Bold').text('Phone:', 308, infoYStart + 30)
       .font('Helvetica').text(buyerPhone, 360, infoYStart + 30)
       
       .font('Helvetica-Bold').text('Address:', 308, infoYStart + 45)
       .font('Helvetica').text(`${order.shippingAddress.streetAddress}\n${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}`, 360, infoYStart + 45, { width: 190, lineGap: 2 });

    // 3. Items Table Header
    const tableTop = 230;
    doc.rect(50, tableTop, 512, 22).fill('#A48374');

    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(8.5);

    doc.text('PRODUCT ID / SKU', 60, tableTop + 7, { width: 110 });
    doc.text('DESCRIPTION', 180, tableTop + 7, { width: 200 });
    doc.text('QTY', 390, tableTop + 7, { width: 30, align: 'center' });
    doc.text('UNIT PRICE', 430, tableTop + 7, { width: 60, align: 'right' });
    doc.text('AMOUNT', 500, tableTop + 7, { width: 55, align: 'right' });

    // Table Body Rows
    let currentY = tableTop + 22;
    doc.fillColor('#3A2D28').font('Helvetica').fontSize(8);

    order.items.forEach((item, index) => {
      // Alternating row background for subtle luxury feel
      if (index % 2 === 1) {
        doc.fillColor('#FBF9F6').rect(50, currentY, 512, 26).fill();
      }
      
      doc.fillColor('#3A2D28');
      
      // Product ID / SKU snapshot
      const prodIdStr = item.productId ? item.productId._id.toString().substring(18).toUpperCase() : 'N/A';
      doc.text(prodIdStr, 60, currentY + 8, { width: 110 });
      
      // Product Description with details
      let descText = item.title;
      if (item.productId) {
        if (item.productId.jewelryType) {
          descText += ` (${item.productId.metalType}, ${item.productId.weightGrams}g)`;
        } else if (item.productId.carat) {
          descText += ` (${item.productId.carat}ct ${item.productId.shape}, ${item.productId.color}/${item.productId.clarity})`;
        }
      }
      doc.text(descText, 180, currentY + 8, { width: 200, height: 16, ellipsis: true });
      
      // Qty
      doc.text(item.quantity.toString(), 390, currentY + 8, { width: 30, align: 'center' });
      
      // Unit Price
      doc.text(`INR ${item.priceAtPurchase.toLocaleString('en-IN')}`, 430, currentY + 8, { width: 60, align: 'right' });
      
      // Amount
      const amountStr = `INR ${(item.priceAtPurchase * item.quantity).toLocaleString('en-IN')}`;
      doc.text(amountStr, 500, currentY + 8, { width: 55, align: 'right' });
      
      // Draw cell bottom border
      doc.strokeColor('#E6DFD6')
         .lineWidth(0.5)
         .moveTo(50, currentY + 26)
         .lineTo(562, currentY + 26)
         .stroke();
         
      currentY += 26;
    });

    // Grand Total block
    const totalBlockY = currentY + 15;
    doc.rect(350, totalBlockY, 212, 30).fill('#3A2D28');
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('GRAND TOTAL', 362, totalBlockY + 10)
       .text(`INR ${order.totalAmount.toLocaleString('en-IN')}`, 450, totalBlockY + 10, { width: 100, align: 'right' });

    // Payment Info
    doc.fillColor('#3A2D28')
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text('Payment Information', 58, totalBlockY)
       .font('Helvetica')
       .fontSize(8)
       .text(`Method: Razorpay Secured Payment\nTransaction Ref: ${order.razorpayPaymentId || 'N/A'}\nPayment Status: ${order.paymentStatus.toUpperCase()}`, 58, totalBlockY + 14, { lineGap: 3 });

    // Customer Signature section
    const signatureY = totalBlockY + 70;
    doc.strokeColor('#A48374')
       .lineWidth(0.5)
       .moveTo(380, signatureY)
       .lineTo(540, signatureY)
       .stroke();
       
    doc.fillColor('#3A2D28')
       .font('Helvetica')
       .fontSize(8)
       .text('Customer / Authorized Signature', 380, signatureY + 5, { align: 'center', width: 160 });

    // Exquisite jewelry thank you message at the bottom
    const bottomY = 720;
    doc.strokeColor('#E6DFD6')
       .lineWidth(0.5)
       .moveTo(50, bottomY - 15)
       .lineTo(562, bottomY - 15)
       .stroke();

    doc.fillColor('#A48374')
       .font('Times-Italic')
       .fontSize(10)
       .text('Thank you for choosing us! We hope you enjoy your exquisite jewellery.', 50, bottomY, { align: 'center', width: 512 });

    doc.end();
  } catch (error) {
    next(error);
  }
};
