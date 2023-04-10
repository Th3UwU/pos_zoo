psql postgres postgres
DROP DATABASE IF EXISTS ZOO;

CREATE DATABASE ZOO
	WITH ENCODING='UTF8';

exit
psql zoo postgres

-- CLIENT TABLE
CREATE TABLE SUPPLIER
(
	-- PRIMARY KEY
	ID_SUPPLIER INTEGER PRIMARY KEY,

	-- INFO
	NAME TEXT NOT NULL,
	ADDRESS TEXT DEFAULT NULL,
	TEL BIGINT DEFAULT NULL,
	IMAGE BYTEA DEFAULT NULL,
	STATUS BOOLEAN DEFAULT TRUE
);

-- SUPPLIER EXAMPLES
INSERT INTO SUPPLIER VALUES(0, 'DEFAULT', DEFAULT, DEFAULT, DEFAULT);
INSERT INTO SUPPLIER VALUES((SELECT MAX(ID_SUPPLIER) FROM SUPPLIER) + 1, 'Lala', 'Anillo Perif. Sur Manuel Gómez Morín 6201, Lopez Cotilla, 45610 San Pedro Tlaquepaque, Jal.', 3336684956, DEFAULT);
INSERT INTO SUPPLIER VALUES((SELECT MAX(ID_SUPPLIER) FROM SUPPLIER) + 1, 'SuKarne', 'Av. Belisario Domínguez #1195 esquina, Monte Ajusco, Lomas Independencia, 44340 Guadalajara, Jal.', 3338529213, DEFAULT);
INSERT INTO SUPPLIER VALUES((SELECT MAX(ID_SUPPLIER) FROM SUPPLIER) + 1, 'Distrito Max', 'Calle Norte sur 4 Juguetimax, Alce Blanco, 53370 Naucalpan de Juárez, Méx.', 5585268273, DEFAULT);
INSERT INTO SUPPLIER VALUES((SELECT MAX(ID_SUPPLIER) FROM SUPPLIER) + 1, 'Materias primas Guadalajara', 'Av. Chicalote 2579 D, Comercial Abastos, 44530 Guadalajara, Jal.', 3336713232, DEFAULT);

-- PRODUCT TABLE
CREATE TABLE PRODUCT
(
	-- PRIMARY KEY
	ID_PRODUCT INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_SUPPLIER INTEGER REFERENCES SUPPLIER (ID_SUPPLIER),

	-- INFO
	NAME TEXT UNIQUE NOT NULL,
	DESCRIPTION TEXT NOT NULL,
	PRICE REAL NOT NULL,
	CATEGORY TEXT NOT NULL,
	STOCK INTEGER NOT NULL,
	MAX_STOCK INTEGER NOT NULL,
	LOCAL_LIMIT INTEGER NOT NULL,
	STATUS BOOLEAN NOT NULL DEFAULT TRUE,
	IMAGE BYTEA DEFAULT NULL
);

-- PRODUCT EXAMPLES
INSERT INTO PRODUCT VALUES(0, 0, 'DEFAULT', 'DEFAULT', 0.0, 'DEFAULT', 0, 0, 0, DEFAULT, DEFAULT);
INSERT INTO PRODUCT VALUES((SELECT MAX(ID_PRODUCT) FROM PRODUCT) + 1, 0, 'Animales y su alimentación', 'Libro de animales etc etc', 120.5, 'libro', 45, 100, 10, DEFAULT, DEFAULT);
INSERT INTO PRODUCT VALUES((SELECT MAX(ID_PRODUCT) FROM PRODUCT) + 1, 0, 'Peluche de león', 'Es un peluche', 150.0, 'peluche', 25, 100, 10, DEFAULT, DEFAULT);

-- STORE
CREATE TABLE STORE
(
	-- PRIMARY KEY
	ID_STORE INTEGER PRIMARY KEY,

	-- INFO
	LOCATION TEXT NOT NULL,
	TYPE TEXT NOT NULL,
	HOURS TEXT NOT NULL,
	STATUS BOOLEAN NOT NULL DEFAULT TRUE
);

-- STORE EXAMPLES
INSERT INTO STORE VALUES(0, 'DEFAULT', 'DEFAULT', 'DEFAULT', DEFAULT);
INSERT INTO STORE VALUES((SELECT MAX(ID_STORE) FROM STORE) + 1, 'Acuario', 'dulceria', '9:00 - 18:00', DEFAULT);
INSERT INTO STORE VALUES((SELECT MAX(ID_STORE) FROM STORE) + 1, 'Zona reptiles', 'restaurante', '9:00 - 18:00', DEFAULT);

