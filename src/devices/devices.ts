import { TempProvider } from './temp_provider';
import { TenProvider } from './ten_provider';
import { PumpProvider } from './pump_provider';
import { $settings, updateSettings } from '../effects/settings';

class Devices {
	temp: TempProvider;
	ten: TenProvider;
	pump: PumpProvider;

	constructor() {
		const settings = $settings.getState();
		this.temp = new TempProvider(settings.devices, settings.tempName);
		this.ten = new TenProvider(settings.tenPin);
		this.pump = new PumpProvider(settings.pumpPin);

		updateSettings({
			...settings,
			devices: this.temp.list,
			tempName: this.temp.name,
			tenPin: this.ten.pin,
			pumpPin: this.pump.pin,
		});
	}

	public holdTemp(current: number, min: number, max: number) {
		if (current <= min) {
			// надо подогреть
			this.ten.on();
		} else if (current >= max) {
			// если максимум или больше
			this.ten.off();
		}
	}
}

export const devices = new Devices();
