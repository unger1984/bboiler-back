import http from 'http';
import { server as WebSocketServer } from 'websocket';
import { v4 as uuid } from 'uuid';

import config from './config';
import logger from './logger';
import { WsMessage } from './dto/WsDto';
import { connectionsPool, handleIncommingMessage, sendSession } from './handlers';
import { SessionDto, SessionStatus } from './dto/SessionDto';
import { getAviableDevices, SettingsDto } from './dto/SettingsDto';
import { devices, holdTemp, pumpOff, pumpOn, tenOff, tenOn } from './devices';
import moment from 'moment';
import { existsSync, readFileSync } from 'fs';
import { constants } from 'os';
import errno = module;

const wsserver = async () => {
	const wsHTTPServer = http.createServer(() => null);
	wsHTTPServer.listen(parseInt(config.HTTP_SERVER_WS), config.HTTP_SERVER_HOST, () =>
		logger.info(`WS Server started on ws://${config.HTTP_SERVER_HOST}:${config.HTTP_SERVER_WS}`),
	);

	const wsServer = new WebSocketServer({
		httpServer: wsHTTPServer,
	});

	// Основной обработчик вебсокетов
	wsServer.on('request', async request => {
		const index = uuid();
		const connection = request.accept('bboiler', request.origin);

		// Обработаем закрытие соединения
		connection.on('close', () => {
			if (connectionsPool[index]) delete connectionsPool[index];
		});

		// Обработаем входящие данные
		connection.on('message', message => {
			if (message.type === 'utf8') {
				const msg: WsMessage = JSON.parse(message.utf8Data || '{}');
				handleIncommingMessage(msg);
			}
		});
		connectionsPool[index] = connection;
	});
};

const mainHandler = async () => {
	const settings = new SettingsDto();
	const session = new SessionDto();
	session.error = '';
	const file = `/sys/bus/w1/devices/${settings.tempName}/w1_slave`;
	if (!settings.tempName || settings.tempName.trim().length <= 0 || !existsSync(file)) {
		session.status = SessionStatus.Error;
		session.error = `Не верно задан датчик температуры ${file}`;
		session.ten = devices.ten;
		session.pump = devices.pump;
		session.current = new Date();
		session.save();
		sendSession(session);

		try {
			settings.tempDevices = getAviableDevices();
		} catch (exc) {
			logger.error(exc);
		}
		if ((!settings.tempName || settings.tempName.length <= 0) && settings.tempDevices.length > 0) {
			settings.tempName = settings.tempDevices[0];
		}
		if (settings.tempName && settings.tempName.length > 0 && settings.tempDevices.length > 0) {
			session.status = SessionStatus.Ready;
			session.error = '';
			session.save();
		}
		settings.save();

		return;
	}

	if (session.error === SessionStatus.Error) {
		session.error = SessionStatus.Ready;
		session.error = '';
	}

	const tempdata = readFileSync(`/sys/bus/w1/devices/${settings.tempName}/w1_slave`, { encoding: 'utf-8' });
	const tempstrings = tempdata.split('\n').map(item => item.trim());
	let temp = 0.0;
	if (tempstrings.length > 1) {
		const reg = new RegExp(/(\d+)$/g);
		const match = tempstrings[1].match(reg);
		if (match && match.length > 0) {
			temp = parseInt(match[0]) / 1000;
		}
	}
	/// TODO обработчик ошибки если температура не определилась!
	session.temp = temp;
	switch (session.status) {
		case SessionStatus.Heat:
			{
				tenOn();
				if (session.pause === 0) {
					// если идет нагрев до температуры засыпи
					if (temp >= settings.tempMalt) {
						// достигли температуры засыпи
						// надо выключить ТЭН и перейти в режим засыпи
						tenOff();
						session.status = SessionStatus.Malt;
						session.time = new Date();
					}
				} else if (session.clean) {
					// если уже было промывка
					if (temp >= settings.tempBoiling - settings.tempDiff) {
						// если достигли температуры кипячения
						session.status = SessionStatus.Boiling;
						session.time = new Date();
					}
				} else if (session.pause > settings.pauses.length) {
					// если прошли все паузы, то надо греть до мэшаута
					if (temp >= settings.tempMashOut) {
						// если достигли температуры мэшаута
						// выключим ТЭН и перейдем в соотвествующий режим
						tenOff();
						session.status = SessionStatus.MashOut;
						session.time = new Date();
					}
				} else {
					// идет нагрев до одной из пауз
					const pause = settings.pauses[session.pause - 1];
					if (temp >= pause.temp) {
						// достигли заданной паузой температуры
						// надо выключить ТЭН и перевести в режим паузы
						tenOff();
						session.status = SessionStatus.Pause;
						session.time = new Date();
					}
				}
			}
			break;
		case SessionStatus.Malt:
			{
				// на температуре засыпи просто поддерживаем температуру
				holdTemp(temp, settings.tempMalt - settings.tempDiff, settings.tempMalt);
			}
			break;
		case SessionStatus.Pause:
			{
				// если мы на паузе, держим температуру
				const pause = settings.pauses[session.pause - 1];
				const time = new Date();
				if (moment(time).diff(moment(session.time), 'minutes') >= pause.time) {
					// если время паузы истекло, включим нагрев
					session.status = SessionStatus.Heat;
					tenOn();
					pumpOn();
					session.pause++;
					session.time = new Date();
				} else {
					holdTemp(temp, pause.temp - settings.tempDiff, pause.temp);
				}
			}
			break;
		case SessionStatus.MashOut:
			{
				const time = new Date();
				if (moment(time).diff(moment(session.time), 'minutes') >= settings.timeMashOut) {
					// мэшаут закончен
					tenOff();
					pumpOff();
					session.status = SessionStatus.Filter;
					session.time = new Date();
				} else {
					holdTemp(temp, settings.tempMashOut - settings.tempDiff, settings.timeMashOut);
				}
			}
			break;
		case SessionStatus.Boiling:
			{
				tenOn();
				// если включено кипячение
				if (session.hop < settings.hops.length) {
					// если еще не весь хмель засыпан
					const hop = settings.hops[session.hop];
					const time = new Date();
					if (moment(time).diff(moment(session.time), 'minutes') >= hop.time) {
						session.status = SessionStatus.Hop;
					}
				} else {
					const time = new Date();
					if (moment(time).diff(moment(session.time), 'minutes') >= settings.timeBoiling) {
						// кипячение окончено
						tenOff();
						pumpOff();
						session.status = SessionStatus.Done;
						session.time = new Date();
					}
				}
			}
			break;
		case SessionStatus.Done:
			{
				// Надо выключить все
				tenOff();
				pumpOff();
			}
			break;
		case SessionStatus.Hop:
			// Ждем пока юзер засыпит хмель
			tenOn();
			break;
		case SessionStatus.Filter:
			// Ждем пока юзер отфильтруется
			tenOff();
			pumpOff();
			break;
		case SessionStatus.Ready:
		default:
			/// Ждем пока юзер включит варку
			tenOff();
			pumpOff();
			break;
	}
	session.ten = devices.ten;
	session.pump = devices.pump;
	session.current = new Date();
	session.save();
	sendSession(session);
};

wsserver().then(() => {
	tenOff();
	pumpOff();
	logger.info('WS server started');
	setInterval(mainHandler, 1000);
});
