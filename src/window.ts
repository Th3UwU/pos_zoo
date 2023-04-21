import { BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main'

export default class Window {
	window: BrowserWindow;

	codeCloseMain: string = null;
	codeClose: string = null;
	codeCloseParent: string = null;

	constructor(width: number, height: number, source: string, parent: BrowserWindow = null) {

		this.window = new BrowserWindow ({
			width: width,
			height: height,
			parent: parent,
			modal: (parent) ? (true) : (false),
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

		// Main
		if (this.codeCloseMain)
			eval(this.codeCloseMain);

		// This window
		if (this.codeClose)
			this.window.webContents.executeJavaScript(this.codeClose);

		// Parent
		if (this.codeCloseParent)
			this.window.getParentWindow().webContents.executeJavaScript(this.codeCloseParent);
	}

	setVar(value: any, name: string) {
		this[name] = value;
	}

	onClosed() {
		this.window = null;
	}
}