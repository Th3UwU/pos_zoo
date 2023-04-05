import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');

let name = document.getElementById('name') as HTMLInputElement;
let address = document.getElementById('address') as HTMLInputElement;
let tel = document.getElementById('tel') as HTMLInputElement;
//let status = document.getElementById('status') as HTMLInputElement;

// Image
let imagePath = document.getElementById('image') as HTMLInputElement;
let buttonImage = document.getElementById('buttonImage') as HTMLButtonElement;
let imagePreview = document.getElementById('imagePreview') as HTMLImageElement;

const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir imagen', properties: ['openFile']};

buttonImage.addEventListener('click', () => {
	let dialogResult: string[] = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

	if (dialogResult != undefined)
	{
		imagePath.value = dialogResult[0];

		imagePreview.src = dialogResult[0];
		imagePreview.style.display = 'block';
	}
});

// Add new supplier
let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
buttonAccept.addEventListener('click', async (): Promise<void> => {

	try {
		let imageRaw: string = readFileSync(imagePath.value, null).toString('base64');
		let query: string = `INSERT INTO SUPPLIER VALUES((SELECT MAX(ID_SUPPLIER) FROM SUPPLIER) + 1, '${name.value}', '${address.value}', ${tel.value}, (DECODE('${imageRaw}', 'base64')), DEFAULT);`;
		console.log(query);
		await main.querySQL(query);

	} catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}

});