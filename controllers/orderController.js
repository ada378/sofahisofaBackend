import Order from "../models/Order.js";
import Product from "../models/Product.js";

// @route POST /api/orders  (works for both logged-in users and guests)
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, guestInfo } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: "No order items" });

  // Validate stock and calculate price from DB (never trust frontend prices)
  let itemsPrice = 0;
  const validatedItems = [];
  for (const it of items) {
    const product = await Product.findById(it.product);
    if (!product) return res.status(400).json({ message: `Product not found: ${it.name}` });
    if (product.stock < it.qty) {
      return res.status(400).json({ message: `"${product.name}" is out of stock` });
    }
    const linePrice = product.price * it.qty;
    itemsPrice += linePrice;
    validatedItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      fabricChoice: it.fabricChoice || "",
      qty: it.qty,
      price: product.price,
    });
  }

  const orderData = {
    items: validatedItems,
    shippingAddress,
    paymentMethod: "COD",
    itemsPrice,
    shippingPrice: 0,
    totalPrice: itemsPrice,
  };

  // Attach user if logged in, otherwise save guestInfo
  if (req.user) {
    orderData.user = req.user._id;
  } else {
    orderData.guestInfo = guestInfo || {};
  }

  const order = await Order.create(orderData);

  // Decrement stock
  for (const it of validatedItems) {
    await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.qty } });
  }

  res.status(201).json(order);
};

// @route GET /api/orders/my
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @route GET /api/orders/:id
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

// @route PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.status = req.body.status || order.status;
  if (order.status === "Delivered") order.deliveredAt = new Date();
  await order.save();
  res.json(order);
};

// @route GET /api/orders/admin/all  (admin)
export const getAllOrdersAdmin = async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.keyword) {
    // Search by order ID prefix (last 6 chars match) — MongoDB ObjectId string search
    filter._id = { $regex: req.query.keyword, $options: "i" };
  }

  const count = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("user", "name email phone");

  res.json({ orders, page, pages: Math.ceil(count / pageSize), total: count });
};

// @route GET /api/orders/admin/stats  (admin)
export const getOrderStats = async (req, res) => {
  const [total, placed, confirmed, dispatched, delivered, cancelled] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "Placed" }),
    Order.countDocuments({ status: "Confirmed" }),
    Order.countDocuments({ status: "Dispatched" }),
    Order.countDocuments({ status: "Delivered" }),
    Order.countDocuments({ status: "Cancelled" }),
  ]);

  // Revenue = sum of totalPrice for delivered orders
  const revenueResult = await Order.aggregate([
    { $match: { status: "Delivered" } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;

  // Revenue last 7 days (all orders regardless of status for chart)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ total, placed, confirmed, dispatched, delivered, cancelled, revenue, recentOrders });
};
