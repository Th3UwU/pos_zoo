import { getCurrentWindow, getGlobal } from '@electron/remote';
import { QueryResult } from 'pg';
import Main from '../main';

let main: Main = getGlobal('main');

let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();

let supplierContainer = document.getElementById('container') as HTMLDivElement;
let supplierTemplate = <HTMLTemplateElement>document.getElementById("templateSupplier");

async function refreshSuppliers(): Promise<void> {
	let suppliers: QueryResult<any> = await main.querySQL(`SELECT * FROM SUPPLIER WHERE id_supplier > 0;`);

	for (const supp of suppliers.rows) {
		
		let supplierInstance = <HTMLDivElement>(supplierTemplate).content.cloneNode(true);
		supplierInstance.querySelector('.id_supplier').innerHTML = supp.id_supplier;
		supplierInstance.querySelector('.name').innerHTML = supp.name;
		supplierInstance.querySelector('.tel').innerHTML = supp.tel;

		supplierInstance.querySelector('button').addEventListener('click', () => {
			
			let code: string = 
			`
				document.getElementById('supplier').value = '${supp.id_supplier}';
			`
			
			parent.webContents.executeJavaScript(code);
			getCurrentWindow().close();
		});

		supplierContainer.appendChild(supplierInstance);
	}
}
refreshSuppliers();
