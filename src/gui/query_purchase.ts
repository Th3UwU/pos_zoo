import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let purchase_container = document.getElementById('purchase_container') as HTMLDivElement;
let template_purchase: HTMLDivElement = (document.getElementById('template_purchase') as HTMLTemplateElement).content.querySelector('div');
let template_purchase_detail: HTMLDivElement = (document.getElementById('template_purchase_detail') as HTMLTemplateElement).content.querySelector('div');
let search_bar = document.getElementById('search_bar') as HTMLInputElement;

async function MAIN(): Promise<void> {
	await search();

	search_bar.addEventListener('change', async (): Promise<void> => {
		await search();
	});
}
MAIN();

async function search(): Promise<void>
{
	while (purchase_container.firstChild)
		purchase_container.removeChild(purchase_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let purchases = null;

	if (main.aux.pending)
	{
		if (isNumber)
		purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0 AND ID_PURCHASE = ${value} AND STATUS = 'p';`)).rows;
		else if (value == '')
			purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0 AND STATUS = 'p';`)).rows;
		else
			purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0 AND LOWER((SELECT NAME FROM SUPPLIER WHERE ID_SUPPLIER = FK_SUPPLIER)) LIKE LOWER('%${value}%') AND STATUS = 'p';`)).rows;
		}
	else
	{
		if (isNumber)
			purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0 AND ID_PURCHASE = ${value};`)).rows;
		else if (value == '')
			purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0;`)).rows;
		else
			purchases = (await main.querySQL(`SELECT * FROM PURCHASE WHERE NOT ID_PURCHASE = 0 AND LOWER((SELECT NAME FROM SUPPLIER WHERE ID_SUPPLIER = FK_SUPPLIER)) LIKE LOWER('%${value}%');`)).rows;
	}



	for (const p of purchases)
	{
		let purchase_instance = document.importNode(template_purchase, true);
		(purchase_instance.querySelector('.id_purchase') as HTMLSpanElement).innerHTML = `ID: ${p.id_purchase}`;
		(purchase_instance.querySelector('.date') as HTMLSpanElement).innerHTML = `Fecha: ${(p.date as Date).toISOString().substring(0, 10)}`;

		(purchase_instance.querySelector('.supplier') as HTMLSpanElement).innerHTML =
		`Proveedor: ${p.fk_supplier} (${(await main.querySQL(`SELECT NAME FROM SUPPLIER WHERE ID_SUPPLIER = ${p.fk_supplier};`)).rows[0].name})`;

		let status: string = null;
		switch (p.status) {
			case 'p':
				status = 'pendiente';
				break;
			case 'e':
				status = 'entregado';
				break;
			case 'c':
				status = 'cancelado';
				break;
		}

		(purchase_instance.querySelector('.status') as HTMLSpanElement).innerHTML = `Estatus: ${status}`;

		// Para cada detalle de pedido
		let purchase_detail = (await main.querySQL(`SELECT * FROM PURCHASE_DETAIL WHERE FK_PURCHASE = ${p.id_purchase};`)).rows;
		for (const pd of purchase_detail)
		{
			let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${pd.fk_product};`)).rows[0];

			let purchase_detail_instance = document.importNode(template_purchase_detail, true);
			(purchase_detail_instance.querySelector('.id_product') as HTMLSpanElement).innerHTML = `${product.id_product} - `;
			(purchase_detail_instance.querySelector('.product_name') as HTMLSpanElement).innerHTML = `${product.name}`;
			(purchase_detail_instance.querySelector('.amount') as HTMLSpanElement).innerHTML = `C: ${pd.amount}`;

			if (product.image)
				(purchase_detail_instance.querySelector('.image') as HTMLImageElement).src = URL.createObjectURL(new Blob([product.image.buffer], {type: "image/png"}));

			(purchase_instance.querySelector('.purchase_details') as HTMLDivElement).appendChild(purchase_detail_instance);
		}


		// Agregar al DOM
		purchase_container.appendChild(purchase_instance);
	}
}
