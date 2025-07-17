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
  middleware,
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
  follow = 'follow',
  unfollow = 'unfollow',
  videoPlayComplete = 'videoPlayComplete',
  beacon = 'beacon',
  accountLink = 'accountLink',
}

const eventTypes = Object.values(EventType);

function getSelectedEventTypes(raw: string[] | string): string[] {
  const rawList = Array.isArray(raw) ? raw : [raw];

  if (rawList.includes('*')) {
    return ['*'];
  }

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
    version: [1, 1.1, 2, 2.1],
		defaultVersion: 2,
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
        'Activate the workflow to run automatically when LINE events occur. Link: https://developers.line.biz/en/docs/messaging-api/receiving-messages/',
    },
    inputs: [NodeConnectionType.Main],
    outputs: eventTypes.map((eventType) => ({
      displayName: eventType,
      type: NodeConnectionType.Main,
    })),
    webhooks: [defaultWebhookDescription],
    mockManualExecution: true,
    credentials: [
      {
        name: 'LineMessagingAPIAuth',
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
        required: true,
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
      const creds = await this.getCredentials('LineMessagingAPIAuth') as {
        channel_secret: string;
        channel_access_token: string;
      };

      const middlewareConfig: MiddlewareConfig = {
        channelSecret: creds.channel_secret,
        channelAccessToken: creds.channel_access_token,
      };

      await new Promise<void>((resolve, reject) => {
        middleware(middlewareConfig)(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const events = req.body.events || [];
      console.log('Received events:', events);


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
          console.warn('Raw event:', JSON.stringify(event, null, 2));
          continue;
        }

        if (selectedEvents.includes('*') || selectedEvents.includes(actualType)) {
          const basePayload: any = {
            eventType: actualType,
            timestamp: event.timestamp,
            source: event.source,
            rawEvent: event,
          };

          switch (actualType) {
            case 'message':
              basePayload.replyToken = event.replyToken;
              basePayload.message = event.message;
              break;

            case 'postback':
              basePayload.replyToken = event.replyToken;
              basePayload.postback = event.postback;
              break;

            case 'follow':
            case 'join':
              basePayload.replyToken = event.replyToken;
              break;

            case 'unfollow':
            case 'leave':
              break;

            case 'beacon':
              basePayload.replyToken = event.replyToken;
              basePayload.beacon = event.beacon;
              break;

            case 'accountLink':
              basePayload.link = event.link;
              break;

            default:
              break;
          }

          outputData[outputIndex].push(basePayload);
        }
      }
      console.log('outputData:', outputData);
      return {
        workflowData: outputData.map((items) =>
          this.helpers.returnJsonArray(items),
        ),
      };
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }
}
