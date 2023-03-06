import { BrowserWindow } from 'electron';

export default class Window {
	window: BrowserWindow;

	constructor(width: number, height: number, source: string, parent: BrowserWindow = null) {

		this.window = new BrowserWindow ({
			width: width,
			height: height,
			parent: parent,
			modal: true,
			show: false,
			webPreferences:
			{
				nodeIntegration: true,
				contextIsolation: false,
				webSecurity: false
			}
		});

		this.window.loadFile(source);
		this.window.setMenu(null);
		this.window.on('close', this.onClose.bind(this));
		this.window.on('closed', this.onClosed.bind(this));
		this.window.once('ready-to-show', () => {
			this.window.show();
			this.window.webContents.openDevTools();
		});
	}

	onClose() {
		console.log(`Closing window`);
	}

	onClosed() {
		this.window = null;
	}
}