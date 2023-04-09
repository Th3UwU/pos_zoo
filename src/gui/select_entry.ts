import { getCurrentWindow, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');
let aux: any = getGlobal('aux');

let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();

let container = document.getElementById('container') as HTMLDivElement;

// Get all entries
async function refreshEntries(): Promise<void> {


	// Columns to retrieve
	let visibleColumns: string[];
	switch (aux.selectEntryColumn) {

		case "product":
			visibleColumns = ['id_product', 'name', 'price', 'image'];
			break;

		case "supplier":
			visibleColumns = ['id_supplier', 'name', 'tel', 'image'];
			break;

		case "store":
			visibleColumns = ['id_store', 'location', 'type', 'hours'];
			break;
	}

	// Retrieve entries
	let retrieveQuery: string = `SELECT `;
	for (const c of visibleColumns) {
		retrieveQuery += `${c}, `;
	}
	retrieveQuery = retrieveQuery.slice(0, -2);
	retrieveQuery += ` FROM ${aux.selectEntryColumn} WHERE id_${aux.selectEntryColumn} > 0;`;
	let entries: QueryResult<any> = await main.querySQL(retrieveQuery);

	// Append every entry
	for (let i = 0; i < entries.rows.length; i++) {

		let template = document.createElement('div') as HTMLDivElement;

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
				document.getElementById('${aux.returnInputID}').value = '${entries.rows[i][visibleColumns[0]]}';
			`

			parent.webContents.executeJavaScript(code);
			getCurrentWindow().close();

		});
		template.appendChild(button);

		// Append entry
		container.appendChild(template);
	}
}
refreshEntries();
