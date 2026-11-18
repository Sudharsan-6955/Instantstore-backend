const Product = require('../models/Product');

// List Products for a Tenant
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.tenantSubdomain;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant identifier missing.' });
    }

    const { category, search, featured } = req.query;
    let filter = { tenantId: tenantId.toLowerCase() };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Scoped query utilizes compound index { tenantId: 1, category: 1 } / { tenantId: 1, isFeatured: 1 }
    const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Product (Merchant Studio)
exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.tenantSubdomain || req.merchant?.subdomain;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant identifier missing.' });
    }

    const {
      title,
      description,
      price,
      compareAtPrice,
      category,
      images,
      inventory,
      badge,
      isFeatured,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ success: false, message: 'Title and price are required.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const product = new Product({
      tenantId: tenantId.toLowerCase(),
      title,
      slug,
      description: description || '',
      price: Number(price),
      compareAtPrice: Number(compareAtPrice) || 0,
      category: category || 'General',
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
      inventory: Number(inventory) || 50,
      badge: badge || '',
      isFeatured: Boolean(isFeatured),
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product added to tenant catalog.',
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.merchant?.subdomain;
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: tenantId.toLowerCase() },
      { $set: req.body },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or cross-tenant access rejected.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const tenantId = req.params.subdomain || req.merchant?.subdomain;
    const { id } = req.params;

    const result = await Product.findOneAndDelete({
      _id: id,
      tenantId: tenantId.toLowerCase(),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or cross-tenant access rejected.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product removed from tenant catalog.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
