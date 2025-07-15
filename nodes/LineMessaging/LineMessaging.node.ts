import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionType,
	INodeProperties,
} from 'n8n-workflow';

import { messagingApi } from '@line/bot-sdk';
const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

export const messagingAPIOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Reply Message',
				value: 'replyMessage',
				action: 'Reply a message',
				description: 'reply a message',
			},
			{
				name: 'Push Message',
				value: 'pushMessage',
				action: 'Push a message',
				description: 'push a message',
			},
			{
				name: 'Multicast Message',
				value: 'multicast',
				action: 'Send a multicast message',
				description: 'Send a message to multiple users',
			},
			{
				name: 'Get User Profile',
				value: 'getProfile',
				action: 'Get user profile',
				description: 'Get profile information of a user',
			},
			{
				name: 'Get Group Chat Summary',
				value: 'getGroupChatSummary',
				action: 'Get group chat summary',
				description: 'Get group ID, name, and icon of a group chat',
			},
			{
				name: 'Get Group Chat Member User IDs',
				value: 'getGroupChatMemberUserIds',
				action: 'Get group chat member user ids',
				description: 'Get user IDs in a group chat',
			},
			{
				name: 'Get Group Chat Member Profile',
				value: 'getGroupChatMemberProfile',
				action: 'Get group chat member profile',
				description: 'Get profile of a group member',
			},
			{
				name: 'Get Message Content',
				value: 'getMessageContent',
				action: 'Get message content',
				description: 'Get content of a message (image, audio, etc)',
			},
			{
				name: 'Show Loading Animation',
				value: 'showLoadingAnimation',
				action: 'Trigger show loading animation',
				description: 'Trigger a loading animation call (custom endpoint)',
			},
		],
		default: 'replyMessage',
	},
	{
		displayName: 'Show Loading Animation',
		name: 'showLoading',
		type: 'boolean',
		default: true,
		description: 'Whether to show loading animation during execution',
		displayOptions: {
			show: {
				operation: [
					'showLoadingAnimation',
				],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'json',
		default: {
			type: 'text',
			text: 'Hello, world',
		},
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: ['replyMessage', 'pushMessage', 'multicast'],
			},
		},
	},
	{
		displayName: 'Reply Token',
		name: 'replyToken',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['replyMessage'],
			},
		},
	},
	{
		displayName: 'Target Recipient',
		name: 'targetRecipient',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['pushMessage'],
			},
		},
	},
	{
		displayName: 'Target Recipients',
		name: 'targetRecipients',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				operation: ['multicast'],
			},
		},
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['getProfile', 'getGroupChatMemberProfile', 'showLoadingAnimation'],
			},
		},
	},
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['getGroupChatSummary', 'getGroupChatMemberUserIds', 'getGroupChatMemberProfile'],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['getMessageContent'],
			},
		},
	},
	{
		displayName: 'Loading Seconds',
		name: 'loadingSeconds',
		type: 'number',
		default: 3,
		description: 'Number of seconds to show the loading animation',
		displayOptions: {
			show: {
				operation: ['showLoadingAnimation'],
			},
		},
	},
];

export class LineMessaging implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LINE Messaging API',
		name: 'lineMessaging',
		icon: 'file:msg.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with the LINE Messaging API',
		defaults: {
			name: 'LineMessaging',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'LineWebhookAuthApi',
				required: true,
			},
		],
		properties: [...messagingAPIOperations],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('LineWebhookAuthApi') as {
			channel_access_token: string;
		};

		if (!credentials?.channel_access_token) {
			throw new NodeApiError(this.getNode(), {}, { message: 'Missing channel access token' });
		}

		const client = new MessagingApiClient({
			channelAccessToken: credentials.channel_access_token,
		});
		const blobClient = new MessagingApiBlobClient({
			channelAccessToken: credentials.channel_access_token,
		});

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			

			if (operation === 'replyMessage') {
				const replyToken = this.getNodeParameter('replyToken', i) as string;
				const message = this.getNodeParameter('message', i);
				const messages = Array.isArray(message) ? message : [message];
				await client.replyMessage({
						replyToken,
						messages: messages,
				});
				returnData.push({
					json: {
						success: true,
						message: 'Message replied successfully',
					},
				});

			} else if (operation === 'pushMessage') {
				const message = this.getNodeParameter('message', i);
				const messages = Array.isArray(message) ? message : [message];
				const to = this.getNodeParameter('targetRecipient', i) as string | undefined; // Allow undefined
				if (!to) {
					throw new NodeApiError(this.getNode(), {}, { message: 'Missing target recipient for push message' });
				}
				await client.pushMessage({ to: to, messages });
				returnData.push({
					json: {
						success: true,
						message: 'Message pushed successfully',
					},
				});

			} else if (operation === 'multicast') {
				const to = this.getNodeParameter('targetRecipients', i) as string[];
				const message = this.getNodeParameter('message', i);
				const messages = Array.isArray(message) ? message : [message];
				await client.multicast({ to, messages });

			} else if (operation === 'getProfile') {
				const userId = this.getNodeParameter('userId', i) as string;
				const res = await client.getProfile(userId);
				returnData.push({ json: res });

			} else if (operation === 'getGroupChatSummary') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const res = await client.getGroupSummary(groupId);
				returnData.push({ json: res });

			} else if (operation === 'getGroupChatMemberUserIds') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const res = await client.getGroupMembersIds(groupId);
				returnData.push({ json: res });

			} else if (operation === 'getGroupChatMemberProfile') {
				const groupId = this.getNodeParameter('groupId', i) as string;
				const userId = this.getNodeParameter('userId', i) as string;
				const res = await client.getGroupMemberProfile(groupId, userId);
				returnData.push({ json: res });

			} else if (operation === 'getMessageContent') {
				const messageId = this.getNodeParameter('messageId', i) as string;
				const { httpResponse, body } = await blobClient.getMessageContentWithHttpInfo(messageId);
				const contentType = httpResponse.headers.get('content-type') as string;

				returnData.push({
					json: {},
					binary: {
						data: await this.helpers.prepareBinaryData(body, 'data', contentType),
					},
				});

			} else if (operation === 'showLoadingAnimation') {
				const userId = this.getNodeParameter('userId', i) as string;
				const loadingSeconds = this.getNodeParameter('loadingSeconds', i) as number;
				await client.showLoadingAnimation({ chatId: userId, loadingSeconds });
				returnData.push({ json: { success: true, message: 'Loading animation triggered' } });
			}
		}

		return this.prepareOutputData(returnData);
	}
}