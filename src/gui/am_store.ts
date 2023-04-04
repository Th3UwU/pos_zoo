import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import Window from '../window';

let main: Main = getGlobal('main');

const types: string[] = [
	'cafeteria',
	'dulceria',
	'souvenirs',
	'restaurante',
	'bebidas'
];

let typeSelect = document.getElementById('type') as HTMLSelectElement;
for (const t of types) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = t;
	option.text = t;
	typeSelect.add(option);
}

// Add new store
let location = document.getElementById('location') as HTMLInputElement;
let type = document.getElementById('type') as HTMLInputElement;
let hours = document.getElementById('hours') as HTMLInputElement;
//let estatus = document.getElementById('estatus') as HTMLInputElement;

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
buttonAccept.addEventListener('click', async (): Promise<void> => {

	let query = `INSERT INTO STORE VALUES((SELECT MAX(ID_STORE) FROM STORE) + 1, '${location.value}', '${type.value}', '${hours.value}', DEFAULT);`;
	console.log(query);
	await main.querySQL(query);
});
//
