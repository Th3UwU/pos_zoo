import { getCurrentWindow, dialog } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { readFileSync } from 'fs';

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