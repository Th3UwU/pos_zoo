import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');
let localAux = document.getElementById('localAux') as HTMLSpanElement;

let label_idProduct = document.getElementById('label_idProduct') as HTMLLabelElement;
let idProduct = document.getElementById('idProduct') as HTMLInputElement;
let buttonSelectProduct = document.getElementById('buttonSelectProduct') as HTMLButtonElement;
let buttonAddProduct = document.getElementById('buttonAddProduct') as HTMLButtonElement;

let idOrder = document.getElementById('idOrder') as HTMLInputElement;
let headerInfo = document.getElementById('headerInfo') as HTMLSpanElement;

let templateProduct: HTMLDivElement = (document.getElementById('templateProduct') as HTMLTemplateElement).content.querySelector('div');
let product_list = document.getElementById('product_list') as HTMLDivElement;

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

buttonAddProduct.addEventListener('click', async (): Promise<void> =>
{
	try {
		if (localAux.dataset.validProduct == '0')
			throw {message: "Producto seleccionado no valido"};

		// Check if it's already in the list
		let added: HTMLDivElement = null;
		let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
		for (const item of addedProducts) {
			if (item.dataset.idProduct == idProduct.value)
				{added = item; break;}
		}

		if (added)
		{
			let amount = added.querySelector('.amount') as HTMLInputElement;
			amount.value = (parseInt(amount.value) + 1).toString();
		}
		else
			addDetail(parseInt(idProduct.value), 1);


	} catch (error: any) {
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});


let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;
buttonCancel.addEventListener('click', (): void => {
	getCurrentWindow().close();
});

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
async function MAIN(): Promise<void>
{
	idOrder.readOnly = true;

	if (main.aux.action == 'a')
	{
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_PRODUCT_ORDER) FROM PRODUCT_ORDER`)).rows[0].max;
		new_id++;
		idOrder.value = `${new_id}`;
		
		let idStore: number = main.credentials.idStore;
		let idEmployee: number = main.credentials.idEmployee;

		let employeeName: string = (await main.querySQL(`SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${idEmployee};`)).rows[0].first_name;
		let storeInfo = (await main.querySQL(`SELECT * FROM STORE WHERE ID_STORE = ${idStore};`)).rows[0];
		headerInfo.innerHTML = `ID Empleado: ${idEmployee} (${employeeName}), ID Local: ${idStore} (${storeInfo.location} - ${storeInfo.type})`;

		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try
			{
		
				let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
				if (addedProducts.length == 0)
					throw {message: "Seleccione por lo menos 1 producto"};

				// Check stock and local_limit
				let localStoreProducts = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE FK_STORE = ${idStore};`)).rows;

				for (const ap of addedProducts)
				{
					let productInfo = (await main.querySQL(`SELECT NAME, STOCK, LOCAL_LIMIT FROM PRODUCT WHERE ID_PRODUCT = ${ap.dataset.idProduct}`)).rows[0];
					let desiredAmount: number = parseInt((ap.querySelector('.amount') as HTMLInputElement).value);

					// Calcular el stock local actual
					let currentLocalStock: number = 0;
					for (const lsp of localStoreProducts)
					{
						if (lsp.fk_product == ap.dataset.idProduct)
							currentLocalStock = parseInt(lsp.local_stock);
					}
					
					// Comprobar
					if ((currentLocalStock + desiredAmount) > parseInt(productInfo.local_limit))
						throw {message: `La cantidad seleccionada de '${productInfo.name}' excede el limite de stock por local!!`};

					if (desiredAmount > parseInt(productInfo.stock))
						throw {message: `El almacén no cuenta con suficiente stock de '${productInfo.name}'!!`};
				}

				// Query
				await main.querySQL(`INSERT INTO PRODUCT_ORDER VALUES(${new_id}, ${idEmployee}, ${idStore}, DEFAULT, DEFAULT);`);
				for (const ap of addedProducts)
					await main.querySQL(`INSERT INTO PRODUCT_ORDER_DETAIL VALUES(
					(SELECT MAX(ID_PRODUCT_ORDER_DETAIL) FROM PRODUCT_ORDER_DETAIL) + 1,
					${new_id}, ${ap.dataset.idProduct}, ${(ap.querySelector('.amount') as HTMLInputElement).value});`);
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});		
			}
		});
	}
	else if (main.aux.action == 'm')
	{

	}
}
MAIN();

async function addDetail(idp: number, amount: number): Promise<void>
{
	let productInfo = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${idp}`)).rows[0];
	let productInstance = document.importNode(templateProduct, true);
	
	productInstance.dataset.idProduct = `${productInfo.id_product}`;
	productInstance.querySelector('.productId').innerHTML = `ID: ${productInfo.id_product}`;
	productInstance.querySelector('.name').innerHTML = `Nombre: ${productInfo.name}`;
	productInstance.querySelector('.stock').innerHTML = `Stock: ${productInfo.stock}`;
	productInstance.querySelector('.local_stock').innerHTML = `Limite local: ${productInfo.local_limit}`;
	(productInstance.querySelector('.amount') as HTMLInputElement).value = `${amount}`;
	productInstance.querySelector('.buttonDelete').addEventListener('click', (event: any): void => {
		event.target.parentElement.remove()
	});

	product_list.appendChild(productInstance);
}
