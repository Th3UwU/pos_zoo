import { BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main'

export default class Window {
	window: BrowserWindow;
	onCloseCode: string = null;

	constructor(width: number, height: number, source: string, parent: BrowserWindow = null) {

		this.window = new BrowserWindow ({
			width: width,
			height: height,
			parent: parent,
			modal: true,
			show: false,
			webPreferences:
			{
				plugins: true,
				nodeIntegration: true,
				contextIsolation: false,
				webSecurity: false,
				backgroundThrottling: false
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

		enable(this.window.webContents);
	}

	onClose() {
		console.log(`Closing window: ${this.window.title}`);
		if (this.onCloseCode)
		{
			console.log('Executing custom code');
			eval(this.onCloseCode);
		}
	}

	setOnClose(code: string) {
		this.onCloseCode = code;
	}

	onClosed() {
		this.window = null;
	}
}