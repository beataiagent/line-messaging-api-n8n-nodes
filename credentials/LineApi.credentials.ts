import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class LineApi implements ICredentialType {
	name = 'lineApi';
	displayName = 'LINE Messaging API';
	properties = [
		{
			displayName: 'Channel Access Token',
			name: 'channelAccessToken',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Channel Secret',
			name: 'channelSecret',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
	];
}