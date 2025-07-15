// n8n Custom Node for MCP Client with LINE Bot MCP Server support via npx

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from 'n8n-workflow';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

export class LineBotMCPClient implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MCP LINE Bot Client',
    name: 'LineBotMCPClient',
    icon: 'file:msg.svg',
    group: ['transform'],
    version: 1,
    description: 'Connect to line-bot-mcp-server using STDIO via npx',
    defaults: {
      name: 'MCP LINE Bot Client',
    },
    inputs: [{ type: NodeConnectionType.Main }],
    outputs: [{ type: NodeConnectionType.Main }],
    usableAsTool: true,
    credentials: [
      {
        name: 'lineWebhookAuthApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Tool Name',
        name: 'toolName',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Tool Parameters (JSON)',
        name: 'toolParameters',
        type: 'json',
        default: '{}',
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];
    const toolName = this.getNodeParameter('toolName', 0) as string;
    const rawParams = this.getNodeParameter('toolParameters', 0);
    let toolParams: Record<string, any> = {};

    try {
      const rawParams = this.getNodeParameter('toolParameters', 0) ?? {};
      const toolParams = typeof rawParams === 'string'
        ? JSON.parse(rawParams)
        : typeof rawParams === 'object'
          ? rawParams
          : {};
    } catch (err) {
      throw new NodeOperationError(this.getNode(), 'Invalid JSON for tool parameters');
    }

    const credentials = await this.getCredentials('lineWebhookAuthApi');
    const channelAccessToken = credentials.channelAccessToken as string;
    const destinationUserId = credentials.destinationUserId as string;

    const env: Record<string, string> = {
      PATH: process.env.PATH || '',
      CHANNEL_ACCESS_TOKEN: channelAccessToken,
      DESTINATION_USER_ID: destinationUserId,
    };

    const transport: Transport = new StdioClientTransport({
      command: 'npx',
      args: ['@line/line-bot-mcp-server'],
      env,
    });

    const client = new Client(
      { name: 'line-bot-client', version: '1.0.0' },
      { capabilities: { prompts: {}, resources: {}, tools: {} } }
    );

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: toolName,
        arguments: toolParams,
      }, CallToolResultSchema);

      returnData.push({ json: { result } });
    } catch (err) {
      throw new NodeOperationError(this.getNode(), `MCP Error: ${(err as Error).message}`);
    } finally {
      await transport.close();
    }

    return [returnData];
  }
}
