import { WsConnectionsPool, WsMessage, WsMessageType } from './dto/WsDto';
import { SessionDto } from './dto/SessionDto';
import { SettingsDto } from './dto/SettingsDto';

export const connectionsPool: WsConnectionsPool = {};

export const sendWsMessage = (message: WsMessage) => {
	for (const connection of Object.values(connectionsPool)) {
		const msg = JSON.stringify(message);
		connection.sendUTF(msg);
	}
};

export const sendSession = (session: SessionDto | null = null) => {
	const sess = session ? session : new SessionDto();
	sendWsMessage(new WsMessage(WsMessageType.Session, sess));
};

export const sendSettings = (settings: SettingsDto | null = null) => {
	const set = settings ? settings : new SettingsDto();
	sendWsMessage(new WsMessage(WsMessageType.Settings, set));
};
