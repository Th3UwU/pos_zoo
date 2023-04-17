import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query } from 'pg';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

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
	if (aux.action == 'a')
	{
		// Show product section
		document.getElementById('section_product').style.display = 'block';

		let templateProduct = document.getElementById('templateProduct') as HTMLTemplateElement;
		let section_product = document.getElementById('section_product') as HTMLDivElement;
		let buttonSelectProduct = document.getElementById('buttonSelectProduct') as HTMLButtonElement;
		let buttonAddProduct = document.getElementById('buttonAddProduct') as HTMLButtonElement;
		let idProduct = document.getElementById('idProduct') as HTMLInputElement;
		let productList = document.getElementById('productList') as HTMLDivElement;
		
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

		// Select product button
		buttonSelectProduct.addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: 'product', returnInput: `document.getElementById('idProduct')`}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});

		// Add product to list	
		buttonAddProduct.addEventListener('click', async (): Promise<void> => {

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

			// Get shopping cart
			let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
			for (const p of addedProducts) {

				shoppingCart.push({idProduct: parseInt(p.querySelector('.productId').innerHTML), amount: parseInt((p.querySelector('.amount') as HTMLInputElement).value)});
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
			let idSale: number = (await main.querySQL(`SELECT MAX(ID_SALE) FROM SALE;`)).rows[0].max;
			idSale++;

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
	else if (aux.action == 'm')
	{
		await refreshSaleModifyInputs();

		// Button add new product
		let buttonAddProductDetail = document.getElementById('buttonAddProductDetail') as HTMLButtonElement;
		buttonAddProductDetail.addEventListener('click', (): void => {

			console.log('adding');

			addNewSaleDetail(0, 1, 0, auxIDDetail);
			auxIDDetail += 1;

		});

		// Button accept modify
		let buttonAcceptModify = document.getElementById('buttonAcceptModify') as HTMLButtonElement;
		buttonAcceptModify.addEventListener('click', async (): Promise<void> => {

			try {

				let query: string = ``;

				// Delete ALL old sale details
				query = `DELETE FROM SALE_DETAIL WHERE FK_SALE = ${aux.id};`;
				console.log(query);
				await main.querySQL(query);

				// Modify sale header
				let idEmployee: number = parseInt((document.getElementById('idEmployee') as HTMLInputElement).value);
				let newDate: string = (document.getElementById('date') as HTMLInputElement).value;

				query =
				`UPDATE SALE SET
				FK_EMPLOYEE = ${idEmployee}, DATE = '${newDate}'
				WHERE ID_SALE = ${aux.id};
				`;
				console.log(query);
				await main.querySQL(query);

				// Add ALL the new sale details
				let details = (document.getElementsByClassName('detail') as HTMLCollectionOf<HTMLDivElement>);
				for (const d of details) {

					query =
					`
						INSERT INTO SALE_DETAIL VALUES(
							(SELECT MAX(ID_SALE_DETAIL) FROM SALE_DETAIL) + 1,
							${aux.id},
							${parseInt((d.querySelector('.idProduct') as HTMLInputElement).value)},
							${parseInt((d.querySelector('.amount') as HTMLInputElement).value)},
							${parseFloat((d.querySelector('.cost') as HTMLInputElement).value)}
						);

					`;
					console.log(query);
					await main.querySQL(query);
					dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
					getCurrentWindow().close();
				}

				
		
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

	let saleEntry = (await main.querySQL(`SELECT * FROM SALE WHERE id_sale = ${aux.id};`)).rows[0];

	// Set ID Sale
	(document.getElementById('idSale') as HTMLSpanElement).innerHTML = `ID Venta: ${aux.id}`;

	// Set ID Employee
	(document.getElementById('idEmployee') as HTMLInputElement).value = `${saleEntry.fk_employee}`;

	// Select employee button
	(document.getElementById('buttonEmployee') as HTMLButtonElement).addEventListener('click', async (): Promise<void> => {

		main.setGlobal({...aux, selectEntryColumn: 'employee', returnInput: `document.getElementById('idEmployee')`}, 'aux');
		main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
	});

	// Set Date
	(document.getElementById('date') as HTMLInputElement).value = `${saleEntry.date.toISOString().split('T')[0]}`;

	// Clear old details elements
	
	while (detailCointainer.firstChild)
		document.removeChild(detailCointainer.firstChild);

	// Sale details
	let saleDetailEntry = (await main.querySQL(`SELECT * FROM SALE_DETAIL WHERE fk_sale = ${aux.id};`)).rows;

	auxIDDetail = 0;
	for (let i = 0; i < saleDetailEntry.length; i++) {
		
		addNewSaleDetail(saleDetailEntry[i].fk_product, saleDetailEntry[i].amount, saleDetailEntry[i].cost, auxIDDetail);
		auxIDDetail += 1;
	}
}

function addNewSaleDetail(id: number, amount: number, cost: number, elementId: number): void {


	let detail: HTMLDivElement = document.importNode(templateDetail, true);
	detail.id = `detail_${elementId}`;

	(detail.querySelector('.idProduct') as HTMLInputElement).value = `${id}`;
	(detail.querySelector('.amount') as HTMLInputElement).value = `${amount}`;
	(detail.querySelector('.cost') as HTMLInputElement).value = `${cost}`;
	(detail.querySelector('.buttonProduct') as HTMLButtonElement).addEventListener('click', (): void => {

		main.setGlobal({...aux, selectEntryColumn: 'product', returnInput: `document.getElementById('detail_${elementId}').querySelector('.idProduct')`}, 'aux');
		main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());

	});

	(detail.querySelector('.buttonDelete') as HTMLButtonElement).addEventListener('click', (event: any): void => {

		// Delete from DOM
		event.target.parentElement.remove()
	});

	detailCointainer.appendChild(detail);
}
