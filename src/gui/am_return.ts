import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');

let template_return_item = (document.getElementById('template_return_item') as HTMLTemplateElement).content.querySelector('div');

let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;

let id_return = document.getElementById('id_return') as HTMLInputElement;
let return_item_container = document.getElementById(`return_item_container`) as HTMLDivElement;

buttonCancel.addEventListener('click', (): void => {
	getCurrentWindow().close();
});

// [id][amount/total]
type ReturnedItems = {
	idProduct: number;
	amount: number;
	total: number;
};

let returnedItems: ReturnedItems[] = [];

async function getReturnedItems(): Promise<ReturnedItems[]>
{
	let ri: ReturnedItems[] = [];
	let sale_detail = (await main.querySQL(`SELECT * FROM SALE_DETAIL WHERE FK_SALE = ${main.aux.sale_id};`)).rows;

	for (const sd of sale_detail)
	{

		let item: ReturnedItems = {idProduct: sd.fk_product, amount: 0, total: sd.amount};
		let temp = (await main.querySQL(`SELECT * FROM RETURN INNER JOIN RETURN_DETAIL ON FK_RETURN = ID_RETURN WHERE FK_PRODUCT = ${sd.fk_product};`)).rows;

		for (const i of temp)
			item.amount += i.amount;

		ri.push(item);
	}

	return ri;
}

async function addReturnItem(idProduct: number, enable: boolean, reason: string, amount: number): Promise<void>
{
	let product_name: string = (await main.querySQL(`SELECT NAME FROM PRODUCT WHERE ID_PRODUCT = ${idProduct};`)).rows[0].name;
	let return_item: HTMLDivElement = document.importNode(template_return_item, true);

	return_item.dataset.id = `${idProduct}`;
	(return_item.querySelector('.name') as HTMLSpanElement).innerHTML = `${product_name}`;
	(return_item.querySelector('.enable') as HTMLInputElement).checked = enable;
	(return_item.querySelector('.reason') as HTMLInputElement).value = reason;
	(return_item.querySelector('.amount') as HTMLInputElement).value = `${amount}`;

	return_item_container.appendChild(return_item);
}

async function MAIN(): Promise<void> {

	id_return.readOnly = true;
	
	// Add new return
	if (main.aux.action == 'a')
	{
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_RETURN) FROM RETURN;`)).rows[0].max
		new_id++;
		id_return.value = `${new_id}`;

		returnedItems = await getReturnedItems();

		for (const i of returnedItems)
		{
			if (i.amount < i.total)
				addReturnItem(i.idProduct, false, "", 0);
		}

		buttonAccept.addEventListener('click', async (): Promise<void> =>{
			
			let return_item = document.getElementsByClassName('return_item') as HTMLCollectionOf<HTMLDivElement>;
			let at_least_one: boolean = false;
			for (const i of return_item){
				if ((i.querySelector('.enable') as HTMLInputElement).checked == true)
					{at_least_one = true; break;}
			}

			try {
				if (!at_least_one)
					throw {message: "Debe elegir al menos un producto a deolver"};

				// get elements to return
				let products_to_return: HTMLDivElement[] = [];
				for (const i of return_item) {
					if ((i.querySelector('.enable') as HTMLInputElement).checked == true)
						products_to_return.push(i);
				}

				// validate inputs
				for (const i of products_to_return)
				{
					let r_item: ReturnedItems = null;
					for (const j of returnedItems)
					{
						if (parseInt(i.dataset.id) == j.idProduct)
							{r_item = j; break;}
					}

					if ((parseInt((i.querySelector('.amount') as HTMLInputElement).value) + r_item.amount) > r_item.total)
					{
						let product_name: string = (await main.querySQL(`SELECT NAME FROM PRODUCT WHERE ID_PRODUCT = ${r_item.idProduct};`)).rows[0].name;
						throw {message: `No puede devolver más producto de: '${product_name}'`};
					}
				}

				// SQL Query

				await main.querySQL(`INSERT INTO RETURN VALUES(${new_id}, ${main.aux.sale_id}, DEFAULT);`);
				for (const i of products_to_return)
				{
					await main.querySQL(`INSERT INTO RETURN_DETAIL VALUES(
						(SELECT MAX(ID_RETURN_DETAIL) FROM RETURN_DETAIL) + 1,
						${new_id},
						${i.dataset.id},
						${(i.querySelector('.amount') as HTMLInputElement).value},
						'${(i.querySelector('.reason') as HTMLInputElement).value}');`);

					// AUmentar stock local
					let temp = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE FK_PRODUCT = ${i.dataset.id};`)).rows;
					if (temp.length == 0)
					{
						await main.querySQL(`INSERT INTO STORE_PRODUCT VALUES(
							(SELECT MAX(ID_STORE_PRODUCT) FROM STORE_PRODUCT) + 1,
							${main.credentials.idStore},
							${i.dataset.id},
							${(i.querySelector('.amount') as HTMLInputElement).value}
						);`);
					}
					else
					{
						await main.querySQL(`UPDATE STORE_PRODUCT SET LOCAL_STOCK =
						${parseInt(temp[0].local_stock) + parseInt((i.querySelector('.amount') as HTMLInputElement).value)}
						WHERE ID_STORE_PRODUCT = ${temp[0].id_store_product};`);
					}
				}

				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Devolución exitosa", type: "info"});
				getCurrentWindow().close();
					
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}
	// Modify return
	else if (main.aux.action == 'm')
	{
		
	}
}
MAIN();
