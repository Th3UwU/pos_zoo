import { getCurrentWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

async function MAIN(): Promise<void> {

	let selectEntryButtons = document.getElementsByClassName('selectEntry') as HTMLCollectionOf<HTMLButtonElement>;
	for (const button of selectEntryButtons) {
		button.addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: button.dataset.inputDst, returnInputID: button.dataset.inputDst}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});
	}
}
MAIN();
