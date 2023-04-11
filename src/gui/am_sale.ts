import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query } from 'pg';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

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

			main.setGlobal({...aux, selectEntryColumn: 'product', returnInputID: 'idProduct'}, 'aux');
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
	}
}
MAIN();

async function refreshSaleModifyInputs(): Promise<void> {

	// Show modify section
	document.getElementById('section_modify').style.display = 'block';

	// Set ID Sale
	(document.getElementById('idSale') as HTMLSpanElement).innerHTML = `ID Venta: ${aux.id}`;

	// Select employee button
	(document.getElementById('buttonEmployee') as HTMLButtonElement).addEventListener('click', async (): Promise<void> => {

		main.setGlobal({...aux, selectEntryColumn: 'employee', returnInputID: 'idEmployee'}, 'aux');
		main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
	});

	// Clear old details elements
	let detailCointainer = (document.getElementById('detailCointainer') as HTMLDivElement);
	while (detailCointainer.firstChild)
		document.removeChild(detailCointainer.firstChild);

	// Sale details
	let templateDetail = (document.getElementById('templateDetail') as HTMLTemplateElement).content.querySelector('div');
	let saleDetailEntry = (await main.querySQL(`SELECT * FROM SALE_DETAIL WHERE fk_sale = ${aux.id};`)).rows;

	for (const d of saleDetailEntry) {

		let detail: HTMLDivElement = document.importNode(templateDetail, true);
		let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${d.fk_product};`)).rows[0];

		(detail.querySelector('.name') as HTMLSpanElement).innerHTML = `Producto: ${product.name}`;
		(detail.querySelector('.idProduct') as HTMLInputElement).value = `${d.fk_product}`;
		(detail.querySelector('.amount') as HTMLInputElement).value = `${d.amount}`;
		(detail.querySelector('.cost') as HTMLInputElement).value = `${d.cost}`;
		(detail.querySelector('.buttonProduct') as HTMLButtonElement).addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: 'employee', returnInputID: `detail.querySelector('.name')`}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});

		detailCointainer.appendChild(detail);
	}
}
