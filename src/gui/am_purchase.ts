import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import Main from '../main';
import { Query } from 'pg';

let main: Main = getGlobal('main');

let template_supplier_selection = (document.getElementById('template_supplier_selection') as HTMLTemplateElement).content.querySelector('div');
let template_product_item = (document.getElementById('template_product_item') as HTMLTemplateElement).content.querySelector('div');

let section_select_supplier = (document.getElementById('section_select_supplier') as HTMLDivElement);
let section_select_products = (document.getElementById('section_select_products') as HTMLDivElement);
let product_item_list = (document.getElementById('product_item_list') as HTMLDivElement);

let select_product_id = (document.getElementById('select_product_id') as HTMLInputElement);
let select_product_name = (document.getElementById('select_product_name') as HTMLSpanElement);
let select_product_button = (document.getElementById('select_product_button') as HTMLButtonElement);
let select_add_product_button = (document.getElementById('select_add_product_button') as HTMLButtonElement);

let id_purchase = (document.getElementById('id_purchase') as HTMLInputElement);
let selected_supplier = (document.getElementById('selected_supplier') as HTMLInputElement);
let status = document.getElementById('status') as HTMLSelectElement;

let button_accept = (document.getElementById('button_accept') as HTMLButtonElement);
let button_cancel = (document.getElementById('button_cancel') as HTMLButtonElement);

