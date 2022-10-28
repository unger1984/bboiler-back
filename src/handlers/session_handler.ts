import moment from 'moment/moment';

import { $settings, devices } from '../effects/settings';
import { Session, SessionStatus } from '../effects/session';

/**
 * Обработчик показаний температуры
 * @param session
 * @param temp
 */
export const handleTemp = (session: Session, temp: number): Session => {
	const settings = $settings.getState();
	switch (session.status) {
		case SessionStatus.Heat:
			if (temp >= session.tempMax) {
				// нагрели до нужной температуры
				if (!session.manualTen) {
					devices.ten.off();
				}
				if (session.tempMax === settings.tempMalt) {
					// если это температура засыпи солода
					session.status = SessionStatus.Malt;
					session.lastTime = new Date();
				} else if (session.tempMax === settings.tempMashOut) {
					// если это температура мэшаута
					session.status = SessionStatus.MashOut;
					session.lastTime = new Date();
				} else if (session.tempMax === settings.tempBoiling) {
					// если это температура кипячения
					session.status = SessionStatus.Boiling;
					session.minutes = settings.timeBoiling;
					session.lastTime = new Date();
				} else if (session.tempMax > 0) {
					// значит это температура паузы
					session.status = SessionStatus.Pause;
					session.lastTime = new Date();
					session.minutes = settings.pauses[session.pause].time;
					session.pause++;
				}
			}
			break;
		case SessionStatus.Malt:
		case SessionStatus.Pause:
			// поддерживаем температуру
			devices.holdTemp(temp, session.tempMax - $settings.getState().tempDiff, session.tempMax);
			break;
	}
	session.temp = temp;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Обработчик таймера
 * @param session
 * @param time
 */
export const handleTime = (session: Session, time: Date): Session => {
	const settings = $settings.getState();
	if (moment(time).diff(moment(session.lastTime), 'minutes') >= session.minutes) {
		// достигли завершения по времени
		switch (session.status) {
			case SessionStatus.MashOut:
				// мешаут закончен, надо промыть и слить
				if (!session.manualPump) {
					devices.pump.off();
				}
				if (!session.manualTen) {
					devices.ten.off();
				}
				session.status = SessionStatus.Filter;
				session.minutes = 0;
				session.tempMax = 0;
				session.lastTime = new Date();
				break;
			case SessionStatus.Pause:
				// пауза закончена
				if (!session.manualPump) {
					devices.pump.on();
				}
				if (!session.manualTen) {
					devices.ten.on();
				}
				session.status = SessionStatus.Heat; // нагрев до следующего температурного значения
				session.lastTime = new Date();
				session.minutes = 0;
				if (session.pause >= settings.pauses.length) {
					// прошли все паузы
					session.tempMax = settings.tempMashOut;
				} else {
					const next = settings.pauses[session.pause];
					session.tempMax = next.temp;
					session.pause++;
				}
				break;
			case SessionStatus.Hop:
			case SessionStatus.Boiling:
				session.status = SessionStatus.Done;
				session.lastTime = new Date();
				session.minutes = 0;
				session.tempMax = 0;
				session.pause = 0;
				session.hop = 0;
				devices.ten.off();
				devices.pump.off();
				break;
		}
	} else if (session.status === SessionStatus.Boiling) {
		// время кипячения не вышло и еще продолжает кипеть, надо пройтись по хопам
		if (session.hop < settings.hops.length) {
			// хопы не пройдены
			const current = settings.hops[session.hop];
			if (moment(time).diff(moment(session.lastTime), 'minutes') >= current.time) {
				// время засыпки хмеля
				session.status = SessionStatus.Hop;
			}
		}
	}
	session.currentTime = time;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку вода залита
 * @param session
 */
export const handleDoneWater = (session: Session): Session => {
	const settings = $settings.getState();
	if (!session.manualPump) {
		devices.pump.on();
	}
	if (!session.manualTen) {
		devices.ten.on();
	}
	session.status = SessionStatus.Heat;
	session.startTime = new Date();
	session.lastTime = new Date();
	session.tempMax = settings.tempMalt;
	session.pause = 0;
	session.hop = 0;
	session.minutes = 0;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку солод засыпан
 * @param session
 */
export const handleDoneMalt = (session: Session): Session => {
	const settings = $settings.getState();
	if (!session.manualPump) {
		devices.pump.on();
	}
	if (!session.manualTen) {
		devices.ten.on();
	}
	session.status = SessionStatus.Heat;
	session.lastTime = new Date();
	session.tempMax = settings.pauses[0].temp;
	session.pause = 0;
	session.hop = 0;
	session.minutes = 0;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку пропустить паузу
 * @param session
 */
export const handleSkip = (session: Session): Session => {
	const settings = $settings.getState();
	if (!session.manualPump) {
		devices.pump.on();
	}
	if (!session.manualTen) {
		devices.ten.on();
	}
	session.status = SessionStatus.Heat; // нагрев до следующего температурного значения
	session.lastTime = new Date();
	session.minutes = 0;
	if (session.pause >= settings.pauses.length) {
		// прошли все паузы
		session.tempMax = settings.tempMashOut;
	} else {
		const next = settings.pauses[session.pause];
		session.tempMax = next.temp;
		session.pause++;
	}
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку включить кипячение
 * @param session
 */
export const handleDoneFilter = (session: Session): Session => {
	const settings = $settings.getState();
	if (!session.manualPump) {
		devices.pump.on();
	}
	if (!session.manualTen) {
		devices.ten.on();
	}
	session.status = SessionStatus.Heat;
	session.lastTime = new Date();
	session.tempMax = settings.tempBoiling;
	session.hop = 0;
	session.minutes = 0;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку засыпан хмель
 * @param session
 */
export const handleDoneHop = (session: Session): Session => {
	session.status = SessionStatus.Boiling;
	session.hop++;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку отменить варку
 * @param session
 */
export const handleCancel = (session: Session): Session => {
	devices.pump.off();
	devices.ten.off();
	session.status = SessionStatus.Ready;
	session.lastTime = null;
	session.tempMax = 0;
	session.pause = 0;
	session.hop = 0;
	session.minutes = 0;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};

/**
 * Нажали кнопку отменить варку
 * @param session
 */
export const handleDone = (session: Session): Session => {
	devices.pump.off();
	devices.ten.off();
	session.status = SessionStatus.Ready;
	session.lastTime = null;
	session.tempMax = 0;
	session.pause = 0;
	session.hop = 0;
	session.minutes = 0;
	session.ten = devices.ten.status;
	session.pump = devices.pump.status;

	return session;
};
