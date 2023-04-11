import { app, BrowserWindow } from 'electron';
import { initialize } from '@electron/remote/main'
import { Client, Query, QueryResult } from 'pg'
import Window from './window'

type Credentials = {
	idEmployee: number;
	role: string;
	idStore: number;
};

class Main {

	window: BrowserWindow;
	client: Client;

	credentials = <Credentials>({
		idEmployee: 0,
		role: '',
		idStore: 0
	 });

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

		initialize();

		// global.aux = {action: 'a', id: -1, selectEntryColumn: 'supplier', returnInputID: 'supplier'};
		global.aux = {action: 'm', id: 1};
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

	setGlobal(value: any, name: string) {
		global[name] = value;
	}

	setProperty(value: any, name: string) {
		this[name] = value;
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

		this.createWindow(800, 600, 'gui/login.html', this.window);
		// loginWindow.window.fullScreen = true;
	}
}

export default Main;