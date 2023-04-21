import { getCurrentWindow, getGlobal, dialog} from '@electron/remote'
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

let idUser = document.getElementById('idUser') as HTMLInputElement;
let pass = document.getElementById('pass') as HTMLInputElement;
let store = document.getElementById('store') as HTMLInputElement;

// Button supplier
let buttonStore = document.getElementById('buttonStore') as HTMLButtonElement;
buttonStore.addEventListener('click', () => {

	let newAux = {...aux, selectEntryColumn: 'store', returnInput: `document.getElementById('store')`};
	main.setGlobal(newAux, 'aux');

	// Set aux target
	main.setProperty({...main.aux, column: 'store', canSelect: true}, 'aux');

	// Create query window
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

	// Code to set 'id' and 'employee name' at close window
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('store').value = main.aux.return.id_store;
		document.getElementById('storeName').innerHTML = main.aux.return.location;
	}
	catch (error)
	{
		document.getElementById('store').value = main.aux.return.id_store;
		document.getElementById('storeName').innerHTML = main.aux.return.location;
	}
	`;

	queryWindow.setVar(code, 'codeCloseParent');
	
});

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', async (): Promise<void> => {

	try {

		// Check empty inputs
		if ((idUser.value == "") || (pass.value == "") || (store.value == ""))
			throw {message: "No puede haber campos vacíos"};

		let user: any = (await main.querySQL(`SELECT * FROM EMPLOYEE WHERE id_employee = ${idUser.value} AND NOT id_employee = 0;`)).rows[0];

		// Check user
		if (!user)
			throw {message: "Usuario no existente"};

		// Check password
		if (user.pass != pass.value)
			throw {message: "La contraseña es incorrecta"};

		// Set credentials
		main.setProperty({idEmployee: user.id_employee, role: user.role, idStore: parseInt(store.value)}, 'credentials');

		// Open menu window and close this window
		main.createWindow(1280, 720, 'gui/menu.html', null);
		getCurrentWindow().close();
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}

	//dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No existe el usuario ingresado", type: "error"});
	//getCurrentWindow().minimize();
});