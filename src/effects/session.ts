/* eslint-disable no-unused-vars */
import { createEvent, createStore } from 'effector';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import config from '../config';
import {
	handleCancel,
	handleDone,
	handleDoneFilter,
	handleDoneHop,
	handleDoneMalt,
	handleDoneWater,
	handleSkip,
	handleTemp,
	handleTime,
} from '../handlers/session_handler';
import { sendSession } from '../handlers/ws_hendler';

// eslint-disable-next-line no-shadow
export enum SessionStatus {
	Ready = 'READY', // Ждет включения
	Heat = 'HEAT', // Нагрев до заданной температуры
	Malt = 'MALT', // засыпь
	Pause = 'PAUSE', // пауза
	MashOut = 'MASHOUT', // мешаут
	Filter = 'FILTER', // промывка
	Boiling = 'BOILING', // кипячение
	Hop = 'HOP', // засыпь хмеля
	Done = 'DONE', // Варка завершена
}

export interface Session {
	temp: number; // температура текущая
	tempMax: number; // температура следующая
	manualTen: boolean; // ручное управление тэном
	manualPump: boolean; // ручное управление насосом
	ten: boolean; // состояние тэна
	pump: boolean; // состояние насоса
	startTime: Date | null; // время начала варки
	lastTime: Date | null; // время пначала последней операции
	currentTime: Date; // текущее время
	minutes: number; // время на операцию
	status: SessionStatus; // текущий статус
	pause: number;
	hop: number;
}

/**
 * Загрузка сохраненной сесси
 */
export const loadSession = (): Session => {
	if (existsSync(config.SESSION_JSON)) return JSON.parse(readFileSync(config.SESSION_JSON, { encoding: 'utf-8' }));
	return {
		status: SessionStatus.Ready,
		manualPump: false,
		manualTen: false,
		pump: false,
		currentTime: new Date(),
		lastTime: null,
		startTime: null,
		minutes: 0,
		temp: 0,
		tempMax: 0,
		ten: false,
		pause: 0,
		hop: 0,
	};
};

export const setTemp = createEvent<number>('set session temp');
export const setTime = createEvent<Date>('set session time');
export const setManualTen = createEvent<void>('set manual ten');
export const setManualPump = createEvent<void>('set manual pump');
export const setDoneWater = createEvent<void>('set done water');
export const setDoneMalt = createEvent<void>('set done malt');
export const setDoneFilter = createEvent<void>('set done filter');
export const setDoneHop = createEvent<void>('set done hop');
export const cancel = createEvent<void>('cancel');
export const skip = createEvent<void>('skip');
export const done = createEvent<void>('done');

export const $session = createStore<Session>(loadSession())
	.on(setTemp, (session, temp) => handleTemp({ ...session }, temp))
	.on(setTime, (session, time) => handleTime({ ...session }, time))
	.on(setDoneWater, session => handleDoneWater({ ...session }))
	.on(setDoneMalt, session => handleDoneMalt({ ...session }))
	.on(setDoneFilter, session => handleDoneFilter({ ...session }))
	.on(setDoneHop, session => handleDoneHop({ ...session }))
	.on(cancel, session => handleCancel({ ...session }))
	.on(skip, session => handleSkip({ ...session }))
	.on(done, session => handleDone({ ...session }))
	.on(setManualTen, session => ({ ...session, manualTen: !session.manualTen }))
	.on(setManualPump, session => ({ ...session, manualPump: !session.manualPump }));

$session.map(session => {
	// logger.debug(session);
	if (session) {
		sendSession(session);
		writeFileSync(config.SESSION_JSON, JSON.stringify(session), { encoding: 'utf-8' });
	}
});
