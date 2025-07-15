// File: nodes/LineWebhook.node.ts

import {
  IDataObject,
  IWebhookFunctions,
  IWebhookResponseData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  INodeExecutionData,
} from 'n8n-workflow';

import {
  MiddlewareConfig,
  middleware,
  webhook,
  HTTPFetchError,
} from '@line/bot-sdk';

import { defaultWebhookDescription } from './description';

const eventTypes = [
  'text', 'audio', 'sticker', 'image', 'video', 'location',
  'postback', 'join', 'leave', 'memberJoined', 'memberLeft',
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
    icon: 'file:msg.svg',
    iconColor: 'green',
    group: ['trigger'],
    version: 1,
    description: 'Handle incoming events from LINE Messaging API',
    defaults: {
      name: 'LineWebhook',
    },
    inputs: [],
    outputs: eventTypes.map((eventType) => ({
      displayName: eventType,
      type: NodeConnectionType.Main,
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
    const req = this.getRequestObject();
    const res = this.getResponseObject();
    const outputData: IDataObject[][] = Array(outputs().length).fill(0).map(() => []);

    try {
      const creds = await this.getCredentials('lineWebhookAuthApi') as {
        channel_secret: string;
      };

      if (!creds?.channel_secret) {
        throw new Error('Missing LINE channel secret');
      }

      const middlewareConfig: MiddlewareConfig = {
        channelSecret: creds.channel_secret,
      };

      // Validate LINE signature
      await new Promise<void>((resolve, reject) => {
        middleware(middlewareConfig)(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const callbackRequest: webhook.CallbackRequest = req.body;
      const events: webhook.Event[] = callbackRequest.events || [];

      for (const event of events) {
        try {
          const idx = indexOfOutputs(event.type);
          if (idx !== null) {
            outputData[idx].push({
              eventType: event.type,
              ...event,
            });
          }
        } catch (err: unknown) {
          if (err instanceof HTTPFetchError) {
            console.error('LINE API Error:', err.status);
            console.error(err.headers?.get('x-line-request-id'));
            console.error(err.body);
          } else if (err instanceof Error) {
            console.error('Error processing event:', err.message);
          }
        }
      }

      res.writeHead(200).end();

      const result: INodeExecutionData[][] = outputData.map((items) =>
        this.helpers.returnJsonArray(items)
      );

      return { workflowData: result };
    } catch (error: any) {
      console.error('Webhook setup or processing error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Webhook Error: ' + (error.message || 'Unknown error'));
      return { noWebhookResponse: true };
    }
  }
}
