import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

let name = document.getElementById('name') as HTMLInputElement;
let address = document.getElementById('address') as HTMLInputElement;
let tel = document.getElementById('tel') as HTMLInputElement;
let imagePath = document.getElementById('image') as HTMLInputElement;
let status = document.getElementById('status') as HTMLInputElement;

// Image preview
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

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;

buttonCancel.addEventListener('click', (): void => {

	getCurrentWindow().close();
});

async function MAIN(): Promise<void> {
	// Add new supplier
	if (aux.action == 'a')
	{
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
	}
	// Modify supplier
	else if (aux.action == 'm')
	{
		// Get entry to modify
		let supplier: any = (await main.querySQL(`SELECT * FROM SUPPLIER WHERE id_supplier = ${aux.id};`)).rows[0];

		// Populate inputs with existing info
		name.value = supplier.name;
		address.value = supplier.address;
		tel.value = supplier.tel;
		
		if (supplier.image) {
			
			imagePreview.src = URL.createObjectURL(new Blob([supplier.image.buffer], {type: "image/png"}));
			imagePreview.style.display = 'block';
		}
		
		status.checked = supplier.status;

		// Button event
		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try {
				
				let imageRaw: string = null;
				if (imagePath.value != "")
					imageRaw = readFileSync(imagePath.value, null).toString('base64');

				let query =
				`UPDATE SUPPLIER SET
				name = '${name.value}', address = '${address.value}',
				tel = '${tel.value}', status = '${status.checked}'`
				+ ((imageRaw) ? (`, image = (DECODE('${imageRaw}', 'base64')) WHERE id_supplier = ${aux.id};`) : (` WHERE id_supplier = ${aux.id};`));				

				console.log(query);
				await main.querySQL(query);
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}
}
MAIN();
