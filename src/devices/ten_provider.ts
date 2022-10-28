import gpiop from 'rpi-gpio';

export class TenProvider {
	status: boolean;
	pin: number;

	constructor(pin: number) {
		this.pin = pin;
		this.off();
		gpiop.promise
			.setup(this.pin, gpiop.promise.DIR_OUT)
			.then(() => {
				this.off();
			})
			.catch(err => {
				// logger.error(err);
			});
	}

	public on() {
		gpiop.promise
			.write(this.pin, true)
			.then(() => {
				this.status = true;
			})
			.catch(err => {
				// logger.error(err);
			});
	}

	public off() {
		gpiop.promise
			.write(this.pin, false)
			.then(() => {
				this.status = false;
			})
			.catch(err => {
				// logger.error(err);
			});
	}
}
