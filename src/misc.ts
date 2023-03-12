import { BrowserWindow, dialog } from "electron";

function alertMessage(window: BrowserWindow, options: Electron.MessageBoxOptions)
{
	dialog.showMessageBoxSync(window, options);
}

export { alertMessage };