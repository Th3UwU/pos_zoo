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
		{
			let productInfo = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${idProduct.value}`)).rows[0];
			let productInstance = document.importNode(templateProduct, true);
			
			productInstance.dataset.idProduct = `${productInfo.id_product}`;
			productInstance.querySelector('.productId').innerHTML = `ID: ${productInfo.id_product}`;
			productInstance.querySelector('.name').innerHTML = `Nombre: ${productInfo.name}`;
			productInstance.querySelector('.stock').innerHTML = `Stock: ${productInfo.stock}`;
			productInstance.querySelector('.local_stock').innerHTML = `Limite local: ${productInfo.local_limit}`;
			productInstance.querySelector('.buttonDelete').addEventListener('click', (event: any): void => {
				event.target.parentElement.remove()
			});
	
			product_list.appendChild(productInstance);
		}


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
	if (main.aux.action == 'a')
	{
		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try
			{
				let idStore: number = main.credentials.idStore;
		
				// Iterar entre cada producto de la lista
				let addedProducts = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
				if (addedProducts.length == 0)
					throw {message: "Seleccione por lo menos 1 producto"};
		
				/*
				for (const ap of addedProducts)
				{
					let result: any[] = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE ((FK_PRODUCT = ${ap.dataset.idProduct}) AND (FK_STORE = ${idStore}));`)).rows;
					if (result.length == 0)
					{
						
					}
					else
					{
		
					}
				}
				*/
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