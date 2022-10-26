import gpiop from 'rpi-gpio';
import { DevicesDto } from './dto/DevicesDto';

export const devices = new DevicesDto();

const TEN_PIN = 18;

export const tenOn = () => {
	gpiop.promise.setup(TEN_PIN, gpiop.promise.DIR_OUT).then(() => {
		gpiop.promise.write(TEN_PIN, true);
	});
	devices.ten = true;
};

export const tenOff = () => {
	gpiop.promise.setup(TEN_PIN, gpiop.promise.DIR_OUT).then(() => {
		gpiop.promise.write(TEN_PIN, false);
	});
	devices.ten = false;
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
		// TODO: включить ТЭН
		devices.ten = true;
	} else if (current >= max) {
		// если максимум или больше
		// TODO: выключить ТЭН
		devices.ten = false;
	}
};
