const { QueueClient } = require("@azure/storage-queue");
const { DefaultAzureCredential } = require('@azure/identity');
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

// Retrieve the connection string for use with the application. The storage
// connection string is stored in an environment variable on the machine
// running the application called AZURE_STORAGE_CONNECTION_STRING. If the
// environment variable is created after the application is launched in a
// console or with Visual Studio, the shell or application needs to be
// closed and reloaded to take the environment variable into account.
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

function jsonToBase64(jsonObj) {
  const jsonString = JSON.stringify(jsonObj)
  return Buffer.from(jsonString).toString('base64')
}
function encodeBase64ToJson(base64String) {
  const jsonString = Buffer.from(base64String, 'base64').toString()
  return JSON.parse(jsonString)
}

async function main() {
  console.log("Azure Queue Storage client library - JavaScript quickstart sample");

  // Quickstart code goes here

  // Create a unique name for the queue
  const queueName = "quickstart" + uuidv1();

  // Instantiate a QueueClient which will be used to create and interact with a queue
  const queueClient = new QueueClient(AZURE_STORAGE_CONNECTION_STRING, queueName);

  console.log("\nCreating queue...");
  console.log("\t", queueName);

  // Create the queue
  const createQueueResponse = await queueClient.create();
  console.log("Queue created, requestId:", createQueueResponse.requestId);

  console.log("\nAdding messages to the queue...");

  // Send several messages to the queue
  await queueClient.sendMessage("First message");
  await queueClient.sendMessage("Second message");
  const sendMessageResponse = await queueClient.sendMessage("Third message");

  console.log("Messages added, requestId:", sendMessageResponse.requestId);

  console.log("\nPeek at the messages in the queue...");

  // Peek at messages in the queue
  const peekedMessages = await queueClient.peekMessages({ numberOfMessages: 5 });

  for (i = 0; i < peekedMessages.peekedMessageItems.length; i++) {
    // Display the peeked message
    console.log("\t", peekedMessages.peekedMessageItems[i].messageText);
  }

  console.log("\nUpdating the third message in the queue...");

  // Update a message using the response saved when calling sendMessage earlier
  updateMessageResponse = await queueClient.updateMessage(
    sendMessageResponse.messageId,
    sendMessageResponse.popReceipt,
    "Third message has been updated"
  );

  console.log("Message updated, requestId:", updateMessageResponse.requestId);

  const properties = await queueClient.getProperties();
  console.log("Approximate queue length: ", properties.approximateMessagesCount);

  console.log("\nReceiving messages from the queue...");

  // Get messages from the queue
  const receivedMessagesResponse = await queueClient.receiveMessages({ numberOfMessages: 5 });

  console.log("Messages received, requestId:", receivedMessagesResponse.requestId);

  // 'Process' and delete messages from the queue
  for (i = 0; i < receivedMessagesResponse.receivedMessageItems.length; i++) {
    receivedMessage = receivedMessagesResponse.receivedMessageItems[i];

    // 'Process' the message
    console.log("\tProcessing:", receivedMessage.messageText);

    // Delete the message
    const deleteMessageResponse = await queueClient.deleteMessage(
      receivedMessage.messageId,
      receivedMessage.popReceipt
    );
    console.log("\tMessage deleted, requestId:", deleteMessageResponse.requestId);

    // Delete the queue
    console.log("\nDeleting queue...");
    const deleteQueueResponse = await queueClient.delete();
    console.log("Queue deleted, requestId:", deleteQueueResponse.requestId);
  }
}

main().then(() => console.log("\nDone")).catch((ex) => console.log(ex.message));