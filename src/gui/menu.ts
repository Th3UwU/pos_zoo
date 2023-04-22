import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query, QueryResult } from 'pg';

let main: Main = getGlobal('main');

// General
let section_sale = document.getElementById('section_sale') as HTMLDivElement;
let section_order = document.getElementById('section_order') as HTMLDivElement;
let section_purchase = document.getElementById('section_purchase') as HTMLDivElement;
let section_return = document.getElementById('section_return') as HTMLDivElement;
let section_employee = document.getElementById('section_employee') as HTMLDivElement;
let section_product = document.getElementById('section_product') as HTMLDivElement;
let section_store = document.getElementById('section_store') as HTMLDivElement;

let button_sale = document.getElementById('button_sale') as HTMLButtonElement;
let button_order = document.getElementById('button_order') as HTMLButtonElement;
let button_purchase = document.getElementById('button_purchase') as HTMLButtonElement;
let button_return = document.getElementById('button_return') as HTMLButtonElement;
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
button_return.addEventListener('click', (): void => {hideSubmenus(); section_return.style.display = 'block';});
button_employee.addEventListener('click', (): void => {hideSubmenus(); section_employee.style.display = 'block';});
button_product.addEventListener('click', (): void => {hideSubmenus(); section_product.style.display = 'block';});
button_store.addEventListener('click', (): void => {hideSubmenus(); section_store.style.display = 'block';});

/***** Order *****/
let order = document.getElementById('order') as HTMLInputElement;
let label_order = document.getElementById('label_order') as HTMLLabelElement;

order.addEventListener('change', async (): Promise<void> => {

	try {
		let data = (await main.querySQL(`SELECT DATE, FK_STORE, STATUS FROM PRODUCT_ORDER WHERE ID_PRODUCT_ORDER = ${order.value} AND NOT ID_PRODUCT_ORDER = 0;`)).rows;

		if (data.length == 0)
			throw "Pedido no encontrado";

		if (data[0].status == 'c')
			throw "No puede editar un pedido cancelado";

		if (data[0].status == 'e')
			throw "No puede editar un pedido ya entregado";

		label_order.innerHTML =  `Local: ${data[0].fk_store}, ` + (data[0].date as Date).toISOString().substring(0, 10) + ', ID:';
		section_order.dataset.valid = '1';
	}
	catch (error: any){
		label_order.innerHTML = error;
		section_order.dataset.valid = '0';
	}
});

let button_add_order = document.getElementById('button_add_order') as HTMLButtonElement;
button_add_order.addEventListener('click', (): void => {
	main.setProperty({action: 'a', id: '-1'}, 'aux');
	main.createWindow(800, 600, 'gui/am_order.html', getCurrentWindow());
});

