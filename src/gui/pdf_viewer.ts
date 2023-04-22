import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import Main from '../main';

let main: Main = getGlobal('main');
let pdfPreview = document.getElementById('pdfPreview') as HTMLIFrameElement;

window.addEventListener('DOMContentLoaded', (): void => {
	pdfPreview.src = main.aux.url;
})