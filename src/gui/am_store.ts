import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');

const types: string[] = [
	'cafeteria',
	'dulceria',
	'souvenirs',
	'restaurante',
	'bebidas'
];

let id_store = document.getElementById('id_store') as HTMLInputElement;
let location = document.getElementById('location') as HTMLInputElement;
let type = document.getElementById('type') as HTMLSelectElement;
let hours = document.getElementById('hours') as HTMLInputElement;
let status = document.getElementById('status') as HTMLInputElement;

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;

buttonCancel.addEventListener('click', (): void => {

	getCurrentWindow().close();
});

// Populate select input (type)
for (const t of types) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = t;
	option.text = t;
	type.add(option);
}

async function MAIN(): Promise<void> {

	id_store.readOnly = true;

	// Add new store
	if (main.aux.action == 'a')
	{
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_STORE) FROM STORE`)).rows[0].max;
		new_id++;
		id_store.value = `${new_id}`;
		status.disabled = true;
		
		buttonAccept.addEventListener('click', async (): Promise<void> => {
		
			try {
				let query = `INSERT INTO STORE VALUES(${new_id}, '${location.value}', '${type.value}', '${hours.value}', DEFAULT);`;
				console.log(query);
				await main.querySQL(query);

				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}
	// Modify store
	else if (main.aux.action == 'm')
	{
		// Get entry to modify
		let store: any = (await main.querySQL(`SELECT * FROM STORE WHERE id_store = ${main.aux.id};`)).rows[0];

		// Populate inputs with existing info
		id_store.value = store.id_store;
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
				WHERE id_store = ${main.aux.id};`;

				console.log(query);
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}

}
MAIN();
