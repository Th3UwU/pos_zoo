import { BrowserWindow } from 'electron';

export default class Window {
	window: BrowserWindow;

	constructor(title: string, width: number, height: number, source: string, parent: BrowserWindow = null) {

		this.window = new BrowserWindow({width: width, height: height, parent: parent, modal: true, show: false, title: title});
		this.window.loadFile(source);
		this.window.setMenu(null);
		this.window.on('close', this.onClose.bind(this));
		this.window.on('closed', this.onClosed.bind(this));
		this.window.once('ready-to-show', () => {
			this.window.show();
		});
	}

	onClose() {
		console.log(`Closing window: ${this.window.title}`);
	}

	onClosed() {
		this.window = null;
	}
}