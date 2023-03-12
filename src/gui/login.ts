import { getCurrentWindow, getGlobal } from '@electron/remote'
import { alertMessage } from '../misc';
import Main from '../main';

let main: Main = getGlobal('main');
console.log(main.myPass);

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', () => {
	alertMessage(getCurrentWindow(), {title: "Error", message: "No existe el usuario ingresado", type: "error"});
	//getCurrentWindow().minimize();
});