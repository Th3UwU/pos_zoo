const fs = require("fs");
const {Client} = require("pg");

async function main()
{
	let data = null;

	let client = new Client
	({
		user: "postgres",
		host: "localhost",
		database: "zoo",
		port: 5432
	});
	await client.connect();

	let product_img =
	[
		"./res/products/p1.jpg",
		"./res/products/p2.jpg",
		"./res/products/p3.jpg",
		"./res/products/p4.jpg",
		"./res/products/p5.jpg",
		"./res/products/p6.jpg",
		"./res/products/p7.jpg",
		"./res/products/p8.jpg",
		"./res/products/p9.jpg",
		"./res/products/p10.jpg",
		"./res/products/p11.jpg",
		"./res/products/p12.jpg"
	];

	let product_index = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	for (let i = 0; i < product_img.length; i++)
	{
		data = fs.readFileSync(product_img[i], null).toString("base64");
		await client.query(`UPDATE PRODUCT SET IMAGE = (DECODE('${data}', 'base64')) WHERE ID_PRODUCT = ${product_index[i]};`);
	}

	let supplier_img =
	[
		"./res/supplier/s1.jpg",
		"./res/supplier/s2.jpg",
		"./res/supplier/s3.jpg"
	];

	let supplier_index = [1, 2, 3];
	for (let i = 0; i < supplier_img.length; i++)
	{
		data = fs.readFileSync(supplier_img[i], null).toString("base64");
		await client.query(`UPDATE SUPPLIER SET IMAGE = (DECODE('${data}', 'base64')) WHERE ID_SUPPLIER = ${supplier_index[i]};`);
	}

	let employee_cv =
	[
		"./res/cv/cv_01.pdf",
		"./res/cv/cv_02.pdf",
		"./res/cv/cv_03.pdf",
		"./res/cv/cv_04.pdf",
		"./res/cv/cv_05.pdf"
	];

	let employee_index = [1, 2, 3, 4, 5];
	for (let i = 0; i < employee_cv.length; i++)
	{
		data = fs.readFileSync(employee_cv[i], null).toString("base64");
		await client.query(`UPDATE EMPLOYEE SET CV = (DECODE('${data}', 'base64')) WHERE ID_EMPLOYEE = ${employee_index[i]};`);
	}


	await client.end();
}

main();
