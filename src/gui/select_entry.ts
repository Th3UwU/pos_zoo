import { getCurrentWindow, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

let search_bar = document.getElementById('search_bar') as HTMLInputElement;
let button_search = document.getElementById('button_search') as HTMLButtonElement;
let query_container = document.getElementById('query_container') as HTMLDivElement;

// Get all entries
async function refreshEntries(): Promise<void> {


	// Columns to retrieve
	let visibleColumns: string[];
	let matchRow: string = '';

	switch (aux.selectEntryColumn) {

		case "product":
			visibleColumns = ['id_product', 'name', 'price', 'image'];
			matchRow = 'name';
			break;

		case "store":
			visibleColumns = ['id_store', 'location', 'type', 'hours'];
			matchRow = 'location';
			break;

		case "supplier":
			visibleColumns = ['id_supplier', 'name', 'tel', 'image'];
			matchRow = 'name';
			break;

		case "sale":
			visibleColumns = ['id_sale'];
			matchRow = 'id_sale';
			break;

		case "purchase":
			visibleColumns = ['id_purchase'];
			matchRow = 'id_purchase';
			break;

		case "return":
			visibleColumns = ['id_return'];
			matchRow = 'id_return';
			break;

		case "order":
			visibleColumns = ['id_order'];
			matchRow = 'id_order';
			break;

		case "employee":
			visibleColumns = ['id_employee', 'first_name', 'role'];
			matchRow = 'first_name';
			break;

	};

	button_search.addEventListener('click', async (): Promise<void> => {

		query_container.innerHTML = '';
		let isNumber: boolean = !isNaN(parseInt(search_bar.value));

		// Retrieve entries
		let retrieveQuery: string = `SELECT `;
		for (const c of visibleColumns) {
			retrieveQuery += `${c}, `;
		}
		retrieveQuery = retrieveQuery.slice(0, -2);
		retrieveQuery += ` FROM ${aux.selectEntryColumn} WHERE id_${aux.selectEntryColumn} > 0 AND `
		+ ((isNumber) ? (`id_${aux.selectEntryColumn} = ${parseInt(search_bar.value)};`) : (`LOWER(${matchRow}) LIKE LOWER('%${search_bar.value}%');`));
		console.log(retrieveQuery);
		let entries: QueryResult<any> = await main.querySQL(retrieveQuery);

		// Append every entry
		for (let i = 0; i < entries.rows.length; i++) {

			let template = document.createElement('div') as HTMLDivElement;
			template.className = 'result';
			template.style.display = 'block';

			for (let j = 0; j < entries.fields.length; j++)
			{
				// BYTEA (We assume is an image)
				if (entries.fields[j].dataTypeID == 17)
				{
					// Not null
					if (entries.rows[i][entries.fields[j].name])
					{
						let imagePreview = document.createElement('img') as HTMLImageElement;
						imagePreview.src = URL.createObjectURL(new Blob([entries.rows[i][entries.fields[j].name].buffer], {type: "image/png"}));
						imagePreview.style.display = 'block';

						template.appendChild(imagePreview);
					}
				}
				else
				{
					let span = document.createElement('span') as HTMLSpanElement;
					span.innerHTML = entries.rows[i][entries.fields[j].name];
					template.appendChild(span);
				}
			}

			// Button
			let button = document.createElement('button') as HTMLButtonElement;
			button.innerHTML = 'Seleccionar';
			button.addEventListener('click', (): void => {

				let code: string = 
				`
					${aux.returnInput}.value = '${entries.rows[i][visibleColumns[0]]}';
				`

				let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();
				parent.webContents.executeJavaScript(code);
				getCurrentWindow().close();

			});
			template.appendChild(button);

			// Append entry
			query_container.appendChild(template);
		}
		
	});
}
refreshEntries();
