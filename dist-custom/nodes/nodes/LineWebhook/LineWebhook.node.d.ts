import { IWebhookFunctions, IWebhookResponseData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class LineWebhook implements INodeType {
    description: INodeTypeDescription;
    webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>;
}
