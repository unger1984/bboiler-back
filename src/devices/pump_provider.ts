export class PumpProvider {
	status: boolean;
	pin: number;

	constructor(pin: number) {
		this.pin = pin;
		this.off();
	}

	public on() {
		this.status = true;
	}

	public off() {
		this.status = false;
	}
}
