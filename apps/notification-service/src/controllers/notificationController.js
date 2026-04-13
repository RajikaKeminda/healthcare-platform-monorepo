const { sendEmail } = require('../config/email');
const { sendSMS } = require('../config/sms');
const Notification = require('../models/Notification');

const getEmailTemplate = (eventType, appointment) => {
  const templates = {
    booking_confirmed: {
      subject: 'Appointment Booking Confirmed',
      html: `
        <h2>Appointment Booking Confirmed</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment has been successfully booked.</p>
        <ul>
          <li><strong>Doctor:</strong> ${appointment.doctorName}</li>
          <li><strong>Specialization:</strong> ${appointment.doctorSpecialization || 'N/A'}</li>
          <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${appointment.startTime}</li>
          <li><strong>Type:</strong> ${appointment.type}</li>
          <li><strong>Consultation Fee:</strong> $${appointment.consultationFee}</li>
        </ul>
        <p>Please ensure you complete the payment to confirm your appointment.</p>
        <p>Thank you for using our Healthcare Platform!</p>
      `
    },
    appointment_confirmed: {
      subject: 'Appointment Confirmed by Doctor',
      html: `
        <h2>Your Appointment is Confirmed</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment with <strong>${appointment.doctorName}</strong> has been confirmed.</p>
        <ul>
          <li><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${appointment.startTime}</li>
        </ul>
        <p>Please be ready 5 minutes before the scheduled time.</p>
      `
    },
    appointment_cancelled: {
      subject: 'Appointment Cancelled',
      html: `
        <h2>Appointment Cancelled</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment scheduled for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.startTime} has been cancelled.</p>
        ${appointment.cancellationReason ? `<p><strong>Reason:</strong> ${appointment.cancellationReason}</p>` : ''}
        <p>Please book another appointment if needed.</p>
      `
    },
    consultation_completed: {
      subject: 'Consultation Completed - Thank You',
      html: `
        <h2>Consultation Completed</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your telemedicine consultation with Dr. ${appointment.doctorName} has been completed.</p>
        <p>Your prescription (if any) has been added to your medical records.</p>
        <p>Thank you for using our Healthcare Platform. We wish you good health!</p>
      `
    }
  };
  return templates[eventType] || { subject: 'Healthcare Platform Notification', html: `<p>${JSON.stringify(appointment)}</p>` };
};

const sendAppointmentNotification = async (req, res) => {
  try {
    const { appointment, eventType } = req.body;
    const template = getEmailTemplate(eventType, appointment);

    const notification = await Notification.create({
      userId: appointment.patientId,
      type: 'email',
      category: eventType,
      subject: template.subject,
      message: template.html,
      recipient: appointment.patientEmail,
      appointmentId: appointment._id,
      status: 'pending',
    });

    try {
      if (appointment.patientEmail) {
        await sendEmail({
          to: appointment.patientEmail,
          subject: template.subject,
          html: template.html,
        });
      }
      notification.status = 'sent';
    } catch (err) {
      notification.status = 'failed';
      notification.error = err.message;
    }
    await notification.save();

    res.json({ message: 'Notification processed', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, userId } = req.body;
    const notification = await Notification.create({
      userId: userId || 'system',
      type: 'email',
      category: 'general',
      subject,
      message: html,
      recipient: to,
      status: 'pending',
    });
    try {
      await sendEmail({ to, subject, html });
      notification.status = 'sent';
    } catch (err) {
      notification.status = 'failed';
      notification.error = err.message;
    }
    await notification.save();
    res.json({ message: 'Email sent', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendCustomSMS = async (req, res) => {
  try {
    const { to, body, userId } = req.body;
    const notification = await Notification.create({
      userId: userId || 'system',
      type: 'sms',
      category: 'general',
      message: body,
      recipient: to,
      status: 'pending',
    });
    try {
      await sendSMS({ to, body });
      notification.status = 'sent';
    } catch (err) {
      notification.status = 'failed';
      notification.error = err.message;
    }
    await notification.save();
    res.json({ message: 'SMS sent', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendAppointmentNotification, sendCustomEmail, sendCustomSMS, getUserNotifications };