let button_modify_order = document.getElementById('button_modify_order') as HTMLButtonElement;
button_modify_order.addEventListener('click', (): void => {

	try {
		if (section_order.dataset.valid == '0')
			throw {message: "El pedido seleccionado no es válido"};

		main.setProperty({action: 'm', id: order.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_order.html', getCurrentWindow());
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});

let button_select_order = document.getElementById('button_select_order') as HTMLButtonElement;
button_select_order.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'product_order_p', canSelect: true}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('order').value = main.aux.return.id_product_order;
		document.getElementById('label_order').innerHTML = 'Local: ' + main.aux.return.fk_store + ', ' + main.aux.return.date.toISOString().substring(0, 10) + ', ID:';
		document.getElementById('section_order').dataset.valid = '1';
	}
	catch (error) {}
	`;
	queryWindow.setVar(code, 'codeCloseParent');
});

let button_query_order_p = document.getElementById('button_query_order_p') as HTMLButtonElement;
button_query_order_p.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'product_order_p', canSelect: false}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
});

let button_query_order = document.getElementById('button_query_order') as HTMLButtonElement;
button_query_order.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'product_order', canSelect: false}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
});


/***** Employee *****/
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

let button_query_employee = document.getElementById('button_query_employee') as HTMLButtonElement;
button_query_employee.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'employee', canSelect: false}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
});

/***** Product *****/
let product = document.getElementById('product') as HTMLInputElement;
let label_product = document.getElementById('label_product') as HTMLLabelElement;

product.addEventListener('change', async (): Promise<void> => {

	try {
		let data = (await main.querySQL(`SELECT NAME FROM PRODUCT WHERE ID_PRODUCT = ${product.value} AND NOT ID_PRODUCT = 0;`)).rows[0];
		label_product.innerHTML =  data.name + ', ID:';
		section_product.dataset.valid = '1';
	}
	catch (error: any){
		label_product.innerHTML = 'Producto no encontrado';
		section_product.dataset.valid = '0';
	}
});

let button_add_product = document.getElementById('button_add_product') as HTMLButtonElement;
button_add_product.addEventListener('click', (): void => {
	main.setProperty({action: 'a', id: '-1'}, 'aux');
	main.createWindow(800, 600, 'gui/am_product.html', getCurrentWindow());
});

let button_modify_product = document.getElementById('button_modify_product') as HTMLButtonElement;
button_modify_product.addEventListener('click', (): void => {

	try {
		if (section_product.dataset.valid == '0')
			throw {message: "El producto seleccionado no es válido"};

		main.setProperty({action: 'm', id: product.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_product.html', getCurrentWindow());
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});

let button_select_product = document.getElementById('button_select_product') as HTMLButtonElement;
button_select_product.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'product', canSelect: true}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('product').value = main.aux.return.id_product;
		document.getElementById('label_product').innerHTML = main.aux.return.name + ', ID:';
		document.getElementById('section_product').dataset.valid = '1';
	}
	catch (error) {}
	`;
	queryWindow.setVar(code, 'codeCloseParent');
});

let button_query_product = document.getElementById('button_query_product') as HTMLButtonElement;
button_query_product.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'product', canSelect: false}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
});


/***** Store *****/
let store = document.getElementById('store') as HTMLInputElement;
let label_store = document.getElementById('label_store') as HTMLLabelElement;

store.addEventListener('change', async (): Promise<void> => {

	try {
		let data = (await main.querySQL(`SELECT LOCATION, TYPE FROM STORE WHERE ID_STORE = ${store.value} AND NOT ID_STORE = 0;`)).rows[0];
		label_store.innerHTML =  data.name + ', ID:';
		section_store.dataset.valid = '1';
	}
	catch (error: any){
		label_store.innerHTML = 'Local no encontrado';
		section_store.dataset.valid = '0';
	}
});

let button_add_store = document.getElementById('button_add_store') as HTMLButtonElement;
button_add_store.addEventListener('click', (): void => {
	main.setProperty({action: 'a', id: '-1'}, 'aux');
	main.createWindow(800, 600, 'gui/am_store.html', getCurrentWindow());
});

let button_modify_store = document.getElementById('button_modify_store') as HTMLButtonElement;
button_modify_store.addEventListener('click', (): void => {

	try {
		if (section_store.dataset.valid == '0')
			throw {message: "El local seleccionado no es válido"};

		main.setProperty({action: 'm', id: store.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_store.html', getCurrentWindow());
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});

let button_select_store = document.getElementById('button_select_store') as HTMLButtonElement;
button_select_store.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'store', canSelect: true}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('store').value = main.aux.return.id_store;
		document.getElementById('label_store').innerHTML = main.aux.return.location + ' - ' + main.aux.return.type + ', ID:';
		document.getElementById('section_store').dataset.valid = '1';
	}
	catch (error) {}
	`;
	queryWindow.setVar(code, 'codeCloseParent');
});

let button_query_store = document.getElementById('button_query_store') as HTMLButtonElement;
button_query_store.addEventListener('click', (): void => {
	main.setProperty({...main.aux, column: 'store', canSelect: false}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
});


