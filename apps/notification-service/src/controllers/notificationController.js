const { sendEmail } = require('../config/email');
const { sendSMS } = require('../config/sms');
const Notification = require('../models/Notification');

// ─── Email templates ────────────────────────────────────────────────────────

const getPatientEmailTemplate = (eventType, apt) => {
  const date = new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const templates = {
    booking_confirmed: {
      subject: '✅ Appointment Booked – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#2563eb;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+</h1>
            <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px">Your Healthcare Platform</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Appointment Booked Successfully ✅</h2>
            <p style="color:#374151">Dear <strong>${apt.patientName}</strong>,</p>
            <p style="color:#374151">Your appointment has been successfully booked. Here are your details:</p>
            <div style="background:#f0f9ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="color:#6b7280;padding:6px 0;width:40%">Doctor</td><td style="color:#111827;font-weight:600">Dr. ${apt.doctorName}</td></tr>
                ${apt.doctorSpecialization ? `<tr><td style="color:#6b7280;padding:6px 0">Specialization</td><td style="color:#111827">${apt.doctorSpecialization}</td></tr>` : ''}
                <tr><td style="color:#6b7280;padding:6px 0">Date</td><td style="color:#111827">${date}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Time</td><td style="color:#111827">${apt.startTime}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Type</td><td style="color:#111827">${apt.type}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Fee</td><td style="color:#111827;font-weight:600">$${apt.consultationFee}</td></tr>
              </table>
            </div>
            <p style="color:#374151">⚠️ Please complete the payment to confirm your appointment.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:32px">Thank you for choosing HealthCare+. We're here for your wellbeing.</p>
          </div>
        </div>`,
    },
    appointment_confirmed: {
      subject: '🎉 Appointment Confirmed – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#16a34a;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+</h1>
            <p style="color:#bbf7d0;margin:4px 0 0;font-size:14px">Your Healthcare Platform</p>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Your Appointment is Confirmed 🎉</h2>
            <p style="color:#374151">Dear <strong>${apt.patientName}</strong>,</p>
            <p style="color:#374151">Great news! Dr. <strong>${apt.doctorName}</strong> has confirmed your appointment.</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="color:#6b7280;padding:6px 0;width:40%">Date</td><td style="color:#111827;font-weight:600">${date}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Time</td><td style="color:#111827;font-weight:600">${apt.startTime}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Type</td><td style="color:#111827">${apt.type}</td></tr>
              </table>
            </div>
            <p style="color:#374151">Please be ready 5 minutes before the scheduled time.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:32px">HealthCare+ – Caring for you every step of the way.</p>
          </div>
        </div>`,
    },
    appointment_cancelled: {
      subject: '❌ Appointment Cancelled – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#dc2626;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Appointment Cancelled</h2>
            <p style="color:#374151">Dear <strong>${apt.patientName}</strong>,</p>
            <p style="color:#374151">Your appointment with Dr. <strong>${apt.doctorName}</strong> scheduled for <strong>${date} at ${apt.startTime}</strong> has been cancelled.</p>
            ${apt.cancellationReason ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0"><strong>Reason:</strong> ${apt.cancellationReason}</div>` : ''}
            <p style="color:#374151">You can book a new appointment anytime on HealthCare+.</p>
          </div>
        </div>`,
    },
    consultation_completed: {
      subject: '✨ Consultation Completed – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#7c3aed;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Consultation Completed ✨</h2>
            <p style="color:#374151">Dear <strong>${apt.patientName}</strong>,</p>
            <p style="color:#374151">Your telemedicine consultation with Dr. <strong>${apt.doctorName}</strong> has been completed successfully.</p>
            <p style="color:#374151">Any prescriptions issued by your doctor are now available in your HealthCare+ account under <strong>My Prescriptions</strong>.</p>
            <p style="color:#374151">We hope you feel better soon. Don't hesitate to book a follow-up if needed.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:32px">HealthCare+ – Your health, our priority.</p>
          </div>
        </div>`,
    },
  };

  return templates[eventType] || {
    subject: 'HealthCare+ Notification',
    html: `<p>${JSON.stringify(apt)}</p>`,
  };
};

const getDoctorEmailTemplate = (eventType, apt) => {
  const date = new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const templates = {
    booking_confirmed: {
      subject: '📋 New Appointment Request – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#0f172a;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+ — Doctor Portal</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">New Appointment Request 📋</h2>
            <p style="color:#374151">Dear <strong>Dr. ${apt.doctorName}</strong>,</p>
            <p style="color:#374151">You have received a new appointment request. Please review and confirm or reject it from your dashboard.</p>
            <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="color:#6b7280;padding:6px 0;width:40%">Patient</td><td style="color:#111827;font-weight:600">${apt.patientName}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Date</td><td style="color:#111827">${date}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Time</td><td style="color:#111827">${apt.startTime}</td></tr>
                <tr><td style="color:#6b7280;padding:6px 0">Type</td><td style="color:#111827">${apt.type}</td></tr>
                ${apt.reason ? `<tr><td style="color:#6b7280;padding:6px 0">Reason</td><td style="color:#111827">${apt.reason}</td></tr>` : ''}
              </table>
            </div>
            <p style="color:#6b7280;font-size:13px;margin-top:32px">Log in to HealthCare+ to manage this appointment.</p>
          </div>
        </div>`,
    },
    appointment_cancelled: {
      subject: '❌ Appointment Cancelled by Patient – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#0f172a;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+ — Doctor Portal</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Appointment Cancelled</h2>
            <p style="color:#374151">Dear <strong>Dr. ${apt.doctorName}</strong>,</p>
            <p style="color:#374151">The appointment with <strong>${apt.patientName}</strong> on <strong>${date} at ${apt.startTime}</strong> has been cancelled.</p>
            ${apt.cancellationReason ? `<p style="color:#374151"><strong>Reason:</strong> ${apt.cancellationReason}</p>` : ''}
          </div>
        </div>`,
    },
    consultation_completed: {
      subject: '✅ Consultation Marked Complete – HealthCare+',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#0f172a;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">HealthCare+ — Doctor Portal</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px">Consultation Completed ✅</h2>
            <p style="color:#374151">Dear <strong>Dr. ${apt.doctorName}</strong>,</p>
            <p style="color:#374151">Your consultation with <strong>${apt.patientName}</strong> on ${date} has been marked as completed.</p>
            <p style="color:#374151">The consultation record has been saved to the platform.</p>
          </div>
        </div>`,
    },
  };

  return templates[eventType] || null;
};

// ─── SMS templates ───────────────────────────────────────────────────────────

const getPatientSMSText = (eventType, apt) => {
  const date = new Date(apt.appointmentDate).toLocaleDateString();
  const map = {
    booking_confirmed:    `HealthCare+: Hi ${apt.patientName}, your appointment with Dr. ${apt.doctorName} on ${date} at ${apt.startTime} has been booked. Please complete payment to confirm.`,
    appointment_confirmed:`HealthCare+: Your appointment with Dr. ${apt.doctorName} on ${date} at ${apt.startTime} is CONFIRMED. Please be ready 5 min early.`,
    appointment_cancelled:`HealthCare+: Your appointment with Dr. ${apt.doctorName} on ${date} at ${apt.startTime} has been cancelled. Book again anytime.`,
    consultation_completed:`HealthCare+: Your consultation with Dr. ${apt.doctorName} is complete. Check your prescriptions in the app. Get well soon!`,
  };
  return map[eventType] || null;
};

const getDoctorSMSText = (eventType, apt) => {
  const date = new Date(apt.appointmentDate).toLocaleDateString();
  const map = {
    booking_confirmed:    `HealthCare+: Dr. ${apt.doctorName}, new appointment request from ${apt.patientName} on ${date} at ${apt.startTime}. Log in to confirm.`,
    appointment_cancelled:`HealthCare+: Dr. ${apt.doctorName}, appointment with ${apt.patientName} on ${date} at ${apt.startTime} has been cancelled.`,
  };
  return map[eventType] || null;
};

// ─── Helper: send one notification record ──────────────────────────────────

const dispatchAndRecord = async ({ userId, recipientEmail, recipientPhone, subject, html, smsText, appointmentId, eventType, forRole }) => {
  // Email
  if (recipientEmail) {
    const emailRecord = await Notification.create({
      userId,
      type: 'email',
      category: eventType,
      subject,
      message: html,
      recipient: recipientEmail,
      appointmentId,
      status: 'pending',
    });
    try {
      await sendEmail({ to: recipientEmail, subject, html });
      emailRecord.status = 'sent';
    } catch (err) {
      console.error(`Email failed (${forRole} ${recipientEmail}):`, err.message);
      emailRecord.status = 'failed';
      emailRecord.error = err.message;
    }
    await emailRecord.save();
  }

  // SMS
  if (recipientPhone && smsText) {
    const smsRecord = await Notification.create({
      userId,
      type: 'sms',
      category: eventType,
      message: smsText,
      recipient: recipientPhone,
      appointmentId,
      status: 'pending',
    });
    try {
      await sendSMS({ to: recipientPhone, body: smsText });
      smsRecord.status = 'sent';
    } catch (err) {
      console.error(`SMS failed (${forRole} ${recipientPhone}):`, err.message);
      smsRecord.status = 'failed';
      smsRecord.error = err.message;
    }
    await smsRecord.save();
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const sendAppointmentNotification = async (req, res) => {
  try {
    const { appointment: apt, eventType } = req.body;

    // Patient notification
    const patientTemplate = getPatientEmailTemplate(eventType, apt);
    await dispatchAndRecord({
      userId: apt.patientId,
      recipientEmail: apt.patientEmail,
      recipientPhone: apt.patientPhone,
      subject: patientTemplate.subject,
      html: patientTemplate.html,
      smsText: getPatientSMSText(eventType, apt),
      appointmentId: apt._id,
      eventType,
      forRole: 'patient',
    });

    // Doctor notification (only for events that are relevant to the doctor)
    const doctorTemplate = getDoctorEmailTemplate(eventType, apt);
    if (doctorTemplate && apt.doctorEmail) {
      await dispatchAndRecord({
        userId: apt.doctorId,
        recipientEmail: apt.doctorEmail,
        recipientPhone: apt.doctorPhone,
        subject: doctorTemplate.subject,
        html: doctorTemplate.html,
        smsText: getDoctorSMSText(eventType, apt),
        appointmentId: apt._id,
        eventType,
        forRole: 'doctor',
      });
    }

    res.json({ message: 'Notifications dispatched', eventType });
  } catch (error) {
    console.error('sendAppointmentNotification error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, userId } = req.body;
    const record = await Notification.create({
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
      record.status = 'sent';
    } catch (err) {
      record.status = 'failed';
      record.error = err.message;
    }
    await record.save();
    res.json({ message: 'Email sent', notification: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendCustomSMS = async (req, res) => {
  try {
    const { to, body, userId } = req.body;
    const record = await Notification.create({
      userId: userId || 'system',
      type: 'sms',
      category: 'general',
      message: body,
      recipient: to,
      status: 'pending',
    });
    try {
      await sendSMS({ to, body });
      record.status = 'sent';
    } catch (err) {
      record.status = 'failed';
      record.error = err.message;
    }
    await record.save();
    res.json({ message: 'SMS sent', notification: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendAppointmentNotification, sendCustomEmail, sendCustomSMS, getUserNotifications };
