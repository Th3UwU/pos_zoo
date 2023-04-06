import { getCurrentWindow, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');

let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();

let container = document.getElementById('container') as HTMLDivElement;

// Get all entries
async function refreshEntries(): Promise<void> {

	let aux: any = getGlobal('aux');

	// Columns to retrieve
	let visibleColumns: string[];
	switch (aux.selectEntryColumn) {

		case "supplier":
			visibleColumns = ['id_supplier', 'name', 'tel', 'image']
			break;
	}

	// Retrieve entries
	let retrieveQuery: string = `SELECT `;
	for (const c of visibleColumns) {
		retrieveQuery += `${c}, `;
	}
	retrieveQuery = retrieveQuery.slice(0, -2);
	retrieveQuery += ` FROM ${aux.selectEntryColumn} WHERE id_${aux.selectEntryColumn} > 0;`;

	console.log(retrieveQuery);
	let entries: QueryResult<any> = await main.querySQL(retrieveQuery);

	console.log(entries);

	// Append every entry
	for (let i = 0; i < entries.rows.length; i++) {

		let template = document.createElement('div') as HTMLDivElement;

		for (let j = 0; j < entries.fields.length; j++)
		{
			// BYTEA (We assume is an image)
			if (entries.fields[j].dataTypeID == 17)
			{

			}
			else
			{
				let span = document.createElement('span') as HTMLSpanElement;
				span.innerHTML = entries.rows[i][visibleColumns[j]];
				template.appendChild(span);
			}
		}

		container.appendChild(template);



		


		
		// let supplierInstance = <HTMLDivElement>(supplierTemplate).content.cloneNode(true);
		// supplierInstance.querySelector('.id_supplier').innerHTML = supp.id_supplier;
		// supplierInstance.querySelector('.name').innerHTML = supp.name;
		// supplierInstance.querySelector('.tel').innerHTML = supp.tel;

		// if (supp.image)
		// {
		// 	let imagePreview = supplierInstance.querySelector('.image') as HTMLImageElement;
		// 	imagePreview.src = URL.createObjectURL(new Blob([supp.image.buffer], {type: "image/png"}));
		// 	imagePreview.style.display = 'block';
		// }

		// supplierInstance.querySelector('button').addEventListener('click', () => {
			
		// 	let code: string = 
		// 	`
		// 		document.getElementById('supplier').value = '${supp.id_supplier}';
		// 	`
			
		// 	parent.webContents.executeJavaScript(code);
		// 	getCurrentWindow().close();
		// });

		
	}
}
refreshEntries();
