import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';

let aux: any = getGlobal('aux');
let pdfPreview = document.getElementById('pdfPreview') as HTMLIFrameElement;

window.addEventListener('DOMContentLoaded', (): void => {
	pdfPreview.src = aux.url;
})