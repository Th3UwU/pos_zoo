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

	createWindow(width: number, height: number, source: string, parent: BrowserWindow = null): Window {
		let window: Window = new Window(width, height, source, parent);
		return window;
	}
	
	onWindowAllClosed() {
		app.quit();
	}

	onClose() {
		this.window = null;
		console.log('Closing window\n');
	}

	onReady() {

		let loginWindow: Window = this.createWindow(800, 600, 'gui/add_product.html', this.window);
		loginWindow.window.fullScreen = true;
	}
}

export default Main;