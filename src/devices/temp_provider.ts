import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import config from '../config';
import { getAvailableTempDevices } from '../utils/utils';

export class TempProvider {
	name: string;
	list: string[];

	private idle: any;
	private currentTestTemp: number = 0;

	constructor(devices: string[], name: string) {
		this.list = devices.length > 0 ? devices : getAvailableTempDevices();
		this.setName(name && name.trim.length > 0 ? name : this.list[0]);
	}

	public setName(name: string) {
		this.name = name;
		if (this.idle) {
			clearInterval(this.idle);
		}
		if (name === 'Test') {
			this.idle = setInterval(this.generate, 500);
		}
	}

	public getTemp(): number {
		const filePath = this.name === 'Test' ? config.TEMP_TEST_FILE : `/sys/bus/w1/devices/${this.name}/w1_slave`;
		const tempdata = readFileSync(filePath, { encoding: 'utf-8' });
		const tempstrings = tempdata.split('\n').map(item => item.trim());
		let temp = 0.0;
		if (tempstrings.length > 1) {
			const reg = new RegExp(/(\d+)$/g);
			const match = tempstrings[1].match(reg);
			if (match && match.length > 0) {
				temp = parseInt(match[0]) / 1000;
			}
		}
		return temp;
	}

	private randomInteger(min: number, max: number): number {
		// получить случайное число от (min-0.5) до (max+0.5)
		const rand = min - 0.5 + Math.random() * (max - min + 1);
		return Math.round(rand);
	}

	generate = () => {
		let content = '7c 01 4b 46 7f ff 04 10 09 : crc=09 YES\n';
		content += `7c 01 4b 46 7f ff 04 10 09 t=${this.currentTestTemp}\n`;
		writeFile(config.TEMP_TEST_FILE, content, { encoding: 'utf-8' }).then(() => {});
		if (this.currentTestTemp >= 100000) {
			this.currentTestTemp = this.randomInteger(10000, 15000);
		} else {
			this.currentTestTemp += this.randomInteger(500, 1000);
		}
	};
}
