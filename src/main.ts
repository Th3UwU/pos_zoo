import { app, BrowserWindow } from 'electron';
import Window from './window'

class Main {

	window: BrowserWindow;

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		console.log(this);
	}
	
	onWindowAllClosed() {
		app.quit()
	}

	onClose() {
		this.window = null;
		console.log("Closing window\n");
	}

	onReady() {
		this.window = new BrowserWindow({width: 800, height: 600});
		this.window.loadURL('https://www.google.com');
		
		this.window.on('closed', this.onClose.bind(this));

		let prueba: Window = new Window("Prueba", 800, 600, "algo.html", this.window);
	}
}

export default Main;