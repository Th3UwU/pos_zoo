import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

const types: string[] = [
	'cafeteria',
	'dulceria',
	'souvenirs',
	'restaurante',
	'bebidas'
];

let location = document.getElementById('location') as HTMLInputElement;
let type = document.getElementById('type') as HTMLSelectElement;
let hours = document.getElementById('hours') as HTMLInputElement;
let status = document.getElementById('status') as HTMLInputElement;

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;

// Populate select input (type)
for (const t of types) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = t;
	option.text = t;
	type.add(option);
}

async function MAIN(): Promise<void> {

	// Add new store
	if (aux.action == 'a')
	{
		
		buttonAccept.addEventListener('click', async (): Promise<void> => {
		
			try {
				let query = `INSERT INTO STORE VALUES((SELECT MAX(ID_STORE) FROM STORE) + 1, '${location.value}', '${type.value}', '${hours.value}', DEFAULT);`;
				console.log(query);
				await main.querySQL(query);
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}
	// Modify store
	else if (aux.action == 'm')
	{
		// Get entry to modify
		let store: any = (await main.querySQL(`SELECT * FROM STORE WHERE id_store = ${aux.id};`)).rows[0];

		// Populate inputs with existing info
		location.value = store.location;

		for (let i = 0; i < types.length; i++)
			if (types[i] == store.type) type.selectedIndex = i;

		hours.value = store.hours;
		status.checked = store.status;

		// Button event
		buttonAccept.addEventListener('click', async (): Promise<void> => {
		
			try {
				let query =
				`UPDATE STORE SET
				location = '${location.value}', type = '${type.value}',
				hours = '${hours.value}', status = ${status.checked}
				WHERE id_store = ${aux.id};`;

				console.log(query);
				await main.querySQL(query);
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}

}
MAIN();
