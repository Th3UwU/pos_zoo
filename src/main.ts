import { app, BrowserWindow } from 'electron';
import { initialize } from '@electron/remote/main'
import { Client, Query, QueryResult } from 'pg'
import Window from './window'

class Main {

	window: BrowserWindow;
	myPass: string;
	client: Client;

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

		initialize();

		this.myPass = "UwU";
	}

	async connectDB() {

		console.log("Connecting...");
		this.client = new Client
		({
			user: "postgres",
			host: "localhost",
			database: "zoo",
			port: 5432
		});
		await this.client.connect();

		//const res = (await client.query(`SELECT * FROM test;`)).rows;
		//console.log(res);
		
	}

	async disconnectDB() {
		console.log("Disconnecting...");
		await this.client.end();
	}

	createWindow(width: number, height: number, source: string, parent: BrowserWindow = null): Window {
		let window: Window = new Window(width, height, source, parent);
		return window;
	}

	async querySQL(query: string): Promise<QueryResult<any>> {
		return (await this.client.query(query));
	}
	
	onWindowAllClosed() {
		this.disconnectDB();
		app.quit();
	}

	onClose() {
		this.window = null;
		console.log('Closing window\n');
	}

	onReady() {

		this.connectDB();

		let loginWindow: Window = this.createWindow(800, 600, 'gui/add_product.html', this.window);
		loginWindow.window.fullScreen = true;
	}
}

export default Main;