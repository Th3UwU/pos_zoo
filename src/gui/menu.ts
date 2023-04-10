import { getCurrentWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');


let amButtons = document.getElementsByClassName('amButton') as HTMLCollectionOf<HTMLButtonElement>;
let selectEntryButtons = document.getElementsByClassName('selectEntry') as HTMLCollectionOf<HTMLButtonElement>;

async function MAIN(): Promise<void> {

	// AM Buttons
	for (const button of amButtons) {
		button.addEventListener('click', (): void => {

			let input = document.getElementById(button.dataset.column) as HTMLInputElement;

			main.setGlobal({action: button.dataset.action, id: ((button.dataset.action == 'a') ? ('-1') : (input.value))}, 'aux');

			main.createWindow(800, 600, 'gui/am_' + button.dataset.column + '.html', getCurrentWindow());
		});
	}

	// Select entry button
	for (const button of selectEntryButtons) {
		button.addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: button.dataset.inputDst, returnInputID: button.dataset.inputDst}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});
	}


}
MAIN();
