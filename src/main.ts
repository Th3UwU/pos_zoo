import { app, BrowserWindow } from 'electron';
import Window from './window'

class Main {

	window: BrowserWindow;

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
	}
	
	onWindowAllClosed() {
		app.quit();
	}

	onClose() {
		this.window = null;
		console.log('Closing window\n');
	}

	onReady() {

		// this.window = new BrowserWindow({width: 800, height: 600});
		// this.window.loadURL('https://www.google.com');
		// this.window.on('closed', this.onClose.bind(this));

		let loginWindow: Window = new Window(800, 600, '../src/gui/login.html', this.window);
		loginWindow.window.fullScreen = true;
	}
}

export default Main;