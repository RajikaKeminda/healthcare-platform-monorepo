const axios = require('axios');
const Appointment = require('../models/Appointment');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

const notifyUsers = async (appointment, eventType) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/appointment`, {
      appointment,
      eventType
    });
  } catch (err) {
    console.error('Notification service error:', err.message);
  }
};

const createAppointment = async (req, res) => {
  try {
    const {
      doctorId, doctorName, doctorSpecialization,
      appointmentDate, startTime, endTime, duration,
      type, reason, consultationFee
    } = req.body;

    const appointment = await Appointment.create({
      patientId: req.user.id,
      patientName: req.user.name,
      patientEmail: req.user.email,
      doctorId,
      doctorName,
      doctorSpecialization,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      duration,
      type: type || 'telemedicine',
      reason,
      consultationFee: consultationFee || 0,
      meetingId: `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    await notifyUsers(appointment, 'booking_confirmed');
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { patientId: req.user.id };
    if (status) query.status = status;
    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: -1 });
    const total = await Appointment.countDocuments(query);
    res.json({ appointments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user.id };
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      query.appointmentDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999))
      };
    }
    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1 });
    const total = await Appointment.countDocuments(query);
    res.json({ appointments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const allowedStatuses = ['confirmed', 'cancelled', 'completed', 'no-show'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (status === 'cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancellationReason = cancellationReason;
    }
    await appointment.save();

    if (status === 'confirmed') await notifyUsers(appointment, 'appointment_confirmed');
    if (status === 'cancelled') await notifyUsers(appointment, 'appointment_cancelled');
    if (status === 'completed') await notifyUsers(appointment, 'consultation_completed');

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patientId !== req.user.id && appointment.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user.role;
    appointment.cancellationReason = reason;
    await appointment.save();
    await notifyUsers(appointment, 'appointment_cancelled');
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentId },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin
const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const query = {};
    if (status) query.status = status;
    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Appointment.countDocuments(query);
    res.json({ appointments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment, getAppointmentById, getPatientAppointments,
  getDoctorAppointments, updateAppointmentStatus, cancelAppointment,
  updatePaymentStatus, getAllAppointments
};
