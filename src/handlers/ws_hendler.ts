/* eslint-disable no-unused-vars */
import { connection as WSConnection } from 'websocket';

import { Session } from '../effects/session';
import { Settings } from '../effects/settings';

export interface WsConnectionsPool {
	[key: string]: WSConnection;
}

// eslint-disable-next-line no-shadow
export enum WsMessageType {
	SESSION = 'SESSION',
	SETTINGS = 'SETTINGS',
	SAVE_SETTINGS = 'SAVE_SETTINGS',
	MANUAL_TEN = 'MANUAL_TEN',
	MANUAL_PUMP = 'MANUAL_PUMP',
	TEN_ON = 'TEN_ON',
	TEN_OFF = 'TEN_OFF',
	PUMP_ON = 'PUMP_ON',
	PUMP_OFF = 'PUMP_OFF',
	DONE_WATER = 'DONE_WATER',
	DONE_MALT = 'DONE_MALT',
	DONE_FILTER = 'DONE_FILTER',
	DONE_HOP = 'DONE_HOP',
	CANCEL = 'CANCEL',
	SKIP = 'SKIP',
	DONE = 'DONE',
	REFRESH_SETTINGS = 'REFRESH_SETTINGS',
}

export class WsMessage {
	command: WsMessageType;
	data: any;

	constructor(cmd: WsMessageType, data: any) {
		this.command = cmd;
		this.data = data;
	}
}

export const connectionsPool: WsConnectionsPool = {};

/**
 * Отправить сообщение всем клиентам
 * @param message
 */
export const sendWsMessage = (message: WsMessage) => {
	for (const connection of Object.values(connectionsPool)) {
		const msg = JSON.stringify(message);
		connection.sendUTF(msg);
	}
};

/**
 * Отправить состояние сессии всем клиетнам
 * @param session
 */
export const sendSession = (session: Session) => {
	sendWsMessage(new WsMessage(WsMessageType.SESSION, session));
};

export const sendSettings = (settings: Settings) => {
	sendWsMessage(new WsMessage(WsMessageType.SETTINGS, settings));
};
