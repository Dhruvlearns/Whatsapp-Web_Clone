const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    const { search, online, limit = 50, page = 1 } = req.query;

    let query = {};

    // Add search filter
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { profile_name: { $regex: search, $options: 'i' } },
          { wa_id: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Add online filter
    if (online === 'true') {
      query.is_online = true;
    }

    const users = await User.find(query)
      .sort({ last_seen: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      totalUsers,
      page: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by wa_id
router.get('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const user = await User.findByWaId(wa_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user
router.post('/', async (req, res) => {
  try {
    const { wa_id, name, profile_name, profile_picture, phone_number, status_message } = req.body;

    if (!wa_id || !name) {
      return res.status(400).json({ error: 'wa_id and name are required' });
    }

    const userData = {
      name,
      profile_name: profile_name || name,
    };

    if (profile_picture) userData.profile_picture = profile_picture;
    if (phone_number) userData.phone_number = phone_number;
    if (status_message) userData.status_message = status_message;

    const user = await User.findOneAndUpdate(
      { wa_id },
      userData,
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Update user profile
router.patch('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const updates = req.body;

    // Remove wa_id from updates to prevent modification
    delete updates.wa_id;

    const user = await User.findOneAndUpdate(
      { wa_id },
      updates,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user online status
router.patch('/:wa_id/status', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const { is_online } = req.body;

    const user = await User.findByWaId(wa_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.setOnline(is_online);

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;

    const user = await User.findOneAndDelete({ wa_id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    const users = await User.searchUsers(query).limit(20);

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get online users
router.get('/status/online', async (req, res) => {
  try {
    const users = await User.getOnlineUsers();

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('❌ Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

module.exports = router;
