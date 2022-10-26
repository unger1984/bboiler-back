/* eslint-disable no-unused-vars */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import config from '../config';

// eslint-disable-next-line no-shadow
export enum SessionStatus {
	Ready = 'READY', // ожидание старта
	Heat = 'HEAT', // подогрев до нужной температуры
	Malt = 'MALT', // засыпь
	Pause = 'PAUSE', // пауза
	MashOut = 'MASHOUT', // мешаут
	Filter = 'FILTER', // промывка
	Boiling = 'BOILING', // кипячение
	Hop = 'HOP', // засыпь хмеля
	Done = 'DONE', // варка завершена
}

export class SessionDto {
	temp: number; // текущая температура
	time: Date | null; // время старта
	current: Date;
	ten: boolean; // включен ли ТЭН
	pump: boolean; // включен ли насос
	clean: boolean; // промыто
	status: SessionStatus; // текущий статус
	pause: number; // номер текущей паузы (от 1)
	hop: number; // номер текущей зазыпи хмеля

	constructor() {
		if (!existsSync(config.SESSION_JSON)) {
			this.temp = 0;
			this.current = new Date();
			this.time = null;
			this.ten = false;
			this.pump = false;
			this.clean = false;
			this.status = SessionStatus.Ready;
			this.pause = 0;
			this.hop = 0;
			this.save();
		} else {
			const saved: SessionDto = JSON.parse(readFileSync(config.SESSION_JSON, { encoding: 'utf-8' }));
			this.temp = saved.temp;
			this.time = saved.time;
			this.current = saved.current;
			this.ten = saved.ten;
			this.pump = saved.pump;
			this.clean = saved.clean;
			this.status = saved.status;
			this.pause = saved.pause;
			this.hop = saved.hop;
		}
	}

	public save() {
		writeFileSync(config.SESSION_JSON, JSON.stringify(this), { encoding: 'utf-8' });
	}
}
