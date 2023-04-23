import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query } from 'pg';

let main: Main = getGlobal('main');

let localAux = document.getElementById('localAux') as HTMLSpanElement;

// ONLY Modify mode
let templateDetail = (document.getElementById('templateDetail') as HTMLTemplateElement).content.querySelector('div');
let detailCointainer = (document.getElementById('detailCointainer') as HTMLDivElement);
let auxIDDetail: number = 0;

// Cancel
let buttonCancel = document.getElementsByClassName('buttonCancel') as HTMLCollectionOf<HTMLButtonElement>;
for (const button of buttonCancel) {

	button.addEventListener('click', (): void => {

		getCurrentWindow().close();
	});
}

async function MAIN(): Promise<void> {
	
	// Add new sale
	if (main.aux.action == 'a')
	{
		let idSale: number = (await main.querySQL(`SELECT MAX(ID_SALE) FROM SALE;`)).rows[0].max;
		idSale++;

		let idNewSale = document.getElementById('idNewSale') as HTMLInputElement;
		idNewSale.value = `${idSale}`;
		idNewSale.readOnly = true;

		// Show product section
		document.getElementById('section_product').style.display = 'block';

		let templateProduct = document.getElementById('templateProduct') as HTMLTemplateElement;
		let section_product = document.getElementById('section_product') as HTMLDivElement;
		let buttonSelectProduct = document.getElementById('buttonSelectProduct') as HTMLButtonElement;
		let buttonAddProduct = document.getElementById('buttonAddProduct') as HTMLButtonElement;
		let idProduct = document.getElementById('idProduct') as HTMLInputElement;
		let productList = document.getElementById('productList') as HTMLDivElement;
		let label_idProduct = document.getElementById('label_idProduct') as HTMLLabelElement;
		
		// Accept buttons
		let buttonAccept1 = document.getElementById('buttonAccept1') as HTMLButtonElement;
		let buttonAccept2 = document.getElementById('buttonAccept2') as HTMLButtonElement;
		let buttonAccept3 = document.getElementById('buttonAccept3') as HTMLButtonElement;

		// Total cost (number)
		let total: number = 0;

		// Shopping cart
		type ShoppingCart = {
			idProduct: number;
			amount: number;
		};
		let shoppingCart: ShoppingCart[] = [];

		idProduct.addEventListener('change', async (): Promise<void> => {

			try {
				let data = (await main.querySQL(`SELECT NAME FROM PRODUCT WHERE ID_PRODUCT = ${idProduct.value} AND NOT ID_PRODUCT = 0;`)).rows[0];
				label_idProduct.innerHTML = data.name + ', ID:';
				localAux.dataset.validProduct = '1';
			}
			catch (error: any){
				label_idProduct.innerHTML = 'Producto no encontrado';
				localAux.dataset.validProduct = '0';
			}
		});

		// Select product button
		buttonSelectProduct.addEventListener('click', (): void => {

			main.setProperty({...main.aux, column: 'product', canSelect: true}, 'aux');
			let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
			let code: string =
			`
			try
			{
				const remote_1 = require("@electron/remote");
				const main = (0, remote_1.getGlobal)('main');
				document.getElementById('idProduct').value = main.aux.return.id_product;
				document.getElementById('label_idProduct').innerHTML = main.aux.return.name + ', ID:';
				document.getElementById('localAux').dataset.validProduct = '1';
			}
			catch (error) {}
			`;
			queryWindow.setVar(code, 'codeCloseParent');

		});

		// Add product to list	
		buttonAddProduct.addEventListener('click', async (): Promise<void> => {

			if (localAux.dataset.validProduct == '0')
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Producto inválido", type: "error"});
				return;
			}

			// Check if it's already in the list
			let added: HTMLDivElement = null;
			let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
			for (const item of addedProducts) {

				if (item.querySelector('.productId').innerHTML == idProduct.value)
					added = item;
			}

			if (added)
			{
				// Increase amount in the input element
				let amount = added.querySelector('.amount') as HTMLInputElement;
				amount.value = (parseInt(amount.value) + 1).toString();
			}
			else
			{
				let productEntry: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${idProduct.value};`)).rows[0];
				let productInstance = <HTMLDivElement>(templateProduct).content.cloneNode(true);
				productInstance.querySelector('.productId').innerHTML = productEntry.id_product;
				productInstance.querySelector('.name').innerHTML = productEntry.name;
				productInstance.querySelector('.price').innerHTML = `$${productEntry.price}`;
				(productInstance.querySelector('.amount') as HTMLInputElement).value = '1';
	
				// Remove element from list event
				(productInstance.querySelector('.buttonDelete') as HTMLButtonElement).addEventListener('click', (event: any): void => {

					// Delete from DOM
					event.target.parentElement.remove()
				});
				productList.appendChild(productInstance);
			}

		});

		// Accept button1 (section_product -> section_total)
		buttonAccept1.addEventListener('click', async (): Promise<void> => {


			if ((document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>).length == 0)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Debe seleccionar almenos 1 producto", type: "error"});
				return;
			}

			// Get shopping cart
			shoppingCart = [];
			let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
			for (const p of addedProducts)
				shoppingCart.push({idProduct: parseInt(p.querySelector('.productId').innerHTML), amount: parseInt((p.querySelector('.amount') as HTMLInputElement).value)});
			
			// Validar stock / local_stock
			for (const i of shoppingCart)
			{
				let local_stock: number = 0;
				let temp: any[] = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE FK_STORE = ${main.credentials.idStore} AND FK_PRODUCT = ${i.idProduct};`)).rows;
				if (temp.length != 0)
					local_stock = temp[0].local_stock;

				if ((local_stock - i.amount) < 0)
				{
					let productname: string = (await main.querySQL(`SELECT NAME FROM PRODUCT WHERE ID_PRODUCT = ${i.idProduct};`)).rows[0].name;
					dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: `No existe stock suficiente del producto '${productname}'`, type: "error"});
					return;
				}
			}

			// Change section
			document.getElementById('section_product').style.display = 'none';
			document.getElementById('section_total').style.display = 'block';

			// Populate "section_total" with the actual shopping cart
			let section_total = document.getElementById('section_total');

			for (const p of shoppingCart) {

				let productEntry: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${p.idProduct};`)).rows[0];

				let i = document.createElement('div') as HTMLDivElement;

				let name = document.createElement('span') as HTMLSpanElement;
				name.innerHTML = productEntry.name;
				i.appendChild(name);
				
				let amount = document.createElement('span') as HTMLSpanElement;
				amount.innerHTML = `Cantidad: ${p.amount}`;
				i.appendChild(amount);

				let totalProduct = document.createElement('span') as HTMLSpanElement;
				totalProduct.innerHTML = `Costo: ${parseInt(productEntry.price) * p.amount}`;
				i.appendChild(totalProduct);
				
				section_total.querySelector('.products').appendChild(i);

				total += parseInt(productEntry.price) * p.amount;
			}

			section_total.querySelector('.total').innerHTML = `Total: $${total}`;
			console.log(shoppingCart);
		});

		// Accept button2 (section_total -> section_ticket)
		buttonAccept2.addEventListener('click', async (): Promise<void> => {

			// Register on DB!!

			//// SALE HEADER ////
			let query: string = `INSERT INTO SALE VALUES(${idSale}, ${main.credentials.idEmployee}, DEFAULT);`;
			console.log(query);
			main.querySQL(query);

			//// SALE DETAILS ////
			for (const p of shoppingCart) {

				let productEntry: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${p.idProduct};`)).rows[0];
				query = `INSERT INTO SALE_DETAIL VALUES((SELECT MAX(ID_SALE_DETAIL) FROM SALE_DETAIL) + 1, ${idSale}, ${p.idProduct}, ${p.amount}, ${productEntry.price});`;
				console.log(query);
				main.querySQL(query);

				// Decrease local stock
				let currentLocalStock: number = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE FK_STORE = ${main.credentials.idStore} AND FK_PRODUCT = ${p.idProduct};`)).rows[0].local_stock;
				if ((currentLocalStock - p.amount) == 0)
				{
					query = `DELETE FROM STORE_PRODUCT WHERE FK_STORE = ${main.credentials.idStore} AND FK_PRODUCT = ${p.idProduct};`;
				}
				else
				{
					query = `UPDATE STORE_PRODUCT SET LOCAL_STOCK = ${(currentLocalStock - p.amount)} WHERE FK_STORE = ${main.credentials.idStore} AND FK_PRODUCT = ${p.idProduct};`;
				}
				console.log(query);
				main.querySQL(query);

			}

			// Change section
			document.getElementById('section_total').style.display = 'none';
			document.getElementById('section_ticket').style.display = 'block';

			// Generate ticket
			let section_ticket = document.getElementById('section_ticket').querySelector('.ticket') as HTMLDivElement;

			let header = document.createElement('span') as HTMLSpanElement;
			header.innerHTML = 'ZOOLÓGICO DE GUADALAJARA';
			section_ticket.appendChild(header);

			let storeEntry: any = (await main.querySQL(`SELECT * FROM STORE WHERE id_store = ${main.credentials.idStore};`)).rows[0];
			let storeInfo = document.createElement('span') as HTMLSpanElement;
			storeInfo.innerHTML = `${storeEntry.type}, ubicado en: ${storeEntry.location}`;
			section_ticket.appendChild(storeInfo);

			let idSaleInfo = document.createElement('span') as HTMLSpanElement;
			idSaleInfo.innerHTML = `FOLIO: ${idSale}`;
			section_ticket.appendChild(idSaleInfo);

			let employeeEntry = (await main.querySQL(`SELECT first_name FROM EMPLOYEE WHERE id_employee = ${main.credentials.idEmployee};`)).rows[0];
			let dateEmployeeInfo = document.createElement('span') as HTMLSpanElement;
			const date = new Date();
			dateEmployeeInfo.innerHTML = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} Atendido por: ${employeeEntry.first_name}`;
			section_ticket.appendChild(dateEmployeeInfo);

			for (const p of shoppingCart) {

				let productEntry: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${p.idProduct};`)).rows[0];
				let item = document.createElement('span') as HTMLSpanElement;
				item.innerHTML = `${p.amount} X ${productEntry.name} ---------- ${productEntry.price * p.amount}`;
				section_ticket.appendChild(item);
			}

			let totalInfo = document.createElement('span') as HTMLSpanElement;
			totalInfo.innerHTML = `TOTAL: ${total}`;
			section_ticket.appendChild(totalInfo);

			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Venta exitosa", type: "info"});
		});

		// Accept button3 (section_ticket -> CLOSE_WINDOW)
		buttonAccept3.addEventListener('click', async (): Promise<void> => {

			getCurrentWindow().close();
		});
	}
	// Modify sale
	else if (main.aux.action == 'm')
	{
		await refreshSaleModifyInputs();
		
		
		let label_idEmployee = document.getElementById('label_idEmployee') as HTMLLabelElement;
		let idEmployee_input = document.getElementById('idEmployee') as HTMLButtonElement;

		let employeeName: string = (await main.querySQL(`SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${idEmployee_input.value} AND NOT ID_EMPLOYEE = 0;`)).rows[0].first_name;
		label_idEmployee.innerHTML = employeeName + ', ID:';

		idEmployee_input.addEventListener('change', async (): Promise<void> => {

			try {
				let data = (await main.querySQL(`SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${idEmployee_input.value} AND NOT ID_EMPLOYEE = 0;`)).rows[0];
				label_idEmployee.innerHTML = data.first_name + ', ID:';
				localAux.dataset.validEmployee = '1';
			}
			catch (error: any){
				label_idEmployee.innerHTML = 'Empleado no encontrado';
				localAux.dataset.validEmployee = '0';
			}
		});


		// Button add new product
		let buttonAddProductDetail = document.getElementById('buttonAddProductDetail') as HTMLButtonElement;
		buttonAddProductDetail.addEventListener('click', async (): Promise<void> => {

			console.log('adding');

			await addNewSaleDetail(0, 1, 0, auxIDDetail);
			auxIDDetail += 1;

		});

		// Button accept modify
		let buttonAcceptModify = document.getElementById('buttonAcceptModify') as HTMLButtonElement;
		buttonAcceptModify.addEventListener('click', async (): Promise<void> => {

			try {
				
				if (localAux.dataset.validEmployee == '0')
					throw {message: "Empleado inválido"};

				let details = document.getElementsByClassName('detail') as HTMLCollectionOf<HTMLDivElement>;
				for (const d of details)
					if (d.dataset.valid == '0')
						throw {message: "Producto inválido"};

				let query: string = ``;

				// Delete ALL old sale details
				query = `DELETE FROM SALE_DETAIL WHERE FK_SALE = ${main.aux.id};`;
				console.log(query);
				await main.querySQL(query);

				// Modify sale header
				let idEmployee: number = parseInt((document.getElementById('idEmployee') as HTMLInputElement).value);
				let newDate: string = (document.getElementById('date') as HTMLInputElement).value;

				query =
				`UPDATE SALE SET
				FK_EMPLOYEE = ${idEmployee}, DATE = '${newDate}'
				WHERE ID_SALE = ${main.aux.id};
				`;
				console.log(query);
				await main.querySQL(query);

				// Add ALL the new sale details
				for (const d of details) {

					query =
					`
						INSERT INTO SALE_DETAIL VALUES(
							(SELECT MAX(ID_SALE_DETAIL) FROM SALE_DETAIL) + 1,
							${main.aux.id},
							${parseInt((d.querySelector('.idProduct') as HTMLInputElement).value)},
							${parseInt((d.querySelector('.amount') as HTMLInputElement).value)},
							${parseFloat((d.querySelector('.cost') as HTMLInputElement).value)}
						);

					`;
					console.log(query);
					await main.querySQL(query);
				}

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

async function refreshSaleModifyInputs(): Promise<void> {

	// Show modify section
	document.getElementById('section_modify').style.display = 'block';

	let saleEntry = (await main.querySQL(`SELECT * FROM SALE WHERE id_sale = ${main.aux.id};`)).rows[0];

	// Set ID Sale
	(document.getElementById('idSale') as HTMLSpanElement).innerHTML = `ID Venta: ${main.aux.id}`;

	// Set ID Employee
	(document.getElementById('idEmployee') as HTMLInputElement).value = `${saleEntry.fk_employee}`;

	// Select employee button
	(document.getElementById('buttonEmployee') as HTMLButtonElement).addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'employee', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			const main = (0, remote_1.getGlobal)('main');
			document.getElementById('idEmployee').value = main.aux.return.id_employee;
			document.getElementById('label_idEmployee').innerHTML = main.aux.return.first_name + ', ID:';
			document.getElementById('localAux').dataset.validEmployee = '1';
		}
		catch (error) {}
		`;
		queryWindow.setVar(code, 'codeCloseParent');

	});

	// Set Date
	(document.getElementById('date') as HTMLInputElement).value = `${saleEntry.date.toISOString().split('T')[0]}`;

	// Clear old details elements
	
	while (detailCointainer.firstChild)
		document.removeChild(detailCointainer.firstChild);

	// Sale details
	let saleDetailEntry = (await main.querySQL(`SELECT * FROM SALE_DETAIL WHERE fk_sale = ${main.aux.id};`)).rows;

	auxIDDetail = 0;
	for (let i = 0; i < saleDetailEntry.length; i++) {
		
		await addNewSaleDetail(saleDetailEntry[i].fk_product, saleDetailEntry[i].amount, saleDetailEntry[i].cost, auxIDDetail);
		auxIDDetail += 1;
	}
}

