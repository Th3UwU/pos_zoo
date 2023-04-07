import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

// Select CV
const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir CV', properties: ['openFile']};

let CVPath = document.getElementById('cv') as HTMLInputElement;
let buttonCV = document.getElementById('buttonCV') as HTMLButtonElement;
let buttonCVPreview = document.getElementById('buttonCVPreview') as HTMLButtonElement;
let dialogResult: string[] = undefined;

buttonCV.addEventListener('click', () => {
	dialogResult = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

	if (dialogResult != undefined)
		CVPath.value = dialogResult[0];
});

// Add new employee
let pass = document.getElementById('pass') as HTMLInputElement;
let curp = document.getElementById('curp') as HTMLInputElement;
let firstName = document.getElementById('first_name') as HTMLInputElement;
let lastName = document.getElementById('last_name') as HTMLInputElement;
let address = document.getElementById('address') as HTMLInputElement;
let nss = document.getElementById('nss') as HTMLInputElement;
let status = document.getElementById('status') as HTMLInputElement;

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;

async function MAIN(): Promise<void> {
	
	// Add new employee
	if (aux.action == 'a')
	{
		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try {
				let CVRaw: string = readFileSync(CVPath.value, null).toString('base64');
				let query: string = `INSERT INTO EMPLOYEE VALUES((SELECT MAX(ID_EMPLOYEE) FROM EMPLOYEE) + 1,
				'${pass.value}', '${curp.value}', '${firstName.value}', '${lastName.value}',
				'${address.value}', '${nss.value}', (DECODE('${CVRaw}', 'base64')), DEFAULT);`;
				console.log(query);
				await main.querySQL(query);
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});

		// CV Preview
		buttonCVPreview.addEventListener('click', (): void => {

			if (CVPath.value != "") {
				let newAux = {...aux, url: CVPath.value};
				main.setAux(newAux);
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else {
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No hay archivo", type: "error"});
			}
		});
	}
	// Modify employee
	else if (aux.action == 'm')
	{
		// Get entry to modify
		let employee: any = (await main.querySQL(`SELECT * FROM EMPLOYEE WHERE id_employee = ${aux.id};`)).rows[0];

		// Populate inputs with existing info
		pass.value = employee.pass;
		curp.value = employee.curp;
		firstName.value = employee.first_name;
		lastName.value = employee.last_name;
		address.value = employee.address;
		nss.value = employee.nss;

		// CV Preview
		buttonCVPreview.addEventListener('click', (): void => {

			if (CVPath.value != "") {
				let newAux = {...aux, url: CVPath.value};
				main.setAux(newAux);
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else if (employee.cv) {
				let pdfFileUrl = URL.createObjectURL(new Blob([employee.cv.buffer], {type: 'application/pdf'}));

				let newAux = {...aux, url: pdfFileUrl};
				main.setAux(newAux);
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else {
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No hay archivo", type: "error"});
			}
		});

		status.checked = employee.status;

	}
}
MAIN();
