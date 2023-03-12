import { getCurrentWindow } from '@electron/remote'
import { alertMessage } from '../misc';

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', () => {
	alertMessage(getCurrentWindow(), {title: "Error", message: "No existe el usuario ingresado", type: "error"});
	//getCurrentWindow().minimize();
});