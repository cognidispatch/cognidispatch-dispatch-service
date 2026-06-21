// dispatch-service/serviceBusPublisher.js
// Publishes a message to the Azure Service Bus dispatch.created topic
// whenever a new dispatch is created via start-tracking socket event.

const { ServiceBusClient } = require('@azure/service-bus');

let senderInstance = null;
let clientInstance = null;

async function getOrCreateSender() {
  if (senderInstance) return senderInstance;

  const connectionString = process.env.SERVICEBUS_CONNECTION;
  const topicName = process.env.SERVICEBUS_TOPIC || 'dispatch-created';

  if (!connectionString) {
    console.warn('[ServiceBus] SERVICEBUS_CONNECTION not set — notifications disabled.');
    return null;
  }

  clientInstance = new ServiceBusClient(connectionString);
  senderInstance = clientInstance.createSender(topicName);
  console.log(`[ServiceBus] ✅ Publisher connected. Topic: ${topicName}`);
  return senderInstance;
}

/**
 * Publish a dispatch.created event to Azure Service Bus.
 * This is fire-and-forget — dispatch creation is never blocked by this call.
 * If Service Bus is unavailable, the error is logged but the dispatch still succeeds.
 */
async function publishDispatchCreated(dispatch, vendorEmail) {
  try {
    const sender = await getOrCreateSender();
    if (!sender) return;

    const message = {
      body: {
        dispatchId:      dispatch.id,
        vendorId:        dispatch.vendorId,
        vendorName:      dispatch.vendorName,
        vendorEmail:     vendorEmail,           // fetched from DB by dispatch-service
        userName:        dispatch.userName,
        category:        dispatch.category,
        urgency:         dispatch.urgency,
        summary:         dispatch.summary,
        targetLat:       dispatch.targetLat,
        targetLng:       dispatch.targetLng,
        amount:          dispatch.amount,
        timestamp:       new Date().toISOString()
      },
      contentType:    'application/json',
      subject:        'dispatch.created',
      messageId:      dispatch.id,
      timeToLive:     86400000  // 24 hours TTL in milliseconds
    };

    await sender.sendMessages(message);
    console.log(`[ServiceBus] ✅ dispatch.created published for dispatch: ${dispatch.id} → vendor: ${vendorEmail}`);
  } catch (err) {
    // Log but never block the dispatch creation flow
    console.error('[ServiceBus] ⚠️ Failed to publish dispatch.created:', err.message);
  }
}

module.exports = { publishDispatchCreated };
