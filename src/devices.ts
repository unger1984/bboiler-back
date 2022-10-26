import gpiop from 'rpi-gpio';
import { DevicesDto } from './dto/DevicesDto';
import logger from './logger';

export const devices = new DevicesDto();

const TEN_PIN = 12;

gpiop.promise.setup(TEN_PIN, gpiop.promise.DIR_OUT).catch(err => {
	logger.error(err);
});

export const tenOn = () => {
	gpiop.promise
		.write(TEN_PIN, true)
		.then(() => {
			devices.ten = true;
		})
		.catch(err => {
			logger.error(err);
		});
};

export const tenOff = () => {
	gpiop.promise
		.write(TEN_PIN, false)
		.then(() => {
			devices.ten = false;
		})
		.catch(err => {
			logger.error(err);
		});
};

export const pumpOn = () => {
	// TODO включить насос
	devices.pump = true;
};

export const pumpOff = () => {
	// TODO выключить насос
	devices.pump = false;
};

export const holdTemp = (current: number, min: number, max: number) => {
	if (current <= min) {
		// надо подогреть
		tenOn();
	} else if (current >= max) {
		// если максимум или больше
		tenOff();
	}
};
