import { getCurrentWindow, getGlobal, dialog} from '@electron/remote'
import Main from '../main';

let main: Main = getGlobal('main');

let idUser = document.getElementById('idUser') as HTMLInputElement;
let pass = document.getElementById('pass') as HTMLInputElement;

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', async (): Promise<void> => {

	try {
		let user = (await main.querySQL(`SELECT * FROM EMPLOYEE WHERE id_employee = ${idUser.value}`))[0];
		if (user.pass != pass.value) {
			throw "La contraseña es incorrecta";
		}
		
		//main.credentials.employeeType = user.type

	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}

	//dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No existe el usuario ingresado", type: "error"});
	//getCurrentWindow().minimize();
});