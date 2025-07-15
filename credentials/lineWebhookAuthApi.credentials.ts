import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class lineWebhookAuthApi implements ICredentialType {
  name = 'lineWebhookAuthApi';
  displayName = 'LINE Webhook Auth API';
  documentationUrl = '';
  properties: INodeProperties[] = [
    {
      displayName: 'Channel Secret',
      name: 'channel_secret',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Channel Access Token',
      name: 'channel_access_token',
      type: 'string',
      default: '',
    },
  ];
}
module.exports = { lineWebhookAuthApi };
