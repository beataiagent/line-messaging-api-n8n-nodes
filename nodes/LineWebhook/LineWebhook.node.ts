import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	ICredentialDataDecryptedObject,
	NodeApiError,
	INodeExecutionData,
	INodeOutputConfiguration,
	NodeConnectionType,
} from 'n8n-workflow';

import { defaultWebhookDescription } from './description';
import crypto from 'crypto';

// === Security helpers ===

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

// === Event type mapping ===

const eventTypes = [
	'text', 'audio', 'sticker', 'image', 'video', 'location',
	'postback', 'join', 'leave', 'memberJoined', 'memberLeft'
];

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
		outputs: eventTypes.map<INodeOutputConfiguration>((eventType) => ({
			displayName: eventType,
			type: NodeConnectionType.Main,
			name: eventType,
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
		const rawBody = req.rawBody;

		// Validate signature
		try {
			const creds = await this.getCredentials('lineWebhookAuthApi') as {
				channel_secret: string;
			};

			if (!creds?.channel_secret) {
				throw new Error('Missing LINE Channel Secret');
			}

			const signature = (headers as IDataObject)[headerName] as string;
			if (!signature || !validateSignature(rawBody, creds.channel_secret, signature)) {
				throw new Error('Invalid signature');
			}
		} catch (error: any) {
			const res = this.getResponseObject();
			res.writeHead(403, { 'Content-Type': 'text/plain' });
			res.end(error.message || 'Forbidden');
			return { noWebhookResponse: true };
		}

		// Prepare output buckets
		const outputData: IDataObject[][] = Array(eventTypes.length).fill(null).map(() => []);
		const bodyObj = this.getBodyData();
		const events = bodyObj.events as IDataObject[] || [];
		const destination = bodyObj.destination;

		for (const event of events) {
			let typeKey = event.type as string;
			if (typeKey === 'message') {
				typeKey = (event.message as IDataObject)?.type as string;
			}

			const idx = indexOfOutputs(typeKey);
			if (idx !== null) {
				outputData[idx].push({
					payload: {
						destination,
						...event,
					},
				});
			}
		}

		// Respond to LINE with 200 OK
		const res = this.getResponseObject();
		res.writeHead(200);
		res.end('OK');

		const result: INodeExecutionData[][] = outputData.map(items => this.helpers.returnJsonArray(items));
		return { workflowData: result };
	}
}
