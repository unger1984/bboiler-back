import * as dotenv from 'dotenv';

dotenv.config();

type ConfigInterface = {
	ENV: 'development' | 'production';
	HTTP_SERVER_HOST: string;
	HTTP_SERVER_WS: string;
	TEMP_FILE_PATH: string;
	SETTINGS_JSON: string;
	SESSION_JSON: string;
};

const config: ConfigInterface = {
	ENV: 'development',
	HTTP_SERVER_HOST: process.env.HTTP_SERVER_HOST ?? '',
	HTTP_SERVER_WS: process.env.HTTP_SERVER_WS ?? '',
	TEMP_FILE_PATH: process.env.TEMP_FILE_PATH ?? '',
	SETTINGS_JSON: process.env.SETTINGS_JSON ?? 'settings.json',
	SESSION_JSON: process.env.SESSION_JSON ?? 'session.json',
};

export default config;
