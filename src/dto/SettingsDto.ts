import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import config from '../config';
import logger from '../logger';

export interface PauseDto {
	temp: number; // температура паузы
	time: number; // время паузы
}

export interface HopDto {
	time: number;
}

const getDevices = () => {
	const dirs = readdirSync('/sys/bus/w1/devices', { withFileTypes: true });
	return dirs.filter(item => item.isSymbolicLink()).map(item => item.name);
};

export class SettingsDto {
	tempName: string; // название датчика
	tempDevices: string[]; // список датчиков
	tempMalt: number; // температура засыпи
	tempMashOut: number; // температура мэшаута
	timeMashOut: number; // время мэшаута
	pauses: PauseDto[]; // температурные паузы
	timeBoiling: number; // время кипячения
	tempBoiling: number; // температура кипения
	hops: HopDto[]; // время засыпи хмеля
	tempDiff: number; // на сколько градусов во время паузы может упасть температура

	constructor() {
		if (!existsSync(config.SETTINGS_JSON)) {
			this.tempMalt = 52;
			this.tempMashOut = 78;
			this.timeMashOut = 5;
			this.pauses = [
				{
					temp: 72,
					time: 60,
				},
			];
			this.timeBoiling = 60;
			this.tempBoiling = 99;
			this.hops = [{ time: 30 }];
			this.tempDiff = 1.5;
			this.tempDevices = [];
			try {
				this.tempDevices = getDevices();
			} catch (err) {
				logger.error(err);
			}
			if (this.tempDevices.length > 0) {
				this.tempName = this.tempDevices[0];
			} else {
				this.tempName = '';
			}

			this.save();
		} else {
			const saved: SettingsDto = JSON.parse(readFileSync(config.SETTINGS_JSON, { encoding: 'utf-8' }));
			this.copy(saved);
			try {
				this.tempDevices = getDevices();
			} catch (err) {
				logger.error(err);
			}
			if ((!this.tempName || this.tempName.length <= 0) && this.tempDevices.length > 0) {
				this.tempName = this.tempDevices[0];
			}
		}
	}

	public copy(saved: SettingsDto) {
		this.tempMalt = saved.tempMalt;
		this.tempMashOut = saved.tempMashOut;
		this.timeMashOut = saved.timeMashOut;
		this.pauses = saved.pauses;
		this.timeBoiling = saved.timeBoiling;
		this.tempBoiling = saved.tempBoiling;
		this.hops = saved.hops;
		this.tempDiff = saved.tempDiff;
		this.tempName = saved.tempName;
		this.tempDevices = saved.tempDevices;
	}

	public save() {
		writeFileSync(config.SETTINGS_JSON, JSON.stringify(this), { encoding: 'utf-8' });
	}
}
