import { getCurrentWindow, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');

let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();

let buttons: HTMLCollectionOf<HTMLButtonElement> = document.getElementsByTagName('button');
for (const b of buttons) {
	b.addEventListener('click', async () => {

		let res: QueryResult<any> = await main.querySQL(`SELECT * FROM test;`);
		console.log(res.rows);

		let code: string = 
		`
			document.getElementById('supplier').value = '${res.rows[0].age}';
		`
		parent.webContents.executeJavaScript(code);
	});
}

