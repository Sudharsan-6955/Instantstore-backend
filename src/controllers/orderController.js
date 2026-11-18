const Order = require('../models/Order');

// Create Customer Order (Dynamic Storefront Checkout)
exports.createOrder = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.tenantSubdomain || req.body.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant identifier missing.' });
    }

    const { customer, items, subtotal, shipping, tax, total, paymentMethod } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer details and items are required.' });
    }

    // Generate tenant-prefixed order number
    const count = await Order.countDocuments({ tenantId: tenantId.toLowerCase() });
    const orderNumber = `ORD-${tenantId.substring(0, 4).toUpperCase()}-${1001 + count}`;

    const order = new Order({
      tenantId: tenantId.toLowerCase(),
      orderNumber,
      customer,
      items,
      subtotal: Number(subtotal),
      shipping: Number(shipping) || 0,
      tax: Number(tax) || 0,
      total: Number(total),
      paymentMethod: paymentMethod || 'Instant Card Simulation',
      paymentStatus: 'Paid',
      status: 'Pending',
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: `Order ${orderNumber} placed successfully!`,
      orderNumber,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Merchant Orders (Studio Scoped)
exports.getTenantOrders = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.merchant?.subdomain;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant identifier missing.' });
    }

    // Compound index { tenantId: 1, createdAt: -1 } ensures single-digit ms retrieval
    const orders = await Order.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });

    const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalRevenue,
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status (Merchant Studio)
exports.updateOrderStatus = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.merchant?.subdomain;
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, tenantId: tenantId.toLowerCase() },
      { $set: { ...(status && { status }), ...(paymentStatus && { paymentStatus }) } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cross-tenant access violation.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
