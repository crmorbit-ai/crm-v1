const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const emailService = require('../utils/emailService');

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const handlers = {
  OTP_EMAIL:          ({ email, otp, userName }) => emailService.sendPasswordResetOTP(email, otp, userName),
  SIGNUP_OTP:         ({ email, otp, userName }) => emailService.sendSignupVerificationOTP(email, otp, userName),
  WELCOME_EMAIL:      ({ email, userName, organizationName }) => emailService.sendWelcomeEmail(email, userName, organizationName),
  USER_INVITE:        (payload) => emailService.sendUserInvitationEmail(payload),
  LEAD_ASSIGNMENT:    ({ assignedUserEmail, assignedUserName, leadDetails, assignedByName }) => emailService.sendLeadAssignmentEmail(assignedUserEmail, assignedUserName, leadDetails, assignedByName),
  MEETING_INVITE:     ({ meeting, attendeeEmails, organizerName, organizerEmail }) => emailService.sendMeetingInvitation(meeting, attendeeEmails, organizerName, organizerEmail),
  MEETING_REMINDER:   ({ meeting, attendeeEmails }) => emailService.sendMeetingReminder(meeting, attendeeEmails),
  MEETING_CANCEL:     ({ meeting, attendeeEmails, reason }) => emailService.sendMeetingCancellation(meeting, attendeeEmails, reason),
};

const processMessage = async (msg) => {
  const body = JSON.parse(msg.Body);
  const handler = handlers[body.type];
  if (!handler) { console.warn('⚠️ Unknown email type:', body.type); return; }
  await handler(body.payload);
  console.log('✅ Processed:', body.type);
};

const poll = async () => {
  if (!QUEUE_URL) { console.warn('SQS_QUEUE_URL not set — worker skipped'); return; }
  try {
    const result = await sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    }));
    for (const msg of result.Messages || []) {
      try {
        await processMessage(msg);
        await sqsClient.send(new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle: msg.ReceiptHandle }));
      } catch (err) {
        console.error('❌ Message processing failed:', err.message);
      }
    }
  } catch (err) {
    console.error('❌ SQS poll error:', err.message);
  }
  setTimeout(poll, 2000);
};

module.exports = { poll };
