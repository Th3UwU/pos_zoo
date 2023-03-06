const testDiv: HTMLElement = document.getElementById('test');
let newDiv: HTMLDivElement = document.createElement('div');
newDiv.appendChild(document.createTextNode("Hola!!"));

for (let i = 0; i < 10; i++) {
	testDiv.appendChild(newDiv.cloneNode(true));
}