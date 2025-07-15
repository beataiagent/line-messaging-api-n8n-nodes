import type { IWebhookDescription } from 'n8n-workflow';
export declare const defaultWebhookDescription: IWebhookDescription;
export declare function signatureIsValid(body: string | Buffer, channelSecret: string, signature: string): boolean;
