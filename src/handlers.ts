import { WsConnectionsPool, WsMessage, WsMessageType } from './dto/WsDto';
import { SessionDto, SessionStatus } from './dto/SessionDto';
import { SettingsDto } from './dto/SettingsDto';
import { devices, pumpOff, pumpOn, tenOff, tenOn } from './devices';

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

export const handleIncommingMessage = (msg: WsMessage) => {
	switch (msg.command) {
		case WsMessageType.Settings:
			{
				sendSettings();
			}
			break;
		case WsMessageType.SaveSettings:
			{
				const settings = new SettingsDto();
				settings.copy(msg.data);
				settings.save();
				sendSettings();
			}
			break;
		case WsMessageType.Session:
			{
				sendSession();
			}
			break;
		case WsMessageType.DoneWater:
			{
				const session = new SessionDto();
				session.status = SessionStatus.Heat;
				tenOn();
				pumpOn();
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
		case WsMessageType.DoneMalt:
			{
				const session = new SessionDto();
				session.pause = 1;
				session.status = SessionStatus.Heat;
				tenOn();
				pumpOn();
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
		case WsMessageType.DoneFilter:
			{
				const session = new SessionDto();
				session.status = SessionStatus.Heat;
				tenOn();
				session.time = new Date();
				session.clean = true;
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
		case WsMessageType.DoneHop:
			{
				const session = new SessionDto();
				session.hop++;
				session.status = SessionStatus.Boiling;
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
		case WsMessageType.Done:
			{
				const session = new SessionDto();
				session.time = null;
				session.pause = 0;
				session.hop = 0;
				session.clean = false;
				session.status = SessionStatus.Ready;
				tenOff();
				pumpOff();
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
		case WsMessageType.Skip:
			{
				const session = new SessionDto();
				if (session.status === SessionStatus.Pause) {
					session.status = SessionStatus.Heat;
					tenOn();
					pumpOn();
					session.pause++;
					session.time = new Date();
				} else if (session.status === SessionStatus.Hop) {
					session.hop++;
					session.status = SessionStatus.Boiling;
				} else if (session.status === SessionStatus.MashOut) {
					tenOff();
					pumpOff();
					session.status = SessionStatus.Filter;
					session.time = new Date();
				}
				session.ten = devices.ten;
				session.pump = devices.pump;
				session.save();
			}
			break;
	}
};
