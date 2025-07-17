import {
	ICredentialType,
  Icon,
	INodeProperties,
	ThemeIconColor, 
} from 'n8n-workflow';

export class LineMessagingAPIAuth implements ICredentialType {
	name = 'LineMessagingAPIAuth';
	displayName = 'LINE Messaging API Auth';
	documentationUrl = 'https://developers.line.biz/en/docs/basics/channel-access-token/#revoke-channel-access-token';
	icon: Icon = 'file:msg.svg';
	iconColor: ThemeIconColor = 'green'; 

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
module.exports = { LineMessagingAPIAuth };
