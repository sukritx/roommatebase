const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const Room = require('../models/Room');
const auth = require('../middleware/authMiddleware');

// Create an inquiry
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, terms, message } = req.body;

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    // Check if user already has an active inquiry for this room
    const existingInquiry = await Inquiry.findOne({
      student: req.user._id,
      room: roomId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingInquiry) {
      return res.status(400).json({ error: 'You already have an active inquiry for this room' });
    }

    const inquiry = new Inquiry({
      student: req.user._id,
      room: roomId,
      terms,
      message
    });

    await inquiry.save();
    
    // Populate necessary fields
    await inquiry.populate('student', 'profile.name profile.profilePicture');
    await inquiry.populate('room', 'title location');
    
    res.status(201).json(inquiry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all inquiries for a room (room owner only)
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.roomId, owner: req.user._id });
    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    const inquiries = await Inquiry.find({ room: req.params.roomId })
      .populate('student', 'profile.name profile.profilePicture')
      .populate('matchedWith', 'profile.name profile.profilePicture')
      .sort('-createdAt');

    res.json(inquiries);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all inquiries by a student
router.get('/my-inquiries', auth, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ student: req.user._id })
      .populate('room', 'title location images')
      .populate('matchedWith', 'profile.name profile.profilePicture')
      .sort('-createdAt');

    res.json(inquiries);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update inquiry status (accept/reject - room owner only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('room');

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Verify room ownership
    const room = await Room.findOne({ _id: inquiry.room._id, owner: req.user._id });
    if (!room) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update inquiry status
    inquiry.status = status;
    
    if (status === 'accepted') {
      // Add student to room's current roommates if accepted
      if (!room.currentRoommates.includes(inquiry.student)) {
        if (room.currentRoommates.length >= room.maxRoommates) {
          return res.status(400).json({ error: 'Room is already at maximum capacity' });
        }
        room.currentRoommates.push(inquiry.student);
        await room.save();
      }
    }

    await inquiry.save();
    
    res.json(inquiry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Match with other students' inquiries
router.post('/:id/match', auth, async (req, res) => {
  try {
    const { matchInquiryId } = req.body;
    const inquiry = await Inquiry.findOne({ 
      _id: req.params.id,
      student: req.user._id,
      status: 'pending'
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found or unauthorized' });
    }

    const matchInquiry = await Inquiry.findOne({
      _id: matchInquiryId,
      room: inquiry.room,
      status: 'pending'
    });

    if (!matchInquiry) {
      return res.status(404).json({ error: 'Match inquiry not found' });
    }

    // Add each student to the other's matched list
    if (!inquiry.matchedWith.includes(matchInquiry.student)) {
      inquiry.matchedWith.push(matchInquiry.student);
    }
    if (!matchInquiry.matchedWith.includes(inquiry.student)) {
      matchInquiry.matchedWith.push(inquiry.student);
    }

    await Promise.all([inquiry.save(), matchInquiry.save()]);
    
    res.json(inquiry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Withdraw an inquiry (student only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { status: 'withdrawn' },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found or unauthorized' });
    }

    // Remove student from room's current roommates if they were accepted
    if (inquiry.status === 'accepted') {
      await Room.findByIdAndUpdate(inquiry.room, {
        $pull: { currentRoommates: req.user._id }
      });
    }

    res.json({ message: 'Inquiry withdrawn successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
