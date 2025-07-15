import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  INodeProperties,
  NodeConnectionType,
  IDataObject,
} from 'n8n-workflow';

export const messageTypes: INodeProperties[] = [
  {
    displayName: 'Message Type',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      { name: 'Text Message', value: 'text', action: 'Create a text message' },
      { name: 'Text Message (v2)', value: 'textV2', action: 'Create a text message with substitution' },
      { name: 'Image Message', value: 'image', action: 'Create an image message' },
      { name: 'Video Message', value: 'video', action: 'Create a video message' },
      { name: 'Audio Message', value: 'audio', action: 'Create an audio message' },
      { name: 'Location', value: 'location', action: 'Create a location message' },
      { name: 'Sticker', value: 'sticker', action: 'Create a sticker message' },
      { name: 'Flex', value: 'flex', action: 'Create a flex message' },
    ],
    default: 'text',
  },
  {
    displayName: 'Text',
    name: 'text',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['text', 'textV2'],
      },
    },
  },
  {
    displayName: 'Substitution',
    name: 'substitution',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    default: {},
    displayOptions: {
      show: {
        operation: ['textV2'],
      },
    },
    options: [
      {
        displayName: 'Substitution Item',
        name: 'items',
        values: [
          {
            displayName: 'Key',
            name: 'key',
            type: 'string',
            default: '',
            description: 'The {key} to be used in text',
          },
          {
            displayName: 'Type',
            name: 'type',
            type: 'options',
            options: [
              { name: 'Mention User', value: 'mentionUser' },
              { name: 'Mention All', value: 'mentionAll' },
              { name: 'Emoji', value: 'emoji' },
            ],
            default: 'mentionUser',
          },
          {
            displayName: 'User ID',
            name: 'userId',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                type: ['mentionUser'],
              },
            },
          },
          {
            displayName: 'Product ID',
            name: 'productId',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                type: ['emoji'],
              },
            },
          },
          {
            displayName: 'Emoji ID',
            name: 'emojiId',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                type: ['emoji'],
              },
            },
          },
        ],
      },
    ],
  },
	{
		displayName: 'Original Content URL',
		name: 'originalContentUrl',
		type: 'string',
		default: '',
		description: 'URL of the content (Max: 1000 characters, HTTPS). For audio, only M4A is supported.',
		displayOptions: {
			show: {
				operation: ['image', 'video', 'audio'],
			},
		},
	},
	{
		displayName: 'Preview Image URL',
		name: 'previewImageUrl',
		type: 'string',
		default: '',
		description: 'URL of the preview image (Max: 1000 characters, HTTPS)',
		displayOptions: {
			show: {
				operation: ['image', 'video'],
			},
		},
	},
	{
		displayName: 'Duration',
		name: 'duration',
		type: 'number',
		default: 60000,
		description: 'Length of audio file in milliseconds.',
		displayOptions: {
			show: {
				operation: ['audio'],
			},
		},
	},
	{
		displayName: 'Tracking ID',
		name: 'trackingId',
		type: 'string',
		default: '',
		description: 'ID for video play completion statistics. Can be specified when video viewing is complete.',
		displayOptions: {
			show: {
				operation: ['video'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		description: 'The title for the location message (Max: 100 characters)',
		displayOptions: {
			show: {
				operation: ['location'],
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		description: 'The address for the location message (Max: 100 characters)',
		displayOptions: {
			show: {
				operation: ['location'],
			},
		},
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		default: 0,
		typeOptions: {
			numberPrecision: 8,
		},
		description: 'The latitude of the location',
		displayOptions: {
			show: {
				operation: ['location'],
			},
		},
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		default: 0,
		typeOptions: {
			numberPrecision: 8,
		},
		description: 'The longitude of the location',
		displayOptions: {
			show: {
				operation: ['location'],
			},
		},
	},
	{
		displayName: 'Sticker Info',
		name: 'stickerNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['sticker'],
			},
		},
		description:
			'For a list of available stickers, see the <a href="https://developers.line.biz/en/docs/messaging-api/sticker-list/#sticker-definitions">sticker list documentation</a>.',
	},
	{
		displayName: 'Package ID',
		name: 'packageId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['sticker'],
			},
		},
	},
	{
		displayName: 'Sticker ID',
		name: 'stickerId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['sticker'],
			},
		},
	},
	{
		displayName: 'Alt Text',
		name: 'altText',
		type: 'string',
		default: '',
		description: 'Alternative text for the Flex Message (Max: 400 characters)',
		displayOptions: {
			show: {
				operation: ['flex'],
			},
		},
	},
	{
		displayName: 'Contents (JSON)',
		name: 'contents',
		type: 'json',
		default: '{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": [\n      {\n        "type": "text",\n        "text": "hello, world"\n      }\n    ]\n  }\n}',
		description: 'The Flex Message container object. See the <a href="https://developers.line.biz/en/docs/messaging-api/flex-message-elements/">Flex Message documentation</a> for the object structure.',
		displayOptions: {
			show: {
				operation: ['flex'],
			},
		},
	},
];