-- EMPLOYEE
CREATE TABLE EMPLOYEE
(
	-- PRIMARY KEY
	ID_EMPLOYEE INTEGER PRIMARY KEY,

	-- INFO
	PASS TEXT NOT NULL,
	CURP TEXT UNIQUE NOT NULL,
	FIRST_NAME TEXT NOT NULL,
	LAST_NAME TEXT NOT NULL,
	ADDRESS TEXT NOT NULL,
	NSS TEXT NOT NULL,
	ROLE TEXT NOT NULL,
	CV BYTEA DEFAULT NULL,
	STATUS BOOLEAN NOT NULL DEFAULT TRUE
);

-- EMPLOYEE EXAMPLES
INSERT INTO EMPLOYEE VALUES(0, 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', DEFAULT, DEFAULT);
INSERT INTO EMPLOYEE VALUES(1, '123', 'SUTA743264', 'Ángel Emmanuel', 'Suárez Torres', 'Av. Lopez Mateos #1412', '138092187198', 'ventas', DEFAULT, DEFAULT);

-- SALE
CREATE TABLE SALE
(
	-- PRIMARY KEY
	ID_SALE INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_EMPLOYEE INTEGER REFERENCES EMPLOYEE (ID_EMPLOYEE),

	-- INFO
	DATE DATE NOT NULL DEFAULT NOW()
);

-- SALE DETAIL
CREATE TABLE SALE_DETAIL
(
	-- PRIMARY KEY
	ID_SALE_DETAIL INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_SALE INTEGER REFERENCES SALE (ID_SALE),
	FK_PRODUCT INTEGER REFERENCES PRODUCT (ID_PRODUCT),

	-- INFO
	AMOUNT INTEGER NOT NULL CHECK (AMOUNT > 0),
	COST REAL NOT NULL CHECK (COST >= 0.0)
);

-- PURCHASE
CREATE TABLE PURCHASE
(
	-- PRIMARY KEY
	ID_PURCHASE INTEGER PRIMARY KEY,

	-- INFO
	DATE DATE NOT NULL DEFAULT NOW(),
	STATUS CHAR NOT NULL DEFAULT 'p'
);

-- PURCHASE DETAIL
CREATE TABLE PURCHASE_DETAIL
(
	-- PRIMARY KEY
	ID_PURCHASE_DETAIL INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_PURCHASE INTEGER REFERENCES PURCHASE (ID_PURCHASE),
	FK_PRODUCT INTEGER REFERENCES PRODUCT (ID_PRODUCT),

	-- INFO
	AMOUNT INTEGER NOT NULL CHECK (AMOUNT > 0),
	COST REAL NOT NULL CHECK (COST >= 0.0)
);

-- RETURN
CREATE TABLE RETURN
(
	-- PRIMARY KEY
	ID_RETURN INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_SALE INTEGER REFERENCES SALE (ID_SALE),

	-- INFO
	DATE DATE NOT NULL DEFAULT NOW()
);

-- RETURN DETAIL
CREATE TABLE RETURN_DETAIL
(
	-- PRIMARY KEY
	ID_PURCHASE_DETAIL INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_RETURN INTEGER REFERENCES RETURN (ID_RETURN),
	FK_PRODUCT INTEGER REFERENCES PRODUCT (ID_PRODUCT),

	-- INFO
	AMOUNT INTEGER NOT NULL CHECK (AMOUNT > 0),
	REASON TEXT NOT NULL
);

-- PRODUCT ORDER
CREATE TABLE PRODUCT_ORDER
(
	-- PRIMARY KEY
	ID_PRODUCT_ORDER INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_EMPLOYEE INTEGER REFERENCES EMPLOYEE (ID_EMPLOYEE),
	FK_STORE INTEGER REFERENCES STORE (ID_STORE),

	-- INFO
	DATE DATE NOT NULL DEFAULT NOW(),
	STATUS CHAR NOT NULL DEFAULT 'p'
);

-- PRODUCT ORDER DETAIL
CREATE TABLE PRODUCT_ORDER_DETAIL
(
	-- PRIMARY KEY
	ID_PRODUCT_ORDER_DETAIL INTEGER PRIMARY KEY,

	-- FOREIGN KEY
	FK_PRODUCT_ORDER INTEGER REFERENCES PRODUCT_ORDER (ID_PRODUCT_ORDER),
	FK_PRODUCT INTEGER REFERENCES PRODUCT (ID_PRODUCT),

	-- INFO
	AMOUNT INTEGER NOT NULL CHECK (AMOUNT > 0)
);
