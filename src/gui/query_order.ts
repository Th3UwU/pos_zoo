import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let order_container = document.getElementById('order_container') as HTMLDivElement;
let template_order: HTMLDivElement = (document.getElementById('template_order') as HTMLTemplateElement).content.querySelector('div');
let template_order_detail: HTMLDivElement = (document.getElementById('template_order_detail') as HTMLTemplateElement).content.querySelector('div');
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
	while (order_container.firstChild)
		order_container.removeChild(order_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let orders = null;

	if (main.aux.pending)
	{
		if (isNumber)
		orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0 AND ID_PRODUCT_ORDER = ${value} AND STATUS = 'p';`)).rows;
		else if (value == '')
			orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0 AND STATUS = 'p';`)).rows;
		else
			orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0 AND LOWER((SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = FK_EMPLOYEE)) LIKE LOWER('%${value}%') AND STATUS = 'p';`)).rows;
		}
	else
	{
		if (isNumber)
			orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0 AND ID_PRODUCT_ORDER = ${value};`)).rows;
		else if (value == '')
			orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0;`)).rows;
		else
			orders = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER WHERE NOT ID_PRODUCT_ORDER = 0 AND LOWER((SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = FK_EMPLOYEE)) LIKE LOWER('%${value}%');`)).rows;
	}



	for (const o of orders)
	{
		let order_instance = document.importNode(template_order, true);
		(order_instance.querySelector('.id_order') as HTMLSpanElement).innerHTML = `ID: ${o.id_product_order}`;
		(order_instance.querySelector('.date') as HTMLSpanElement).innerHTML = `Fecha: ${(o.date as Date).toISOString().substring(0, 10)}`;

		(order_instance.querySelector('.employee') as HTMLSpanElement).innerHTML =
		`Empleado: ${o.fk_employee} (${(await main.querySQL(`SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${o.fk_employee};`)).rows[0].first_name})`;

		(order_instance.querySelector('.store') as HTMLSpanElement).innerHTML =
		`Local: ${o.fk_store} (${(await main.querySQL(`SELECT LOCATION FROM STORE WHERE ID_STORE = ${o.fk_store};`)).rows[0].location})`;

		let status: string = null;
		switch (o.status) {
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

		(order_instance.querySelector('.status') as HTMLSpanElement).innerHTML = `Estatus: ${status}`;

		// Para cada detalle de pedido
		let order_detail = (await main.querySQL(`SELECT * FROM PRODUCT_ORDER_DETAIL WHERE FK_PRODUCT_ORDER = ${o.id_product_order};`)).rows;
		for (const od of order_detail)
		{
			let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${od.fk_product};`)).rows[0];

			let order_detail_instance = document.importNode(template_order_detail, true);
			(order_detail_instance.querySelector('.id_product') as HTMLSpanElement).innerHTML = `${product.id_product} - `;
			(order_detail_instance.querySelector('.product_name') as HTMLSpanElement).innerHTML = `${product.name}`;
			(order_detail_instance.querySelector('.amount') as HTMLSpanElement).innerHTML = `${od.amount}`;

			if (product.image)
				(order_detail_instance.querySelector('.image') as HTMLImageElement).src = URL.createObjectURL(new Blob([product.image.buffer], {type: "image/png"}));

			(order_instance.querySelector('.order_details') as HTMLDivElement).appendChild(order_detail_instance);
		}


		// Agregar al DOM
		order_container.appendChild(order_instance);
	}
}
