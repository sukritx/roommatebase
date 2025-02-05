const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { fileUpload } = require('../middleware/file-upload');

// Create a room listing
router.post('/', auth, fileUpload({ destination: 'rooms', multiple: true, maxCount: 5 }), async (req, res) => {
  try {
    const { title, description, maxRoommates, availableFrom, pricePerMonth, location, contractTerms, amenities } = req.body;

    // Create Stripe payment session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Room Listing Fee',
          },
          unit_amount: 3000, // $30.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/rooms/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/rooms/cancel`,
    });

    // Create room with payment pending
    const room = new Room({
      owner: req.user._id,
      title,
      description,
      maxRoommates,
      availableFrom,
      pricePerMonth,
      location,
      contractTerms,
      amenities,
      images: req.files.map(file => ({ url: file.location, publicId: file.key })),
      paymentStatus: 'pending',
      stripePaymentId: session.id
    });

    await room.save();
    res.json({ room, sessionId: session.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all room listings with filters
router.get('/', async (req, res) => {
  try {
    const {
      priceMin,
      priceMax,
      maxRoommates,
      amenities,
      location,
      status = 'available'
    } = req.query;

    let query = { status };

    if (priceMin || priceMax) {
      query.pricePerMonth = {};
      if (priceMin) query.pricePerMonth.$gte = Number(priceMin);
      if (priceMax) query.pricePerMonth.$lte = Number(priceMax);
    }

    if (maxRoommates) {
      query.maxRoommates = { $lte: Number(maxRoommates) };
    }

    if (amenities) {
      const amenitiesList = amenities.split(',');
      amenitiesList.forEach(amenity => {
        query[`amenities.${amenity}`] = true;
      });
    }

    if (location) {
      // Add location-based search using coordinates
      const coordinates = location.split(',').map(Number);
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: 10000 // 10km radius
        }
      };
    }

    const rooms = await Room.find(query)
      .populate('owner', 'profile.name profile.profilePicture')
      .populate('currentRoommates', 'profile.name profile.profilePicture')
      .sort('-createdAt');

    res.json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'profile.name profile.profilePicture')
      .populate('currentRoommates', 'profile.name profile.profilePicture');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a room listing
router.put('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    Object.assign(room, req.body);
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark room as filled
router.patch('/:id/fill', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    room.status = 'filled';
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a room listing
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }
    
    res.json({ message: 'Room listing deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stripe webhook for payment confirmation
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update room payment status
    await Room.findOneAndUpdate(
      { stripePaymentId: session.id },
      { paymentStatus: 'paid' }
    );
  }

  res.json({ received: true });
});

module.exports = router;
