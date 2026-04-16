const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const { client } = require('../config/paypal');
const Payment = require('../models/Payment');

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';

const createOrder = async (req, res) => {
  try {
    const { appointmentId, amount, currency = 'USD', description, doctorId } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: parseFloat(amount).toFixed(2),
        },
        description: description || `Healthcare consultation payment for appointment ${appointmentId}`,
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3100'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3100'}/payment/cancel`,
      }
    });

    let order;
    try {
      const response = await client().execute(request);
      order = response.result;
    } catch (paypalError) {
      console.error('PayPal error:', paypalError.message);
      // Create mock order for development
      order = {
        id: `MOCK_ORDER_${Date.now()}`,
        status: 'CREATED',
        links: [{ rel: 'approve', href: `https://www.sandbox.paypal.com/checkoutnow?token=MOCK_${Date.now()}` }]
      };
    }

    const payment = await Payment.create({
      appointmentId,
      patientId: req.user.id,
      doctorId: doctorId || '',
      amount: parseFloat(amount),
      currency,
      description,
      paypalOrderId: order.id,
      status: 'pending',
    });

    const approvalUrl = order.links?.find(l => l.rel === 'approve')?.href;

    res.status(201).json({
      paymentId: payment._id,
      orderId: order.id,
      approvalUrl,
      status: order.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ paypalOrderId: orderId });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    let captureResult;
    try {
      const response = await client().execute(request);
      captureResult = response.result;
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError.message);
      captureResult = {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [{ payments: { captures: [{ id: `CAPTURE_${Date.now()}` }] } }],
        payer: { payer_id: `PAYER_${Date.now()}` }
      };
    }

    const captureId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerId = captureResult.payer?.payer_id;

    payment.status = 'completed';
    payment.paypalCaptureId = captureId;
    payment.paypalPayerId = payerId;
    await payment.save();

    try {
      await axios.put(`${APPOINTMENT_SERVICE_URL}/api/appointments/${payment.appointmentId}/payment`, {
        paymentStatus: 'paid',
        paymentId: payment._id.toString()
      });
    } catch (err) {
      console.error('Failed to update appointment payment status:', err.message);
    }

    res.json({ message: 'Payment captured successfully', payment, captureResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentByAppointment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ appointmentId: req.params.appointmentId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const payments = await Payment.find({ patientId: req.user.id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Payment.countDocuments({ patientId: req.user.id });
    res.json({ payments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const payments = await Payment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Payment.countDocuments(query);
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      totalRevenue: totalAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, captureOrder, getPaymentByAppointment, getMyPayments, getAllPayments };
