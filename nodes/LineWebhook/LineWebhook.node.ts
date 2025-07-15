import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	ICredentialDataDecryptedObject,
	NodeApiError,
	INodeExecutionData,
} from 'n8n-workflow';

import {
	defaultWebhookDescription,
} from './description';

import crypto from 'crypto';

// Convert string to buffer
function s2b(str: string, encoding: BufferEncoding): Buffer {
	return Buffer.from(str, encoding);
}

// Timing-safe signature comparison
function safeCompare(a: Buffer, b: Buffer): boolean {
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}

// Validate LINE Signature
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

// Define outputs for each event/message type
function outputs(): string[] {
	const types = ['text', 'audio', 'sticker', 'image', 'video', 'location', 'postback', 'join', 'leave', 'memberJoined', 'memberLeft'];
	return types.map(() => 'main');
}

function outputLabels(): { [key: string]: string } {
	return {
		'main': 'LINE Event Output'
	};
}

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
		outputs: eventTypes.length,
		outputNames: {
			0: 'text',
			1: 'audio',
			2: 'sticker',
			3: 'image',
			4: 'video',
			5: 'location',
			6: 'postback',
			7: 'join',
			8: 'leave',
			9: 'memberJoined',
			10: 'memberLeft',
		},
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

		// Signature Validation
		try {
			const creds = await this.getCredentials('lineWebhookAuthApi') as { channel_secret: string };
			if (!creds?.channel_secret) throw new Error('Missing LINE Channel Secret');

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

		// Prepare output buckets
		const outputData: IDataObject[][] = Array(outputs().length).fill(0).map(() => []);

		const bodyObj = this.getBodyData();
		const events = bodyObj.events as IDataObject[];
		const destination = bodyObj.destination;
		
		for (const event of events) {
			const eventType = event.type as string;
			let typeKey = eventType;

			if (eventType === 'message') {
				typeKey = (event.message as IDataObject)?.type as string;
			}

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

		// Send 200 OK
		const res = this.getResponseObject()
		res.writeHead(200);
		res.end('OK');

		const result: INodeExecutionData[][] = outputData.map(items => this.helpers.returnJsonArray(items));
		return { workflowData: result };
	}
}
