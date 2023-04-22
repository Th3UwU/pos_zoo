import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');

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
let id_employee = document.getElementById('id_employee') as HTMLInputElement;
let pass = document.getElementById('pass') as HTMLInputElement;
let curp = document.getElementById('curp') as HTMLInputElement;
let firstName = document.getElementById('first_name') as HTMLInputElement;
let lastName = document.getElementById('last_name') as HTMLInputElement;
let address = document.getElementById('address') as HTMLInputElement;
let nss = document.getElementById('nss') as HTMLInputElement;
let role = document.getElementById('role') as HTMLSelectElement;
let status = document.getElementById('status') as HTMLInputElement;

// Employee roles
const roles: string[] = [
	'ventas',
	'gerente de ventas',
	'almacen',
	'gerente de almacen',
];

for (const r of roles) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = r;
	option.text = r;
	role.add(option);
}

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;

buttonCancel.addEventListener('click', (): void => {

	getCurrentWindow().close();
});

async function MAIN(): Promise<void> {

	id_employee.readOnly = true;
	
	// Add new employee
	if (main.aux.action == 'a')
	{
		// Get 'new id'
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_EMPLOYEE) FROM EMPLOYEE`)).rows[0].max;
		new_id++;

		// Set 'new id' in the input field
		id_employee.value = `${new_id}`;

		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try {

				let CVRaw: string = null;
				if (CVPath.value)
					CVRaw = readFileSync(CVPath.value, null).toString('base64');

				let query: string = `INSERT INTO EMPLOYEE VALUES(new_id,
				'${pass.value}', '${curp.value}', '${firstName.value}', '${lastName.value}',
				'${address.value}', '${nss.value}', '${role.value}', `
				+ ((CVRaw) ? (`(DECODE('${CVRaw}', 'base64')), DEFAULT);`) : (`DEFAULT, DEFAULT);`));
				
				console.log(query);
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});

		// CV Preview
		buttonCVPreview.addEventListener('click', (): void => {

			if (CVPath.value != "") {
				let newAux = {...main.aux, url: CVPath.value};
				main.setGlobal(newAux, 'aux');
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else {
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No hay archivo", type: "error"});
			}
		});
	}
	// Modify employee
	else if (main.aux.action == 'm')
	{
		// Get entry to modify
		let employee: any = (await main.querySQL(`SELECT * FROM EMPLOYEE WHERE id_employee = ${main.aux.id};`)).rows[0];

		// Populate inputs with existing info
		id_employee.value = employee.id_employee;
		pass.value = employee.pass;
		curp.value = employee.curp;
		firstName.value = employee.first_name;
		lastName.value = employee.last_name;
		address.value = employee.address;
		nss.value = employee.nss;

		for (let i = 0; i < roles.length; i++)
			if (roles[i] == employee.role) role.selectedIndex = i;

		// CV Preview
		buttonCVPreview.addEventListener('click', (): void => {

			if (CVPath.value != "") {
				let newAux = {...main.aux, url: CVPath.value};
				main.setGlobal(newAux, 'aux');
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else if (employee.cv) {
				let pdfFileUrl = URL.createObjectURL(new Blob([employee.cv.buffer], {type: 'application/pdf'}));

				let newAux = {...main.aux, url: pdfFileUrl};
				main.setGlobal(newAux, 'aux');
				main.createWindow(800, 600, 'gui/pdf_viewer.html', getCurrentWindow());
			}
			else {
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No hay archivo", type: "error"});
			}
		});

		status.checked = employee.status;

		// Button event
		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try {
				let CVRaw: string = null;
				if (CVPath.value != "")
					CVRaw = readFileSync(CVPath.value, null).toString('base64');

				let query =
				`UPDATE EMPLOYEE SET
				pass = '${pass.value}', curp = '${curp.value}', first_name = '${firstName.value}',
				last_name = '${lastName.value}', address = '${address.value}', nss = '${nss.value}',
				role = '${role.value}', status = '${status.checked}'`
				+ ((CVRaw) ? (`, cv = (DECODE('${CVRaw}', 'base64')) WHERE id_employee = ${main.aux.id};`) : (` WHERE id_employee = ${main.aux.id};`));

				console.log(query);
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}
}
MAIN();
