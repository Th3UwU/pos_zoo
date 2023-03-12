import { app, BrowserWindow } from 'electron';
import { initialize } from '@electron/remote/main'
import Window from './window'

class Main {

	window: BrowserWindow;

	myPass: string;

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

		initialize();

		this.myPass = "UwU";
	}
	
	onWindowAllClosed() {
		app.quit();
	}

	onClose() {
		this.window = null;
		console.log('Closing window\n');
	}

	onReady() {

		let loginWindow: Window = new Window(800, 600, 'gui/login.html', this.window);
		loginWindow.window.fullScreen = true;
	}
}

export default Main;