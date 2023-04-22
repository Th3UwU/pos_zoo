import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');

let visibleColumns: string[];
let matchRow: string = '';

switch (main.aux.column) {

	case "store":
		visibleColumns = ['id_store', 'location', 'hours'];
		matchRow = 'location';
		break;

	case "supplier":
		visibleColumns = ['id_supplier', 'name'];
		matchRow = 'name';
		break;

	case "product":
		visibleColumns = ['id_product', 'name', 'price', 'image'];
		matchRow = 'name';
		break;

	case "employee":
		visibleColumns = ['id_employee', 'first_name', 'last_name', 'role'];
		matchRow = 'first_name';
		break;
};

let search_bar = document.getElementById('search_bar') as HTMLInputElement;
let query_container = document.getElementById('query_container') as HTMLDivElement;
let button_search = document.getElementById('button_search') as HTMLButtonElement;

async function MAIN(): Promise<void> {
	(document.getElementById('search_bar_label') as HTMLLabelElement).innerHTML = `Buscar ${main.aux.column}:`;
	button_search.addEventListener('click', search);
}
MAIN();

async function search(): Promise<void>
{
	// Clear current query results
	query_container.innerHTML = '';

	// ID or Name
	let isNumber: boolean = !isNaN(parseInt(search_bar.value));

	// Query
	let query: string = null;

	switch (main.aux.column)
	{

	default:
		query = `SELECT * FROM ${main.aux.column} WHERE ` +
		((isNumber) ? (`id_${main.aux.column} = ${parseInt(search_bar.value)};`) : (`LOWER(${matchRow}) LIKE LOWER('%${search_bar.value}%')`))
		+ ` AND NOT id_${main.aux.column} = 0;`;
		break;
	}
	
	console.log(query);
	let result = (await main.querySQL(query)).rows;

	for (const i of result) {

		let resultContainer = document.createElement('div') as HTMLDivElement;
		resultContainer.className = 'result';
		
		for (const j of visibleColumns) {
			
			
			if (j.includes('date'))
			{
				let row = document.createElement('span') as HTMLSpanElement;
				let date: Date = new Date(i[j]);
				row.innerHTML = `${j}: ${date.toISOString().substring(0, 10)}`;
				row.style.display = 'block';
				resultContainer.appendChild(row);
			}
			else if ((j.includes('image')) && (i[j]))
			{
				let imagePreview = document.createElement('img') as HTMLImageElement;
				imagePreview.src = URL.createObjectURL(new Blob([i[j].buffer], {type: "image/png"}));
				imagePreview.style.display = 'block';
				resultContainer.appendChild(imagePreview);
			}
			else
			{
				let row = document.createElement('span') as HTMLSpanElement;
				row.innerHTML = `${j}: ${i[j]}`;
				row.style.display = 'block';
				resultContainer.appendChild(row);
			}

		}
		
		// Button
		if (main.aux.canSelect)
		{
			let button = document.createElement('button') as HTMLButtonElement;
			button.addEventListener('click', (): void => {

				main.setProperty({...main.aux, return: i}, 'aux');

				getCurrentWindow().close();
			});
			button.innerHTML = 'Seleccionar';
			resultContainer.appendChild(button);
		}

		// Append
		query_container.appendChild(resultContainer);
	}
}
search();