async function addNewSaleDetail(id: number, amount: number, cost: number, elementId: number): Promise<void> {


	let detail: HTMLDivElement = document.importNode(templateDetail, true);
	detail.id = `detail_${elementId}`;

	(detail.querySelector('.idProduct') as HTMLInputElement).value = `${id}`;
	(detail.querySelector('.idProduct') as HTMLInputElement).addEventListener('change', async (): Promise<void> => {

		try {
			let data = (await main.querySQL(`SELECT NAME, ID_PRODUCT FROM PRODUCT WHERE ID_PRODUCT = ${(detail.querySelector('.idProduct') as HTMLInputElement).value} AND NOT ID_PRODUCT = 0;`)).rows[0];
			document.getElementById(`detail_${elementId}`).querySelector('.product_info').innerHTML = data.name;
			document.getElementById(`detail_${elementId}`).dataset.valid = '1';
		}
		catch (error: any){
			document.getElementById(`detail_${elementId}`).querySelector('.product_info').innerHTML = 'Producto no encontrado';
			document.getElementById(`detail_${elementId}`).dataset.valid = '0';
		}
	});

	if (id != 0)
	{
		let productInfo = (await main.querySQL(`SELECT NAME, ID_PRODUCT FROM PRODUCT WHERE ID_PRODUCT = ${id} AND NOT ID_PRODUCT = 0;`)).rows[0];
		detail.querySelector('.product_info').innerHTML = productInfo.name;
		detail.dataset.valid = '1';
	}

	(detail.querySelector('.amount') as HTMLInputElement).value = `${amount}`;
	(detail.querySelector('.cost') as HTMLInputElement).value = `${cost}`;
	(detail.querySelector('.buttonProduct') as HTMLButtonElement).addEventListener('click', (): void => {

		main.setProperty({...main.aux, column: 'product', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			const main = (0, remote_1.getGlobal)('main');
			document.getElementById('detail_${elementId}').querySelector('.idProduct').value = main.aux.return.id_product;
			document.getElementById('detail_${elementId}').querySelector('.product_info').innerHTML = main.aux.return.name;
			document.getElementById('detail_${elementId}').dataset.valid = '1';
		}
		catch (error) {}
		`;
		queryWindow.setVar(code, 'codeCloseParent');

	});

	(detail.querySelector('.buttonDelete') as HTMLButtonElement).addEventListener('click', (event: any): void => {

		// Delete from DOM
		event.target.parentElement.remove()
	});

	detailCointainer.appendChild(detail);
}
