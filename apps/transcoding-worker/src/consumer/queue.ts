import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from "@aws-sdk/client-sqs";

async function startConsumer() {
  const client = new SQSClient({
    region: process.env.SQS_REGION,
    credentials: {
      accessKeyId: process.env.SQS_ACCESS_KEY!,
      secretAccessKey: process.env.SQS_SECRET_KEY!,
    },
  });

  const queueUrl = process.env.SQS_QUEUE_URL;

  try {
    if (!queueUrl) {
      throw new Error("SQS_QUEUE_URL is not defined");
    }

    while (true) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20, // long polling
          VisibilityTimeout: 100, // 100 seconds
        });

        const response = await client.send(command);

        if (response.Messages) {
          for (const message of response.Messages) {
            console.log("Received:", message.Body);

            try {
              // 👉 Your processing logic here
              await processMessage(message);

              // Delete after successful processing
              await client.send(
                new DeleteMessageCommand({
                  QueueUrl: queueUrl,
                  ReceiptHandle: message.ReceiptHandle,
                }),
              );

              console.log("Deleted message");
            } catch (err) {
              console.error("Processing failed:", err);
              // Message will become visible again after visibility timeout
            }
          }
        }
      } catch (err) {
        console.error("Error polling queue:", err);
      }
    }
    process.exit(0);
  } catch (error) {
    console.log("Error:", error);
    process.exit(1);
  }
}

async function processMessage(message: Message) {
  if (!message.Body) {
    return;
  }

  const body = JSON.parse(message.Body);
  console.log("Processing:", body);

  // simulate async work
  await new Promise((res) => setTimeout(res, 1000));
}

startConsumer();
