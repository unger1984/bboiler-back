import { sendSession, sendSettings, WsMessage, WsMessageType } from './handlers/ws_hendler';
import {
	$session,
	cancel,
	done,
	setDoneFilter,
	setDoneHop,
	setDoneMalt,
	setDoneWater,
	setManualPump,
	setManualTen,
	skip,
} from './effects/session';
import { $settings, Settings, updateSettings } from './effects/settings';
import { devices } from './devices/devices';
import { getAvailableTempDevices } from './utils/utils';

export const handleIncommingMessage = (msg: WsMessage) => {
	switch (msg.command) {
		case WsMessageType.SETTINGS:
			sendSettings($settings.getState());
			break;
		case WsMessageType.SAVE_SETTINGS:
			updateSettings(msg.data as Settings);
			break;
		case WsMessageType.SESSION:
			sendSession($session.getState());
			break;
		case WsMessageType.MANUAL_TEN:
			setManualTen();
			break;
		case WsMessageType.MANUAL_PUMP:
			setManualPump();
			break;
		case WsMessageType.TEN_ON:
			devices.ten.on();
			break;
		case WsMessageType.TEN_OFF:
			devices.ten.off();
			break;
		case WsMessageType.PUMP_ON:
			devices.pump.on();
			break;
		case WsMessageType.PUMP_OFF:
			devices.pump.off();
			break;
		case WsMessageType.DONE_WATER:
			setDoneWater();
			break;
		case WsMessageType.DONE_MALT:
			setDoneMalt();
			break;
		case WsMessageType.DONE_FILTER:
			setDoneFilter();
			break;
		case WsMessageType.DONE_HOP:
			setDoneHop();
			break;
		case WsMessageType.SKIP:
			skip();
			break;
		case WsMessageType.CANCEL:
			cancel();
			break;
		case WsMessageType.DONE:
			done();
			break;
		case WsMessageType.REFRESH_SETTINGS:
			const settings = $settings.getState();
			const list = getAvailableTempDevices();
			if (!list.includes(settings.tempName)) {
				settings.tempName = list[0];
				devices.temp.setName(settings.tempName);
			}
			settings.devices = list;
			updateSettings(settings);
			break;
	}
};
