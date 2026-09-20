import User from "../models/User.js";

// @route GET /api/users/admin/all  (admin)
export const getAllUsersAdmin = async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const filter = {};
  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: "i" } },
      { email: { $regex: req.query.keyword, $options: "i" } },
    ];
  }
  if (req.query.role) filter.role = req.query.role;

  const count = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
};

// @route GET /api/users/admin/stats  (admin)
export const getUserStats = async (req, res) => {
  const [total, admins, customers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "customer" }),
  ]);
  res.json({ total, admins, customers });
};

// @route PUT /api/users/:id/role  (admin)
export const updateUserRole = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot change your own role" });
  }
  user.role = req.body.role || user.role;
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

// @route DELETE /api/users/:id  (admin)
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }
  await user.deleteOne();
  res.json({ message: "User removed" });
};
