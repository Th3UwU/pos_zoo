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

	let newAux = {...aux, selectEntryColumn: 'store', returnInputID: 'store'};
	main.setGlobal(newAux, 'aux');

	main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
	
});

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', async (): Promise<void> => {

	try {
		let user: any = (await main.querySQL(`SELECT * FROM EMPLOYEE WHERE id_employee = ${idUser.value};`)).rows[0];

		// Check empty inputs
		if ((idUser.value == "") || (pass.value == "") || (store.value == ""))
			throw {message: "No puede haber campos vacíos"};

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