import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';

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
		let templateProduct = document.getElementById('templateProduct') as HTMLTemplateElement;
		let sectionProduct = document.getElementById('section_product') as HTMLDivElement;
		let buttonSelectProduct = document.getElementById('buttonSelectProduct') as HTMLButtonElement;
		let buttonAddProduct = document.getElementById('buttonAddProduct') as HTMLButtonElement;
		let buttonAccept1 = document.getElementById('buttonAccept1') as HTMLButtonElement;
		let idProduct = document.getElementById('idProduct') as HTMLInputElement;
		let productList = document.getElementById('productList') as HTMLDivElement;

		// Seleccionar producto
		buttonSelectProduct.addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: 'product', returnInputID: 'idProduct'}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});

		// Add product to list		
		buttonAddProduct.addEventListener('click', async (): Promise<void> => {

			let productEntry: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${idProduct.value};`)).rows[0];
			let productInstance = <HTMLDivElement>(templateProduct).content.cloneNode(true);
			productInstance.querySelector('.productId').innerHTML = productEntry.id_product;
			productInstance.querySelector('.name').innerHTML = productEntry.name;
			(productInstance.querySelector('.amount') as HTMLInputElement).value = '1';

			// Remove element from list event
			(productInstance.querySelector('.buttonDelete') as HTMLButtonElement).addEventListener('click', (event: any): void => {
				
				event.target.parentElement.remove()
			});
			productList.appendChild(productInstance);


		});
	}
	// Modify sale
	else if (aux.action == 'm')
	{

	}
}
MAIN();
