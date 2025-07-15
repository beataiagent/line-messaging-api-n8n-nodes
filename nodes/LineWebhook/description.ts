import type { IWebhookDescription } from 'n8n-workflow';

export const defaultWebhookDescription: IWebhookDescription = {
	name: 'default',
	httpMethod: 'POST',
	isFullPath: true,
	responseMode: 'onReceived',
	responseData: 'allEntries',
	responseBinaryPropertyName: '={{$parameter["responseBinaryPropertyName"]}}',
	responseContentType: 'application/json',
	responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
	responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
	path: '={{$parameter["path"]}}',
	ndvHideUrl: false,
    ndvHideMethod: false,
};
