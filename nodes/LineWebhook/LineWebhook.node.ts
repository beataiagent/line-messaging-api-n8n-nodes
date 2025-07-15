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
    icon: 'file:messaging.svg',
    iconColor: 'green',
    group: ['trigger'],
    version: 1,
    description: 'Handle incoming events from LINE Messaging API',
    defaults: {
      name: 'LineWebhook',
    },
    inputs: [],
    triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					'Webhooks have two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. <a data-key="activate">Activate</a> the workflow, then make requests to the production URL. These executions will show up in the executions list, but not in the editor.',
				active:
					'Webhooks have two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. Since the workflow is activated, you can make requests to the production URL. These executions will show up in the <a data-key="executions">executions list</a>, but not in the editor.',
			},
			activationHint:
				"Once you've finished building your workflow, run it without having to click this button by using the production webhook URL.",
		},
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
        channel_access_token: string;
      };

      if (!creds?.channel_secret) {
        throw new Error('Missing LINE channel secret');
      }

      const middlewareConfig: MiddlewareConfig = {
        channelSecret: creds.channel_secret,
        channelAccessToken: creds.channel_access_token,
      };

      // Validate LINE signature
      await new Promise<void>((resolve, reject) => {
        middleware(middlewareConfig)(req, res, (err: any) => {
        console.log('Received Header:', req.headers);
        console.log('Received Body:', req.body);
          if (err) reject(err);
          else resolve();
        });
      });


      const events = req.body.events || [];
      console.log('Received events:', events);

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

      const result: INodeExecutionData[][] = outputData.map((items) =>
        this.helpers.returnJsonArray(items)
      );

      return { workflowData: result };
    } catch (error: any) {
      console.error('Webhook setup or processing error:', error);
      throw error;
    }
  }
}
