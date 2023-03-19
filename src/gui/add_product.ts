import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';
import Main from '../main';
import Window from '../window';

let main: Main = getGlobal('main');

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

let categorySelect = document.getElementById('category') as HTMLSelectElement;
for (const c of categories) {
	let option = document.createElement('option') as HTMLOptionElement;
	option.value = c;
	option.text = c;
	categorySelect.add(option);
}

let buttonSupplier = document.getElementById('buttonSupplier') as HTMLButtonElement;
buttonSupplier.addEventListener('click', () => {
	main.createWindow(800, 600, 'gui/select.html', getCurrentWindow());
});

const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir imagen', properties: ['openFile']};

let inputImage = document.getElementById('image') as HTMLInputElement;
let buttonImage = document.getElementById('buttonImage') as HTMLButtonElement;
let imagePreview = document.getElementById('imagePreview') as HTMLImageElement;

buttonImage.addEventListener('click', () => {
	let dialogResult: string[] = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

	if (dialogResult != undefined)
	{
		let imagePath: string = dialogResult[0];
		inputImage.value = imagePath;
		
		imagePreview.src = imagePath;
		imagePreview.style.display = 'block';

		let imageRaw: Buffer = readFileSync(imagePath, null);
		console.log(imageRaw[4]);
	}
});