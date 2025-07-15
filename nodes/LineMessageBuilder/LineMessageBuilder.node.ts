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
];

export class LineMessageBuilder implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Line Message',
    name: 'LineMessageBuilder',
    icon: 'file:line.svg',
    group: ['transform'],
    version: 1,
    description: 'Line Message Node',
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

      returnData.push({ json: { message } });
    }

    return this.prepareOutputData(returnData);
  }
}
