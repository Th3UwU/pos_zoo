import { getCurrentWindow } from '@electron/remote';

let parent: Electron.BrowserWindow = getCurrentWindow().getParentWindow();

let buttons: HTMLCollectionOf<HTMLButtonElement> = document.getElementsByTagName('button');
for (const b of buttons) {
	b.addEventListener('click', () => {
		let code: string = 
		`
			document.getElementById('supplier').value = '${b.innerHTML}';
		`
		parent.webContents.executeJavaScript(code);
	});
}

