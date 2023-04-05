import { getCurrentWindow, getGlobal, dialog} from '@electron/remote'
import Main from '../main';

let main: Main = getGlobal('main');
console.log(main.myPass);

let buttonLogin = document.getElementById('buttonLogin') as HTMLButtonElement;
buttonLogin.addEventListener('click', () => {
	dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No existe el usuario ingresado", type: "error"});
	//getCurrentWindow().minimize();
});