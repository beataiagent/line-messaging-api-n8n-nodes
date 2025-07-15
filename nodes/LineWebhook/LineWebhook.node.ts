import {
  IDataObject,
  IWebhookFunctions,
  IWebhookResponseData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from 'n8n-workflow';

import {
  MiddlewareConfig,
  middleware
} from '@line/bot-sdk';

import { defaultWebhookDescription } from './description';

enum EventType {
  text = 'text',
  audio = 'audio',
  sticker = 'sticker',
  image = 'image',
  video = 'video',
  location = 'location',
  postback = 'postback',
  join = 'join',
  leave = 'leave',
  memberJoined = 'memberJoined',
  memberLeft = 'memberLeft',
}

const eventTypes = Object.values(EventType);

function getSelectedEventTypes(raw: string[] | string): string[] {
  return Array.isArray(raw)
    ? raw.filter((e: string) => {
        const valid = (eventTypes as string[]).includes(e);
        if (!valid) console.warn(`[LineWebhook] Ignoring invalid event type: ${e}`);
        return valid;
      })
    : [raw];
}

export class LineWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Line Webhook',
    name: 'LineWebhook',
    icon: 'file:msg.svg',
    group: ['trigger'],
    version: 1,
    description: 'Handle incoming events from LINE Messaging API',
    defaults: {
      name: 'LineWebhook',
    },
    triggerPanel: {
      header: 'Listen LINE Messaging API events',
      executionsHelp: {
        inactive:
          'Click "listen" to test the webhook. Activate to run in production.',
        active:
          'This webhook is active and will respond to LINE Messaging API events.',
      },
      activationHint:
        'Activate the workflow to run automatically when LINE events occur.',
    },
    inputs: [NodeConnectionType.Main],
    outputs: eventTypes.map((eventType) => ({
      displayName: eventType,
      type: NodeConnectionType.Main,
    })),
    webhooks: [defaultWebhookDescription],
    credentials: [
      {
        name: 'LineWebhookAuthApi',
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
      {
        displayName: 'Trigger On',
        name: 'events',
        type: 'multiOptions',
        default: ['*'],
        options: [
          {
            name: 'All',
            value: '*',
            description: 'Trigger on all events',
          },
          ...eventTypes.map((event) => ({
            name: event.charAt(0).toUpperCase() + event.slice(1),
            value: event,
            description: `Trigger on ${event} events`,
          })),
        ],
        description: 'Select LINE event types to trigger this workflow',
      },
    ],
  };
  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const res = this.getResponseObject();

    const rawEvents = this.getNodeParameter('events', 0) as string[] | string;
    const selectedEvents = getSelectedEventTypes(rawEvents);

    const outputData: IDataObject[][] = eventTypes.map(() => []);

    try {
      const creds = await this.getCredentials('LineWebhookAuthApi') as {
        channel_secret: string;
        channel_access_token: string;
      };

      const middlewareConfig: MiddlewareConfig = {
        channelSecret: creds.channel_secret,
        channelAccessToken: creds.channel_access_token,
      };

      // LINE signature validation
      await new Promise<void>((resolve, reject) => {
        middleware(middlewareConfig)(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const events = req.body.events || [];

      for (const event of events) {
        let actualType: string;

        if (event.type === 'message') {
          actualType = event.message?.type ?? '';
        } else {
          actualType = event.type;
        }

        const outputIndex = eventTypes.findIndex((t) => t === actualType);

        if (outputIndex === -1) {
          console.warn(`[LineWebhook] Unmapped event type: ${actualType}`);
          continue;
        }

        if (selectedEvents.includes('*') || selectedEvents.includes(actualType)) {
          outputData[outputIndex].push({
            eventType: actualType,
            replyToken: event.replyToken,
            timestamp: event.timestamp,
            source: event.source,
            message: event.message ?? undefined,
            postback: event.postback ?? undefined,
            rawEvent: event,
          });
        }
      }

      return {
        workflowData: outputData.map((items) => this.helpers.returnJsonArray(items)),
      };
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }
}
