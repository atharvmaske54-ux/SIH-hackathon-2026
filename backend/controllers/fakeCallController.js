const PRESET_CALLERS = [
  {
    id: 'preset-mom',
    name: 'Mom',
    phone: '+91 98200 12345',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    audioScript: 'Hey dear! Where are you right now? I am waiting outside, call me back immediately.',
    subtitle: 'Family Member'
  },
  {
    id: 'preset-security',
    name: 'Campus Security Control Desk',
    phone: '+91 98200 00911',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    audioScript: 'This is Campus Security Desk calling for verification. Please respond to confirm your safety status.',
    subtitle: 'Campus Authority'
  },
  {
    id: 'preset-warden',
    name: 'Hostel 3 Warden',
    phone: '+91 98200 88776',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    audioScript: 'Hello! I need to check your attendance for tonight. Are you near the hostel entrance?',
    subtitle: 'Hostel Administrator'
  },
  {
    id: 'preset-boss',
    name: 'Department Head / Prof. Sharma',
    phone: '+91 98200 33445',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    audioScript: 'Good evening! Please join the urgent department sync call right now.',
    subtitle: 'Academic Dept'
  }
];

const getPresets = (req, res) => {
  res.json({
    success: true,
    count: PRESET_CALLERS.length,
    presets: PRESET_CALLERS
  });
};

const triggerFakeCall = (req, res) => {
  const { callerPresetId, customCallerName, customCallerPhone, delaySeconds, customVoiceScript } = req.body;

  let caller = PRESET_CALLERS.find(p => p.id === callerPresetId);

  if (!caller && customCallerName) {
    caller = {
      id: `custom-${Date.now()}`,
      name: customCallerName,
      phone: customCallerPhone || '+91 98765 00000',
      audioScript: customVoiceScript || 'Urgent call! Please answer.',
      subtitle: 'Custom Caller'
    };
  }

  if (!caller) {
    caller = PRESET_CALLERS[0];
  }

  const scheduledTime = new Date(Date.now() + (delaySeconds || 0) * 1000).toISOString();

  res.json({
    success: true,
    message: `Fake call configured for ${caller.name}`,
    fakeCallSession: {
      sessionId: `FCALL-${Date.now()}`,
      caller,
      delaySeconds: delaySeconds || 0,
      scheduledTime,
      ringtoneUrl: '/audio/ringtones/standard_ios_ringtone.mp3',
      action: 'INITIATE_SIMULATED_CALL_UI'
    }
  });
};

module.exports = {
  getPresets,
  triggerFakeCall
};
