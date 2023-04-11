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
		let section_product = document.getElementById('section_product') as HTMLDivElement;
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
			let total: number = 0;

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
	}
	// Modify sale
	else if (aux.action == 'm')
	{

	}
}
MAIN();
