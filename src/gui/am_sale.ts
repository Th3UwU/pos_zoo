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

		// Shopping cart
		type ShoppingCart = {
			idProduct: number;
			amount: number;
		};
		let shoppingCart: ShoppingCart[] = [];

		// Select product
		buttonSelectProduct.addEventListener('click', (): void => {

			main.setGlobal({...aux, selectEntryColumn: 'product', returnInputID: 'idProduct'}, 'aux');
			main.createWindow(800, 600, 'gui/select_entry.html', getCurrentWindow());
		});

		// Add product to list		
		buttonAddProduct.addEventListener('click', async (): Promise<void> => {

			// Check if it's already in shopping cart
			let added: number = -1;
			for (let i = 0; i < shoppingCart.length; i++) {
				if (shoppingCart[i].idProduct == parseInt(idProduct.value))
				{
					added = i;
					break;
				}
			}

			if (added != -1)
			{

				// Increase in array (shopping cart)
				shoppingCart[added].amount++;

				// Increase in the input element
				let productListItems = document.getElementsByClassName('product') as HTMLCollectionOf<HTMLDivElement>;
				for (const item of productListItems) {

					if (item.querySelector('.productId').innerHTML == idProduct.value) {
						(item.querySelector('.amount') as HTMLInputElement).value = shoppingCart[added].amount.toString();
					}
				}
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
					
					// Delete from array (shopping cart)
					for (let i = 0; i < shoppingCart.length; i++) {

						if (shoppingCart[i].idProduct == parseInt(productInstance.querySelector('.productId').innerHTML))
							shoppingCart.splice(i, 1);
					}

					// Delete from DOM
					event.target.parentElement.remove()
				});
				productList.appendChild(productInstance);

				shoppingCart.push({idProduct: parseInt(idProduct.value), amount: 1});
			}

			console.log(shoppingCart);
		});
	}
	// Modify sale
	else if (aux.action == 'm')
	{

	}
}
MAIN();
