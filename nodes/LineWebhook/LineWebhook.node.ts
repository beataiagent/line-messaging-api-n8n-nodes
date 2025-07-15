// File: nodes/LineWebhook.node.ts
import {
  IDataObject,
  IWebhookFunctions,
  IWebhookResponseData,
  INodeType,
  INodeTypeDescription,
  ICredentialDataDecryptedObject,
  NodeApiError,
  NodeConnectionType,
  INodeExecutionData,
} from 'n8n-workflow';

import { defaultWebhookDescription } from './description';
import crypto from 'crypto';

import {
  ClientConfig,
  messagingApi,
  webhook,
  HTTPFetchError,
} from '@line/bot-sdk';

function s2b(str: string, encoding: BufferEncoding): Buffer {
  return Buffer.from(str, encoding);
}

function safeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function validateSignature(
  body: string | Buffer,
  channelSecret: string,
  signature: string,
): boolean {
  return safeCompare(
    crypto.createHmac("SHA256", channelSecret).update(body.toString('utf8')).digest(),
    s2b(signature, "base64"),
  );
}

const eventTypes = [
  'text', 'audio', 'sticker', 'image', 'video', 'location',
  'postback', 'join', 'leave', 'memberJoined', 'memberLeft'
];

function outputs(): string[] {
  return eventTypes.map(() => 'main');
}

function indexOfOutputs(type: string): number | null {
  const index = eventTypes.indexOf(type);
  return index >= 0 ? index : null;
}

export class LineWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Line Webhook',
    name: 'LineWebhook',
    icon: 'file:line.svg',
    group: ['trigger'],
    version: 1,
    description: 'Handle incoming events from LINE Messaging API',
    defaults: {
      name: 'LineWebhook',
    },
    inputs: [],
    outputs: eventTypes.map(eventType => ({
      displayName: eventType,
      type: NodeConnectionType.Main
    })),
    webhooks: [defaultWebhookDescription],
    credentials: [
      {
        name: 'lineWebhookAuthApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'line-webhook',
        required: true,
        description: 'Path for the webhook (e.g. "line-webhook")',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const headerName = 'x-line-signature';
    const headers = this.getHeaderData();
    const req = this.getRequestObject();
    const body = req.rawBody;

    let creds: {
      channel_secret: string;
      channel_access_token: string;
    };

    try {
      creds = await this.getCredentials('lineWebhookAuthApi') as {
        channel_secret: string;
        channel_access_token: string;
      };
      if (!creds?.channel_secret || !creds?.channel_access_token) {
        throw new Error('Missing LINE credentials');
      }

      const signature = (headers as IDataObject)[headerName] as string;
      if (!signature || !validateSignature(body, creds.channel_secret, signature)) {
        throw new Error('Invalid Signature');
      }
    } catch (error: any) {
      const res = this.getResponseObject();
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end(error.message || 'Forbidden');
      return { noWebhookResponse: true };
    }

    const outputData: IDataObject[][] = Array(outputs().length).fill(0).map(() => []);
    const bodyObj = this.getBodyData();
    const events = bodyObj.events as webhook.Event[];
    const destination = bodyObj.destination;

    const client = new messagingApi.MessagingApiClient({
      channelAccessToken: creds.channel_access_token,
    });

    for (const event of events) {
      const eventType = event.type;
      let typeKey = eventType;

      const idx = indexOfOutputs(typeKey);
      if (idx !== null) {
        const outputItem: IDataObject = {
          payload: {
            destination,
            ...event,
          },
        };
        outputData[idx].push(outputItem);
      }
    }

    const res = this.getResponseObject();
    res.writeHead(200);
    res.end('OK');

    const result: INodeExecutionData[][] = outputData.map(items => this.helpers.returnJsonArray(items));
    return { workflowData: result };
  }
}
