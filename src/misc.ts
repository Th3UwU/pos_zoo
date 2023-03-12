import { BrowserWindow } from 'electron';
import { dialog } from '@electron/remote'

function alertMessage(window: BrowserWindow, options: Electron.MessageBoxOptions)
{
	dialog.showMessageBoxSync(window, options);
}

export { alertMessage };