export class LineMessageBuilder implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Line Message Builder',
    name: 'LineMessageBuilder',
    icon: 'file:msg.svg',
    group: ['transform'],
    version: 1,
    description: 'Builds a message object for the LINE Messaging API.',
    defaults: {
      name: 'LineMessageBuilder',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [...messageTypes],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const messageType = this.getNodeParameter('operation', i) as string;
      let message: any = {};

      if (messageType === 'text') {
        const text = this.getNodeParameter('text', i) as string;
        message = { type: 'text', text };

      } else if (messageType === 'textV2') {
        const text = this.getNodeParameter('text', i) as string;
        const substitutionItems = this.getNodeParameter('substitution.items', i, []) as IDataObject[];

        const substitution: Record<string, any> = {};
        for (const item of substitutionItems) {
          const key = item.key as string;
          const type = item.type as string;

          if (!key) continue;

          if (type === 'mentionUser') {
            substitution[key] = {
              type: 'mention',
              mentionee: {
                type: 'user',
                userId: item.userId as string,
              },
            };
          } else if (type === 'mentionAll') {
            substitution[key] = {
              type: 'mention',
              mentionee: {
                type: 'all',
              },
            };
          } else if (type === 'emoji') {
            substitution[key] = {
              type: 'emoji',
              productId: item.productId as string,
              emojiId: item.emojiId as string,
            };
          }
        }

        message = {
          type: 'text',
          text,
          ...(Object.keys(substitution).length > 0 ? { substitution } : {}),
        };
      }
 else if (messageType === 'image') {
        const originalContentUrl = this.getNodeParameter('originalContentUrl', i) as string;
        const previewImageUrl = this.getNodeParameter('previewImageUrl', i) as string;
        message = {
          type: 'image',
          originalContentUrl,
          previewImageUrl,
        };
      } else if (messageType === 'video') {
        const originalContentUrl = this.getNodeParameter('originalContentUrl', i) as string;
        const previewImageUrl = this.getNodeParameter('previewImageUrl', i) as string;
        const trackingId = this.getNodeParameter('trackingId', i, '') as string;
        message = {
          type: 'video',
          originalContentUrl,
          previewImageUrl,
        };
        if (trackingId) {
          message.trackingId = trackingId;
        }
      } else if (messageType === 'audio') {
        const originalContentUrl = this.getNodeParameter('originalContentUrl', i) as string;
        const duration = this.getNodeParameter('duration', i) as number;
        message = {
          type: 'audio',
          originalContentUrl,
          duration,
        };
      } else if (messageType === 'location') {
        const title = this.getNodeParameter('title', i) as string;
        const address = this.getNodeParameter('address', i) as string;
        const latitude = this.getNodeParameter('latitude', i) as number;
        const longitude = this.getNodeParameter('longitude', i) as number;
        message = {
          type: 'location',
          title,
          address,
          latitude,
          longitude,
        };
      } else if (messageType === 'sticker') {
        const packageId = this.getNodeParameter('packageId', i) as string;
        const stickerId = this.getNodeParameter('stickerId', i) as string;
        message = {
          type: 'sticker',
          packageId,
          stickerId,
        };
      } else if (messageType === 'flex') {
        const altText = this.getNodeParameter('altText', i) as string;
        const contentsRaw = this.getNodeParameter('contents', i, '{}') as string;
        let contents: IDataObject;

        try {
          contents = JSON.parse(contentsRaw);
        } catch (error) {
          throw new Error(
            `Flex message contents for item ${i} is not a valid JSON. Please check your input.`,
          );
        }

        message = {
          type: 'flex',
          altText,
          contents,
        };
      }

      returnData.push({ json: { message } });
    }

    return this.prepareOutputData(returnData);
  }
}
