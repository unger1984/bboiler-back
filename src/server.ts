import http from 'http';
import { server as WebSocketServer } from 'websocket';
import { v4 as uuid } from 'uuid';

import config from './config';
import logger from './logger';
import { setTemp, setTime } from './effects/session';
import { connectionsPool, WsMessage } from './handlers/ws_hendler';
import { handleIncommingMessage } from './handlers';
import { devices } from './devices/devices';

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

const tempHandler = () => {
	const temp = devices.temp.getTemp();
	setTemp(temp);
};

const timeHandler = () => {
	setTime(new Date());
};

wsserver().then(() => {
	logger.info('WS server started');
	setInterval(tempHandler, 1000);
	setInterval(timeHandler, 1000);
});
