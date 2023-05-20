import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let store_container = document.getElementById('store_container') as HTMLDivElement;
let template_store: HTMLDivElement = (document.getElementById('template_store') as HTMLTemplateElement).content.querySelector('div');
let template_store_detail: HTMLDivElement = (document.getElementById('template_store_detail') as HTMLTemplateElement).content.querySelector('div');
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
	while (store_container.firstChild)
		store_container.removeChild(store_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let stores = null;

	if (isNumber)
		stores = (await main.querySQL(`SELECT * FROM STORE WHERE NOT ID_STORE = 0 AND ID_STORE = ${value};`)).rows;
	else
		stores = (await main.querySQL(`SELECT * FROM STORE WHERE NOT ID_STORE = 0;`)).rows;

	for (const s of stores)
	{
		let store_instance = document.importNode(template_store, true);
		(store_instance.querySelector('.id_store') as HTMLSpanElement).innerHTML = `ID: ${s.id_store}`;
		(store_instance.querySelector('.location') as HTMLSpanElement).innerHTML = `Ubicación: ${s.location}`;
		(store_instance.querySelector('.type') as HTMLSpanElement).innerHTML = `Tipo: ${s.type}`;
		(store_instance.querySelector('.hours') as HTMLSpanElement).innerHTML = `Horario: ${s.hours}`;

		// Para cada detalle
		let store_detail = (await main.querySQL(`SELECT * FROM STORE_PRODUCT WHERE FK_STORE = ${s.id_store};`)).rows;
		for (const sd of store_detail)
		{
			let product = (await main.querySQL(`SELECT * FROM PRODUCT WHERE ID_PRODUCT = ${sd.fk_product};`)).rows[0];

			let store_detail_instance = document.importNode(template_store_detail, true);
			(store_detail_instance.querySelector('.id_product') as HTMLSpanElement).innerHTML = `${product.id_product} - `;
			(store_detail_instance.querySelector('.product_name') as HTMLSpanElement).innerHTML = `${product.name}, `;
			(store_detail_instance.querySelector('.local_stock') as HTMLSpanElement).innerHTML = `Stock: ${sd.local_stock}, `;

			if (product.image)
				(store_detail_instance.querySelector('.image') as HTMLImageElement).src = URL.createObjectURL(new Blob([product.image.buffer], {type: "image/png"}));

			(store_instance.querySelector('.store_details') as HTMLDivElement).appendChild(store_detail_instance);
		}


		// Agregar al DOM
		store_container.appendChild(store_instance);
	}
}
