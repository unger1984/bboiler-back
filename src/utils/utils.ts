import { readdirSync } from 'fs';

export const getAvailableTempDevices = (): string[] => {
	let res = ['Test'];
	try {
		const dirs = readdirSync('/sys/bus/w1/devices', { withFileTypes: true });
		res = [...res, ...dirs.map(item => item.name)];
	} catch (exc) {
		// logger.error(exc);
	}

	return res;
};
