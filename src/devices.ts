import gpiop from 'rpi-gpio';
import { DevicesDto } from './dto/DevicesDto';

export const devices = new DevicesDto();

gpiop.promise.setup(18, gpiop.DIR_OUT);

export const tenOn = () => {
	gpiop.promise.write(18, true);
	devices.ten = true;
};

export const tenOff = () => {
	gpiop.promise.write(18, false);
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
