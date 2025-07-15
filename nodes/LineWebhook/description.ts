import type { IWebhookDescription } from 'n8n-workflow';

import crypto from 'crypto';

// === Security helpers ===

function s2b(str: string, encoding: BufferEncoding): Buffer {
	return Buffer.from(str, encoding);
}

function safeCompare(a: Buffer, b: Buffer): boolean {
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}



export const defaultWebhookDescription: IWebhookDescription = {
	name: 'default',
	httpMethod: 'POST',
	isFullPath: true,
	responseCode: '200',
	responseMode: 'onReceived',
	responseData: 'allEntries',
	responseBinaryPropertyName: '={{$parameter["responseBinaryPropertyName"]}}',
	responseContentType: 'application/json',
	responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
	responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
	path: '={{$parameter["path"]}}',
};

export function signatureIsValid(
	body: string | Buffer,
	channelSecret: string,
	signature: string,
): boolean {
	return safeCompare(crypto.createHmac("SHA256", channelSecret).update(body).digest(), s2b(signature, "base64"));

}
