import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query, QueryResult } from 'pg';

let main: Main = getGlobal('main');

// General
let section_sale = document.getElementById('section_sale') as HTMLDivElement;
let section_order = document.getElementById('section_order') as HTMLDivElement;
let section_purchase = document.getElementById('section_purchase') as HTMLDivElement;
let section_employee = document.getElementById('section_employee') as HTMLDivElement;
let section_product = document.getElementById('section_product') as HTMLDivElement;
let section_store = document.getElementById('section_sale') as HTMLDivElement;

let button_sale = document.getElementById('button_sale') as HTMLButtonElement;
let button_order = document.getElementById('button_order') as HTMLButtonElement;
let button_purchase = document.getElementById('button_purchase') as HTMLButtonElement;
let button_employee = document.getElementById('button_employee') as HTMLButtonElement;
let button_product = document.getElementById('button_product') as HTMLButtonElement;
let button_store = document.getElementById('button_store') as HTMLButtonElement;

let section_menu = document.getElementsByClassName('section_menu') as HTMLCollectionOf<HTMLDivElement>;
// Hide all sub-menus
function hideSubmenus()
{
	for (const s of section_menu)
		s.style.display = 'none';
}
hideSubmenus();

button_sale.addEventListener('click', (): void => {hideSubmenus(); section_sale.style.display = 'block';});
button_order.addEventListener('click', (): void => {hideSubmenus(); section_order.style.display = 'block';});
button_purchase.addEventListener('click', (): void => {hideSubmenus(); section_purchase.style.display = 'block';});
button_employee.addEventListener('click', (): void => {hideSubmenus(); section_employee.style.display = 'block';});
button_product.addEventListener('click', (): void => {hideSubmenus(); section_product.style.display = 'block';});
button_store.addEventListener('click', (): void => {hideSubmenus(); section_store.style.display = 'block';});

// Employee
let employee = document.getElementById('employee') as HTMLInputElement;
let label_employee = document.getElementById('label_employee') as HTMLLabelElement;

employee.addEventListener('change', async (): Promise<void> => {

	try {
		let data = (await main.querySQL(`SELECT FIRST_NAME, LAST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${employee.value} AND NOT ID_EMPLOYEE = 0;`)).rows[0];
		label_employee.innerHTML =  data.first_name + ' ' + data.last_name + ', ID:';
		section_employee.dataset.valid = '1';
	}
	catch (error: any){
		label_employee.innerHTML = 'Empleado no encontrado';
		section_employee.dataset.valid = '0';
	}
});

let button_add_employee = document.getElementById('button_add_employee') as HTMLButtonElement;
button_add_employee.addEventListener('click', (): void => {
	main.setProperty({action: 'a', id: '-1'}, 'aux');
	main.createWindow(800, 600, 'gui/am_employee.html', getCurrentWindow());
});

let button_modify_employee = document.getElementById('button_modify_employee') as HTMLButtonElement;
button_modify_employee.addEventListener('click', (): void => {

	try {
		if (section_employee.dataset.valid == '0')
			throw {message: "El empleado seleccionado no es válido"};

		main.setProperty({action: 'm', id: employee.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_employee.html', getCurrentWindow());
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});

let button_select_employee = document.getElementById('button_select_employee') as HTMLButtonElement;
button_select_employee.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'employee', canSelect: true}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('employee').value = main.aux.return.id_employee;
		document.getElementById('label_employee').innerHTML = main.aux.return.first_name + ' ' + main.aux.return.last_name + ', ID:';
		document.getElementById('section_employee').dataset.valid = '1';
	}
	catch (error) {}
	`;
	queryWindow.setVar(code, 'codeCloseParent');
});


