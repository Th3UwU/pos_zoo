import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import { alertMessage } from '../misc';
import Main from '../main';
import Window from '../window';

let main: Main = getGlobal('main');

// Select CV
const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir CV', properties: ['openFile']};

let inputCV = document.getElementById('cv') as HTMLInputElement;
let buttonCV = document.getElementById('buttonCV') as HTMLButtonElement;
let dialogResult: string[] = undefined;

buttonCV.addEventListener('click', () => {
	dialogResult = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

	if (dialogResult != undefined)
	{
		inputCV.value = dialogResult[0];

		let CVRaw: Buffer = readFileSync(dialogResult[0], null);
		console.log(CVRaw[4]);
	}
});

// Add new employee
let pass = document.getElementById('pass') as HTMLInputElement;
let curp = document.getElementById('curp') as HTMLInputElement;
let first_name = document.getElementById('first_name') as HTMLInputElement;
let last_name = document.getElementById('last_name') as HTMLInputElement;
let address = document.getElementById('address') as HTMLInputElement;
let nss = document.getElementById('nss') as HTMLInputElement;
//let estatus = document.getElementById('estatus') as HTMLInputElement;

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
buttonAccept.addEventListener('click', async (): Promise<void> => {


	let CVRaw: string = (dialogResult == undefined) ? (null) : (readFileSync(dialogResult[0], null).toString('base64'));
	if (!CVRaw)
		alertMessage(getCurrentWindow(), {title: "Error", message: "Ingrese la ruta del CV (PDF)", type: "error"});
	else
	{
		let query: string = `INSERT INTO EMPLOYEE VALUES((SELECT MAX(ID_EMPLOYEE) FROM EMPLOYEE) + 1, '${pass.value}', '${curp.value}', '${first_name.value}', '${last_name.value}', '${address.value}', '${nss.value}', (DECODE('${CVRaw}', 'base64')), DEFAULT);`;
		console.log(query);
		await main.querySQL(query);
	}

});
//
