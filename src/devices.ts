import { DevicesDto } from './dto/DevicesDto';

export const devices = new DevicesDto();

export const tenOn = () => {
	// TODO: включить ТЭН
	devices.ten = true;
};

export const tenOff = () => {
	// TODO: выключить ТЭН
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
