import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let sale_container = document.getElementById('sale_container') as HTMLDivElement;
let template_sale: HTMLDivElement = (document.getElementById('template_sale') as HTMLTemplateElement).content.querySelector('div');
let template_sale_detail: HTMLDivElement = (document.getElementById('template_sale_detail') as HTMLTemplateElement).content.querySelector('div');
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
	while (sale_container.firstChild)
		sale_container.removeChild(sale_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let sales = null;
	if (isNumber)
		sales = (await main.querySQL(`SELECT * FROM SALE WHERE NOT ID_SALE = 0 AND ID_SALE = ${value};`)).rows;
	else if (value == '')
		sales = (await main.querySQL(`SELECT * FROM SALE WHERE NOT ID_SALE = 0;`)).rows;
	else
		sales = (await main.querySQL(`SELECT * FROM SALE WHERE NOT ID_SALE = 0 AND LOWER((SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = FK_EMPLOYEE)) LIKE LOWER('%${value}%');`)).rows;

	for (const s of sales)
	{
		let sale_instance = document.importNode(template_sale, true);
		(sale_instance.querySelector('.id_sale') as HTMLSpanElement).innerHTML = `ID: ${s.id_sale}`;
		(sale_instance.querySelector('.date') as HTMLSpanElement).innerHTML = `Fecha: ${(s.date as Date).toISOString().substring(0, 10)}`;

		(sale_instance.querySelector('.employee') as HTMLSpanElement).innerHTML =
		`Empleado: ${s.fk_employee} (${(await main.querySQL(`SELECT FIRST_NAME FROM EMPLOYEE WHERE ID_EMPLOYEE = ${s.fk_employee};`)).rows[0].first_name})`;

		// Para cada detalle de venta
		let sale_detail = (await main.querySQL(`SELECT * FROM SALE_DETAIL WHERE FK_SALE = ${s.id_sale};`)).rows;
		for (const sd of sale_detail)
		{
			let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${sd.fk_product};`)).rows[0];

			let sale_detail_instance = document.importNode(template_sale_detail, true);
			(sale_detail_instance.querySelector('.id_product') as HTMLSpanElement).innerHTML = `${product.id_product} - `;
			(sale_detail_instance.querySelector('.product_name') as HTMLSpanElement).innerHTML = `${product.name}`;
			(sale_detail_instance.querySelector('.cost') as HTMLSpanElement).innerHTML = `$${sd.cost} X `;
			(sale_detail_instance.querySelector('.amount') as HTMLSpanElement).innerHTML = `${sd.amount}`;

			if (product.image)
			{
				(sale_detail_instance.querySelector('.image') as HTMLImageElement).src = URL.createObjectURL(new Blob([product.image.buffer], {type: "image/png"}));
				console.log("Si tiene imagen");
			}

			(sale_instance.querySelector('.sale_details') as HTMLDivElement).appendChild(sale_detail_instance);
		}


		// Agregar al DOM
		sale_container.appendChild(sale_instance);
	}
}
