import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';

let main: Main = getGlobal('main');

let localAux = document.getElementById('localAux') as HTMLSpanElement;

let id_product = document.getElementById('id_product') as HTMLInputElement;
let name = document.getElementById('name') as HTMLInputElement;
let description = document.getElementById('description') as HTMLInputElement;
let price = document.getElementById('price') as HTMLInputElement;
let category = document.getElementById('category') as HTMLSelectElement;
let stock = document.getElementById('stock') as HTMLInputElement;
let maxStock = document.getElementById('maxStock') as HTMLInputElement;
let localLimit = document.getElementById('localLimit') as HTMLInputElement;
let supplier = document.getElementById('supplier') as HTMLInputElement;
let supplierName = document.getElementById('supplierName') as HTMLSpanElement;
let imagePath = document.getElementById('image') as HTMLInputElement;
let status = document.getElementById('status') as HTMLInputElement;

// Select category
const categories: string[] = [
	'libro',
	'juguete',
	'ropa',
	'souvenir',
	'papeleria',
	'peluche',
	'accesorio',
	'artesania',
	'otro'
];

for (const c of categories) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = c;
	option.text = c;
	category.add(option);
}

/***** Supplier *****/
supplier.addEventListener('change', async (): Promise<void> => {

	try {
		let data = (await main.querySQL(`SELECT NAME FROM SUPPLIER WHERE ID_SUPPLIER = ${supplier.value} AND NOT ID_SUPPLIER = 0;`)).rows[0];
		supplierName.innerHTML = `Nombre: ${data.name}`;
		localAux.dataset.validSupplier = '1';
	}
	catch (error: any){
		supplierName.innerHTML = 'Proveedor no encontrado';
		localAux.dataset.validSupplier = '0';
	}
});

let buttonSupplier = document.getElementById('buttonSupplier') as HTMLButtonElement;
buttonSupplier.addEventListener('click', () => {

	main.setProperty({...main.aux, column: 'supplier', canSelect: true}, 'aux');
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('supplier').value = main.aux.return.id_supplier;
		document.getElementById('supplierName').innerHTML = main.aux.return.name;
		document.getElementById('localAux').dataset.validSupplier = '1';
	}
	catch (error) {}
	`;

	queryWindow.setVar(code, 'codeCloseParent');
});

// Image preview
let buttonImage = document.getElementById('buttonImage') as HTMLButtonElement;
let imagePreview = document.getElementById('imagePreview') as HTMLImageElement;

const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir imagen', properties: ['openFile']};

buttonImage.addEventListener('click', () => {
	let dialogResult: string[] = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

	if (dialogResult != undefined)
	{
		imagePath.value = dialogResult[0];

		imagePreview.src = dialogResult[0];
		imagePreview.style.display = 'block';
	}
});


let buttonAccept = document.getElementById('buttonAccept') as HTMLButtonElement;
let buttonCancel = document.getElementById('buttonCancel') as HTMLButtonElement;

buttonCancel.addEventListener('click', (): void => {

	getCurrentWindow().close();
});

async function MAIN(): Promise<void> {

	id_product.readOnly = true;

	// Add new product
	if (main.aux.action == 'a')
	{
		// Get 'new id'
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_PRODUCT) FROM PRODUCT`)).rows[0].max;
		new_id++;

		// Set 'new id' in the input field
		id_product.value = `${new_id}`;

		status.disabled = true;

		buttonAccept.addEventListener('click', async (): Promise<void> => {

			try {

				checkInvalidStock();

				if (emptyInputs())
					throw {message: "No puede haber campos vacíos"};

				if (localAux.dataset.validSupplier == '0')
					throw {message: "El proveedor seleccionado no es válido"};

				let imageRaw: string = null;
				if (imagePath.value)
					imageRaw = readFileSync(imagePath.value, null).toString('base64');
			
				let query: string = `INSERT INTO PRODUCT VALUES((SELECT MAX(ID_PRODUCT) FROM PRODUCT) + 1,
				'${supplier.value}', '${name.value}', '${description.value}', '${price.value}',
				'${category.value}', '${stock.value}', '${maxStock.value}', '${localLimit.value}', DEFAULT, `
				+ ((imageRaw) ? (`(DECODE('${imageRaw}', 'base64')));`) : (`DEFAULT);`));

				console.log(query);
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});
	}
	// Modify product
	else if (main.aux.action == 'm')
	{
		// Get entry to modify
		let product: any = (await main.querySQL(`SELECT * FROM PRODUCT WHERE id_product = ${main.aux.id};`)).rows[0];

		// Populate inputs with existing info
		id_product.value = product.id_product;
		name.value = product.name;
		description.value = product.description;
		price.value = product.price;

		for (let i = 0; i < categories.length; i++)
			if (categories[i] == product.category) category.selectedIndex = i;

		stock.value = product.stock;
		maxStock.value = product.max_stock;
		localLimit.value = product.local_limit;
		supplier.value = product.fk_supplier;

		if (product.image) {

			imagePreview.src = URL.createObjectURL(new Blob([product.image.buffer], {type: "image/png"}));
			imagePreview.style.display = 'block';
		}

		status.checked = product.status;

		// Button event
		buttonAccept.addEventListener('click', async (): Promise<void> => {
		
			try {

				checkInvalidStock();

				if (emptyInputs())
					throw {message: "No puede haber campos vacíos"};
				
				let imageRaw: string = null;
				if (imagePath.value != "")
					imageRaw = readFileSync(imagePath.value, null).toString('base64');

				let query =
				`UPDATE PRODUCT SET
				fk_supplier = '${supplier.value}', name = '${name.value}', description = '${description.value}',
				price = '${price.value}', category = '${category.value}', stock = '${stock.value}',
				max_stock = '${maxStock.value}', local_limit = '${localLimit.value}', status = '${status.checked}'`
				+ ((imageRaw) ? (`, image = (DECODE('${imageRaw}', 'base64')) WHERE id_product = ${main.aux.id};`) : (` WHERE id_product = ${main.aux.id};`));

				console.log(query);
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
				getCurrentWindow().close();
		
			} catch (error: any) {
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		
		});

	}

}
MAIN();

function emptyInputs(): boolean
{
	let inputs = document.getElementsByTagName('input');
	for (const i of inputs)
	{	
		// Ignore
		if (i.id == 'image')
			continue;

		if (i.value == '')
			return true;
	}

	return false;
}

function checkInvalidStock(): void
{
	if (parseInt(stock.value) > parseInt(maxStock.value))
		throw {message: "El stock actual no puede ser mayor al stock maximo"};
}
