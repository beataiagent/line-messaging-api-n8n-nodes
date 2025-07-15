import { Client, MiddlewareConfig } from "@line/bot-sdk";
export declare const clientFromCredentials: (credentials: {
    channelAccessToken: string;
    channelSecret: string;
}) => Client;
export declare const middlewareFromCredentials: (credentials: {
    channelAccessToken: string;
    channelSecret: string;
}) => MiddlewareConfig;