async function MAIN(): Promise<void>
{
	id_purchase.readOnly = true;
	selected_supplier.readOnly = true;

	// Status select
	let option_p = document.createElement('option') as HTMLOptionElement;
	option_p.value = 'p';
	option_p.text = 'pendiente';
	status.add(option_p);

	let option_e = document.createElement('option') as HTMLOptionElement;
	option_e.value = 'e';
	option_e.text = 'entregado';
	status.add(option_e);

	let option_c = document.createElement('option') as HTMLOptionElement;
	option_c.value = 'c';
	option_c.text = 'cancelado';
	status.add(option_c);

	status.selectedIndex = 0;
	
	// Button cancel
	button_cancel.addEventListener('click', () => {
		getCurrentWindow().close();
	});

	// Product ID input
	select_product_id.addEventListener('change', async (): Promise<void> => {

		try {
			let data = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${select_product_id.value} AND NOT ID_PRODUCT = 0;`)).rows;
			if (data.length == 0)
			{
				select_product_id.dataset.valid = '0';
				throw "Producto no encontrado";
			}

			select_product_id.dataset.valid = '1';
			if (parseInt(data[0].fk_supplier) != parseInt(section_select_supplier.dataset.idSupplier))
				throw "El proveedor no coincide";

			select_product_name.innerHTML = `Nombre: ${data[0].name}`;
		}
		catch (error: any){
			select_product_name.innerHTML = error;
		}
	});

	// Product selection button
	select_product_button.addEventListener('click', (): void => {

		main.setProperty({...main.aux, column: 'product_supplier', canSelect: true, supplier_id: parseInt(section_select_supplier.dataset.idSupplier)}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			const main = (0, remote_1.getGlobal)('main');
			document.getElementById('select_product_id').value = main.aux.return.id_product;
			document.getElementById('select_product_name').innerHTML = 'Nombre: ' + main.aux.return.name;
			document.getElementById('select_product_id').dataset.valid = '1';
		}
		catch (error) {}
		`;
		queryWindow.setVar(code, 'codeCloseParent');

	});

	// Add product item button
	select_add_product_button.addEventListener('click', async (): Promise<void> => {
		
		if (select_product_id.dataset.valid == '0')
		{
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Producto inválido", type: "error"});
			return;
		}

		await addProductItem(parseInt(select_product_id.value), 1, 0);
	});

	if (main.aux.action == 'a')
	{
		status.disabled = true;

		// Append suppliers
		section_select_supplier.style.display = 'block';
		section_select_products.style.display = 'none';

		let suppliers_info: any[] = (await main.querySQL(`SELECT * FROM SUPPLIER WHERE NOT ID_SUPPLIER = 0 AND STATUS = TRUE;`)).rows;
		for (const s of suppliers_info)
		{
			let supplier_selection = document.importNode(template_supplier_selection, true);
			supplier_selection.dataset.id = s.id_supplier;
			supplier_selection.querySelector('span').innerHTML = s.name;
			if (s.image)
				supplier_selection.querySelector('img').src = URL.createObjectURL(new Blob([s.image.buffer], {type: "image/png"}));

				supplier_selection.querySelector('button').addEventListener('click', async (): Promise<void> => {

					section_select_supplier.dataset.idSupplier = supplier_selection.dataset.id;
					section_select_supplier.style.display = 'none';
					section_select_products.style.display = 'block';

					selected_supplier.value = `${s.name}`;
				});

			section_select_supplier.appendChild(supplier_selection);
		}

		//
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_PURCHASE) FROM PURCHASE;`)).rows[0].max;
		new_id++;

		id_purchase.value = `${new_id}`;

		// Accept button
		button_accept.addEventListener('click', async (): Promise<void> => {
			try
			{
				await await validateinputs();
				let current_products_items = document.getElementsByClassName('product_item') as HTMLCollectionOf<HTMLDivElement>;

				// DB Query
				await main.querySQL(`INSERT INTO PURCHASE VALUES(${new_id}, ${section_select_supplier.dataset.idSupplier}, DEFAULT, DEFAULT);`);
				for (const pi of current_products_items) {
					await main.querySQL(`INSERT INTO PURCHASE_DETAIL VALUES(
						(SELECT MAX(ID_PURCHASE_DETAIL) FROM PURCHASE_DETAIL) + 1,
						${new_id},
						${pi.dataset.id},
						${(pi.querySelector('.amount') as HTMLInputElement).valueAsNumber},
						${(pi.querySelector('.cost') as HTMLInputElement).valueAsNumber}
					);`);
				}

				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}


		});

	}
	else if (main.aux.action == 'm')
	{
		section_select_supplier.style.display = 'none';
		section_select_products.style.display = 'block';

		// Get purchase details
		let purchase_header: any = (await main.querySQL(`SELECT * FROM PURCHASE WHERE ID_PURCHASE = ${main.aux.id};`)).rows[0];
		let purchase_details: any[] = (await main.querySQL(`SELECT * FROM PURCHASE_DETAIL WHERE FK_PURCHASE = ${main.aux.id};`)).rows;

		// Set ID
		section_select_supplier.dataset.idSupplier = purchase_header.fk_supplier;
		selected_supplier.value = (await main.querySQL(`SELECT NAME FROM SUPPLIER WHERE ID_SUPPLIER = ${purchase_header.fk_supplier};`)).rows[0].name;
		id_purchase.value = purchase_header.fk_supplier;

		// Fill info
		for (const pd of purchase_details)
			await addProductItem(pd.fk_product, pd.amount, pd.cost);

		// Accept button
		button_accept.addEventListener('click', async (): Promise<void> => {

			try
			{
				await validateinputs();
				let current_products_items = document.getElementsByClassName('product_item') as HTMLCollectionOf<HTMLDivElement>;
				// DB Query

				await main.querySQL(`UPDATE PURCHASE SET STATUS = '${status.value}' WHERE ID_PURCHASE = ${purchase_header.id_purchase};`);
				// Actualizar la fecha si dejamos el status en 'pendiente'
				if (status.selectedIndex == 0)
					await main.querySQL(`UPDATE PURCHASE SET DATE = NOW() WHERE ID_PURCHASE = ${purchase_header.id_purchase};`);

				await main.querySQL(`DELETE FROM PURCHASE_DETAIL WHERE FK_PURCHASE = ${purchase_header.id_purchase};`);

				for (const pi of current_products_items) {
					await main.querySQL(`INSERT INTO PURCHASE_DETAIL VALUES(
						(SELECT MAX(ID_PURCHASE_DETAIL) FROM PURCHASE_DETAIL) + 1,
						${purchase_header.id_purchase},
						${pi.dataset.id},
						${(pi.querySelector('.amount') as HTMLInputElement).valueAsNumber},
						${(pi.querySelector('.cost') as HTMLInputElement).valueAsNumber}
					);`);
				}

				// Si cambiamos el estatus a 'entregado'
				// Aumentar el stock general
				if (status.selectedIndex == 1)
				{
					for (const pi of current_products_items) {
						await main.querySQL(`UPDATE PRODUCT
						SET STOCK = ((SELECT STOCK FROM PRODUCT WHERE ID_PRODUCT = ${pi.dataset.id}) + (${(pi.querySelector('.amount') as HTMLInputElement).valueAsNumber}))
						WHERE ID_PRODUCT = ${pi.dataset.id};`);
					}
				}

				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}


		});
	}
}
MAIN();

async function addProductItem(id: number, amount: number, cost: number)
{
	let product_info: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${id};`)).rows[0];
	if (parseInt(product_info.fk_supplier) != parseInt(section_select_supplier.dataset.idSupplier))
	{
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "El producto no es suministrado por el proveedor seleccionado", type: "error"});
		return;
	}

	let current_products_items = document.getElementsByClassName('product_item') as HTMLCollectionOf<HTMLDivElement>;
	for (const item of current_products_items) {
		if (parseInt((item.querySelector('.id') as HTMLSpanElement).innerHTML) == id)
		{
			let amount = item.querySelector('.amount') as HTMLInputElement;
			amount.value = `${parseInt(amount.value) + 1}`;
			return;
		}
	}

	let product_item = document.importNode(template_product_item, true);
	
	product_item.dataset.id = `${id}`;
	(product_item.querySelector('.id') as HTMLSpanElement).innerHTML = `${id}`;
	(product_item.querySelector('.name') as HTMLSpanElement).innerHTML = `${product_info.name}`;
	(product_item.querySelector('.amount') as HTMLInputElement).value = `${amount}`;
	(product_item.querySelector('.cost') as HTMLInputElement).value = `${cost}`;
	(product_item.querySelector('.remove') as HTMLButtonElement).addEventListener('click', (event: any): void => {
		event.target.parentElement.remove()
	});

	product_item_list.appendChild(product_item);
}


async function validateinputs(): Promise<void>
{
	// Check at least 1 added element
	let current_products_items = document.getElementsByClassName('product_item') as HTMLCollectionOf<HTMLDivElement>;
	if (current_products_items.length == 0)
		throw {message: "Ingrese por lo menos 1 producto a la compra"};

	// Verificar que no rebase el stock maximo
	for (const pi of current_products_items)
	{
		let product_info: any = (await main.querySQL(`SELECT MAX_STOCK, STOCK FROM PRODUCT WHERE ID_PRODUCT = ${parseInt(pi.dataset.id)};`)).rows[0];
		let current_stock: number = parseInt(product_info.stock);
		let max_stock: number = parseInt(product_info.max_stock);
		if ((current_stock + (pi.querySelector('.amount') as HTMLInputElement).valueAsNumber) > max_stock)
			throw {message: `La cantidad del producto '${pi.querySelector('.name').innerHTML}' excede el stock maximo (${max_stock})`};
	}
}
