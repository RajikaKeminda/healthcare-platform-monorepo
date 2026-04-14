const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const Session = require('../models/Session');

const APP_ID = process.env.AGORA_APP_ID || 'test_app_id';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'test_certificate';

const generateAgoraToken = (channelName, uid, role) => {
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  if (!process.env.AGORA_APP_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE === 'test_certificate') {
    // Return a placeholder token for development
    return `dev_token_${channelName}_${uid}_${Date.now()}`;
  }

  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};

const getOrCreateSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let session = await Session.findOne({ appointmentId });

    if (!session) {
      const channelName = `healthcare_${appointmentId}`;
      const isDoctor = req.user.role === 'doctor';
      session = await Session.create({
        appointmentId,
        channelName,
        patientId: isDoctor ? (req.body.patientId || '') : req.user.id,
        doctorId: isDoctor ? req.user.id : (req.body.doctorId || ''),
        status: 'waiting',
      });
    }

    const uid = Math.floor(Math.random() * 100000);
    const token = generateAgoraToken(session.channelName, uid, RtcRole.PUBLISHER);

    // Update join time and fill in missing IDs
    if (req.user.role === 'doctor') {
      if (!session.doctorId) session.doctorId = req.user.id;
      if (!session.doctorJoinedAt) session.doctorJoinedAt = new Date();
      if (!session.startedAt) session.startedAt = new Date();
      session.status = 'active';
    } else {
      if (!session.patientId) session.patientId = req.user.id;
      if (!session.patientJoinedAt) session.patientJoinedAt = new Date();
    }
    await session.save();

    res.json({
      session,
      token,
      uid,
      appId: APP_ID,
      channelName: session.channelName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const session = await Session.findOne({ appointmentId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'ended';
    session.endedAt = new Date();
    if (session.startedAt) {
      session.durationMinutes = Math.round((session.endedAt - session.startedAt) / 60000);
    }
    await session.save();

    res.json({ message: 'Session ended', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateToken = async (req, res) => {
  try {
    const { channelName, uid } = req.body;
    if (!channelName) return res.status(400).json({ message: 'channelName is required' });

    const role = RtcRole.PUBLISHER;
    const token = generateAgoraToken(channelName, uid || 0, role);

    res.json({ token, appId: APP_ID, channelName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrCreateSession, endSession, getSession, generateToken };
