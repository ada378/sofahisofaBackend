import Lead from '../models/Lead.js';

// @desc    Create new lead
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  try {
    const { name, phone, source } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Check if lead already exists (within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existingLead = await Lead.findOne({
      phone,
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (existingLead) {
      return res.status(200).json({ 
        message: 'Thank you! We already have your details.',
        lead: existingLead 
      });
    }

    const lead = await Lead.create({
      name,
      phone,
      source: source || 'popup'
    });

    res.status(201).json({
      message: 'Thank you! We will contact you soon.',
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to submit details' 
    });
  }
};

// @desc    Get all leads (Admin)
// @route   GET /api/leads
// @access  Private/Admin
export const getAllLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await Lead.countDocuments();
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      leads,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
};

// @desc    Update lead status
// @route   PUT /api/leads/:id
// @access  Private/Admin
export const updateLead = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (status) lead.status = status;
    if (notes !== undefined) lead.notes = notes;

    await lead.save();

    res.json({ message: 'Lead updated', lead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(400).json({ message: 'Failed to update lead' });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.deleteOne();

    res.json({ message: 'Lead deleted' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Failed to delete lead' });
  }
};
