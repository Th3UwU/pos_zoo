import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let return_container = document.getElementById('return_container') as HTMLDivElement;
let template_return: HTMLDivElement = (document.getElementById('template_return') as HTMLTemplateElement).content.querySelector('div');
let template_return_detail: HTMLDivElement = (document.getElementById('template_return_detail') as HTMLTemplateElement).content.querySelector('div');
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
	while (return_container.firstChild)
		return_container.removeChild(return_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let returns = null;

	if (isNumber)
		returns = (await main.querySQL(`SELECT * FROM RETURN WHERE NOT ID_RETURN = 0 AND ID_RETURN = ${value};`)).rows;
	else
		returns = (await main.querySQL(`SELECT * FROM RETURN WHERE NOT ID_RETURN = 0;`)).rows;

	for (const r of returns)
	{
		let return_instance = document.importNode(template_return, true);
		(return_instance.querySelector('.id_return') as HTMLSpanElement).innerHTML = `ID: ${r.id_return}`;
		(return_instance.querySelector('.id_sale') as HTMLSpanElement).innerHTML = `ID Venta: ${r.fk_sale}`;
		(return_instance.querySelector('.date') as HTMLSpanElement).innerHTML = `Fecha: ${(r.date as Date).toISOString().substring(0, 10)}`;

		// Para cada detalle de devolucion
		let return_detail = (await main.querySQL(`SELECT * FROM RETURN_DETAIL WHERE FK_RETURN = ${r.id_return};`)).rows;
		for (const rd of return_detail)
		{
			let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${rd.fk_product};`)).rows[0];

			let return_detail_instance = document.importNode(template_return_detail, true);
			(return_detail_instance.querySelector('.id_product') as HTMLSpanElement).innerHTML = `${product.id_product} - `;
			(return_detail_instance.querySelector('.product_name') as HTMLSpanElement).innerHTML = `${product.name}`;
			(return_detail_instance.querySelector('.amount') as HTMLSpanElement).innerHTML = `C: ${rd.amount}, `;
			(return_detail_instance.querySelector('.reason') as HTMLSpanElement).innerHTML = `Motivo: ${rd.reason}`;

			(return_instance.querySelector('.return_details') as HTMLDivElement).appendChild(return_detail_instance);
		}


		// Agregar al DOM
		return_container.appendChild(return_instance);
	}
}
