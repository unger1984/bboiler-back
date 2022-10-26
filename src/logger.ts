/* eslint-disable no-console */
import config from './config';

const debug = (...args: any[]): void => (config.ENV === 'development' ? console.debug(...args) : undefined);
const info = (...args: any[]): void => console.log(...args);
const error = (...args: any[]): void => console.error(...args);

export default {
	debug,
	info,
	error,
};
