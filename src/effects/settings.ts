import { createEvent, createStore } from 'effector';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import config from '../config';
import { sendSettings } from '../handlers/ws_hendler';
import { devices } from '../devices/devices';

export interface PauseType {
	time: number;
	temp: number;
}

export interface HopType {
	time: number;
}

export interface Settings {
	tempMalt: number;
	tempMashOut: number;
	tempBoiling: number;
	timeBoiling: number;
	timeMashOut: number;
	tempDiff: number;
	pauses: PauseType[];
	hops: HopType[];
	tempName: string;
	devices: string[];
	tenPin: number;
	pumpPin: number;
}

/**
 * Загрузка настроек
 */
export const loadSettings = (): Settings => {
	if (existsSync(config.SETTINGS_JSON)) return JSON.parse(readFileSync(config.SETTINGS_JSON, { encoding: 'utf-8' }));
	return {
		tempName: '',
		tempBoiling: 98,
		timeBoiling: 60,
		tempMalt: 48,
		tempMashOut: 78,
		timeMashOut: 5,
		tempDiff: 1.5,
		pauses: [{ temp: 72, time: 60 }],
		hops: [{ time: 30 }],
		devices: [],
		tenPin: 12,
		pumpPin: 0,
	};
};

export const updateSettings = createEvent<Settings>('update settings');

export const $settings = createStore<Settings>(loadSettings()).on(updateSettings, (__, settings) => settings);

$settings.map(settings => {
	// logger.debug(settings);
	if (settings) {
		sendSettings(settings);
		writeFileSync(config.SETTINGS_JSON, JSON.stringify(settings), { encoding: 'utf-8' });
		if (settings.tempName !== devices.temp.name) {
			devices.temp.setName(settings.tempName);
		}
	}
});
