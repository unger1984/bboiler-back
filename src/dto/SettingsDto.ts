import { existsSync, readFileSync, writeFileSync } from 'fs';
import config from '../config';

export interface PauseDto {
	temp: number; // температура паузы
	time: number; // время паузы
}

export interface HopDto {
	time: number;
}

export class SettingsDto {
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
			this.save();
		} else {
			const saved: SettingsDto = JSON.parse(readFileSync(config.SETTINGS_JSON, { encoding: 'utf-8' }));
			this.tempMalt = saved.tempMalt;
			this.tempMashOut = saved.tempMashOut;
			this.timeMashOut = saved.timeMashOut;
			this.pauses = saved.pauses;
			this.timeBoiling = saved.timeBoiling;
			this.tempBoiling = saved.tempBoiling;
			this.hops = saved.hops;
			this.tempDiff = saved.tempDiff;
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
	}

	public save() {
		writeFileSync(config.SETTINGS_JSON, JSON.stringify(this), { encoding: 'utf-8' });
	}
}
