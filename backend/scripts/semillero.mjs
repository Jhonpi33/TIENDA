// ---------------------------------------------------------------------------
// SEMILLERO DE DATOS DE EJEMPLO
// Se ejecuta con el backend corriendo o parado (usa mongoose en directo):
//
//   npm run semilla            // crea los datos si aún no existen
//   npm run semilla -- --force // los vuelve a crear desde cero
//
// Qué inserta:
//   - 15 categorías
//   - 15 proveedores   (cada uno con UUID como _id, igual que la app)
//   - 15 productos     (código PRD-### ligado a su categoría y proveedor)
//   - movimientos      (códigos MOV-###) que además DEJAN EL STOCK CUADRADO:
//                       la `cantidad` final de cada producto es exactamente
//                       la suma de sus entradas menos sus salidas.
//
// Es IDEMPOTENTE: guarda una marca en la colección `semillas`, así que un
// segundo `npm run semilla` no duplica nada. Con --force borra sólo los
// registros que creó esta misma semilla (reconocibles por sus nombres) y los
// vuelve a insertar. Jamás toca datos que hayas cargado a mano.
// ---------------------------------------------------------------------------
import 'dotenv/config'
import mongoose from 'mongoose'

import { Categoria } from '../src/models/Categoria.js'
import { Proveedor } from '../src/models/Proveedor.js'
import { Producto } from '../src/models/Producto.js'
import { Movimiento } from '../src/models/Movimiento.js'
import { obtenerUltimoNumero, formarCodigo } from '../src/utils/codigos.js'

// Marca de esta semilla dentro de la colección `semillas` (no es un modelo
// de la app, sólo un cuaderno de control para no repetir el trabajo).
const MARCA_SEMILLA = 'tienda-ejemplo-v1'

// ---------------------------------------------------------------------------
// DATOS
// ---------------------------------------------------------------------------

const CATEGORIAS = [
    'Bebidas',
    'Snacks',
    'Lácteos',
    'Panadería',
    'Carnes y embutidos',
    'Frutas y verduras',
    'Abarrotes',
    'Limpieza del hogar',
    'Higiene personal',
    'Papelería',
    'Congelados',
    'Conservas',
    'Infantil',
    'Mascotas',
    'Bebidas energéticas'
]

const PROVEEDORES = [
    {
        nombre: 'Distribuciones El Éxito SAS',
        telefono: '601 421 5500',
        email: 'pedidos@delexito.com.co',
        direccion: 'Cra. 33 # 18A-25, Bogotá D.C.'
    },
    {
        nombre: 'Alimentos del Valle',
        telefono: '602 488 1020',
        email: 'contacto@alimentosdelvalle.co',
        direccion: 'Cl. 36 # 10-45, Cali, Valle del Cauca'
    },
    {
        nombre: 'Comercializadora Andina',
        telefono: '604 444 7812',
        email: 'ventas@comandina.com',
        direccion: 'Cra. 43 # 7-50, Medellín, Antioquia'
    },
    {
        nombre: 'Lácteos La Sabana',
        telefono: '601 893 4477',
        email: 'info@lacteossabana.co',
        direccion: 'Autop. Norte Km 22, Chía, Cundinamarca'
    },
    {
        nombre: 'Distribuidora El Trapiche',
        telefono: '605 765 3390',
        email: 'contacto@trapiche.com.co',
        direccion: 'Cl. 72 # 39-14, Barranquilla, Atlántico'
    },
    {
        nombre: 'Importadora del Caribe',
        telefono: '605 341 2208',
        email: 'import@delcaribe.co',
        direccion: 'Cra. 53 # 8-120, Barranquilla, Atlántico'
    },
    {
        nombre: 'Panificadora San Jorge',
        telefono: '601 742 6611',
        email: 'produccion@pansanjorge.com',
        direccion: 'Cl. 18 # 68-32, Bogotá D.C.'
    },
    {
        nombre: 'Frutas Premium de Colombia',
        telefono: '604 512 9083',
        email: 'export@frutaspremium.co',
        direccion: 'Zona Franca, Rionegro, Antioquia'
    },
    {
        nombre: 'Limpieza Total SAS',
        telefono: '602 660 4419',
        email: 'ventas@limpiezatotal.com.co',
        direccion: 'Cra. 29 # 8-11, Cali, Valle del Cauca'
    },
    {
        nombre: 'Droguería La Rebaña',
        telefono: '601 234 8890',
        email: 'administracion@larebana.co',
        direccion: 'Cl. 13 # 5-60, Tunja, Boyacá'
    },
    {
        nombre: 'Papelería Escolar Moderna',
        telefono: '604 429 1177',
        email: 'pedidos@papeleriamoderna.com',
        direccion: 'Cra. 45 # 90-21, Medellín, Antioquia'
    },
    {
        nombre: 'Congelados del Norte',
        telefono: '605 372 5544',
        email: 'logistica@congeladosnorte.co',
        direccion: 'Cl. 29 # 12-78, Santa Marta, Magdalena'
    },
    {
        nombre: 'Conservas Gourmet Andes',
        telefono: '601 517 3302',
        email: 'contacto@conservasgourmet.co',
        direccion: 'Cra. 11 # 93-42, Bogotá D.C.'
    },
    {
        nombre: 'Bebidas Energéticas Max Power',
        telefono: '604 604 2233',
        email: 'colombia@maxpower.com',
        direccion: 'Zona Industrial, Itagüí, Antioquia'
    },
    {
        nombre: 'Mascotas Felices Distribución',
        telefono: '602 318 7744',
        email: 'ventas@mascotasfelices.co',
        direccion: 'Cl. 5 # 44-19, Palmira, Valle del Cauca'
    }
]

// precios en COP. `entrada` es el stock inicial que entra por MOVIMIENTO: la
// `cantidad` del producto NO se fija aquí, se calcula al generar el historial.
const PRODUCTOS = [
    { nombre: 'Gaseosa Coca-Cola 1.5 L', compra: 3200, venta: 4500, stockMinimo: 10, entrada: 60 },
    { nombre: 'Papas Margarita 150 g', compra: 1800, venta: 2800, stockMinimo: 15, entrada: 80 },
    { nombre: 'Leche Alquería entera 1 L', compra: 2900, venta: 3900, stockMinimo: 12, entrada: 48 },
    { nombre: 'Pan tajado Bimbo 500 g', compra: 2600, venta: 3600, stockMinimo: 10, entrada: 40 },
    { nombre: 'Pechuga de pollo fresca 1 kg', compra: 8500, venta: 11500, stockMinimo: 5, entrada: 25 },
    { nombre: 'Banano orgánico 1 kg', compra: 2200, venta: 3400, stockMinimo: 8, entrada: 35 },
    { nombre: 'Arroz Diana 1 kg', compra: 2400, venta: 3300, stockMinimo: 20, entrada: 90 },
    { nombre: 'Aceite Girasol 1 L', compra: 6800, venta: 8900, stockMinimo: 8, entrada: 30 },
    { nombre: 'Jabón de baño Palmolive 200 g', compra: 3100, venta: 4400, stockMinimo: 10, entrada: 45 },
    { nombre: 'Papel higiénico Familia 4 rollos', compra: 5400, venta: 7200, stockMinimo: 12, entrada: 50 },
    { nombre: 'Cuaderno argollino 100 hojas', compra: 2800, venta: 4200, stockMinimo: 15, entrada: 70 },
    { nombre: 'Marmita de pollo Gourmet 400 g', compra: 7200, venta: 9800, stockMinimo: 6, entrada: 28 },
    { nombre: 'Atún Van Camps 160 g', compra: 3900, venta: 5400, stockMinimo: 10, entrada: 55 },
    { nombre: 'Cerámica de gato Tolon 10 kg', compra: 9800, venta: 13500, stockMinimo: 5, entrada: 20 },
    { nombre: 'Energizante Volt 500 ml', compra: 2700, venta: 4000, stockMinimo: 12, entrada: 65 }
]

// ---------------------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------------------

// Devuelve { existentes, faltantes } separando una lista de nombres según si
// ya hay un registro con ese nombre en la base.
//
// La comparación es INSENSIBLE a mayúsculas, igual que el índice único de los
// modelos (collation 'es' con strength 2). Sin esto, un semillero que quiere
// crear "Bebidas" estallaría con un duplicado si el usuario ya tiene "bebidas".
async function separarExistentes(Modelo, nombres) {
    const existentesEnBase = await Modelo.find()
        .select({ nombre: 1 })
        .collation({ locale: 'es', strength: 2 })
        .lean()

    const porNombreNormalizado = new Map(
        existentesEnBase.map((doc) => [String(doc.nombre).trim().toLowerCase(), doc])
    )

    const existentes = []
    const faltantes = []

    for (const nombre of nombres) {
        const coincidencia = porNombreNormalizado.get(nombre.trim().toLowerCase())

        if (coincidencia) {
            existentes.push(coincidencia)
        } else {
            faltantes.push(nombre)
        }
    }

    return { existentes, faltantes }
}

// Devuelve una fecha repartida en los últimos `dias` días, con la hora
// desordenada para que la tabla de movimientos no parezca artificial.
// Se usa un desplazamiento fijo por índice (nada de Math.random): la semilla
// debe producir SIEMPRE datos con la misma forma.
function fechaReciente(indice, dias = 30) {
    const msPorDia = 24 * 60 * 60 * 1000
    const ahora = Date.now()

    const diasAtras = (indice * 3) % dias
    const horasAtras = (indice * 7) % 23
    const minutosAtras = (indice * 13) % 59

    return new Date(
        ahora
        - (diasAtras * msPorDia)
        - (horasAtras * 60 * 60 * 1000)
        - (minutosAtras * 60 * 1000)
    )
}

// Borra SOLO lo que creó esta semilla. Se apoya en los nombres EXACTOS de las
// listas de arriba, así que los datos del usuario quedan intactos.
// El orden importa: primero los movimientos (referencian productos), luego
// productos (referencian categorías y proveedores) y al final los catálogos.
async function borrarDatosDeLaSemilla() {
    const productos = await Producto.find({
        nombre: { $in: PRODUCTOS.map((p) => p.nombre) }
    })
        .select({ _id: 1 })
        .lean()

    const ids = productos.map((p) => p._id)

    let borrados = 0

    if (ids.length > 0) {
        const movimientos = await Movimiento.deleteMany({ productoId: { $in: ids } })
        borrados += movimientos.deletedCount

        const borradosProductos = await Producto.deleteMany({ _id: { $in: ids } })
        borrados += borradosProductos.deletedCount
    }

    const categorias = await Categoria.deleteMany({ nombre: { $in: CATEGORIAS } })
    borrados += categorias.deletedCount

    const proveedores = await Proveedor.deleteMany({ nombre: { $in: PROVEEDORES } })
    borrados += proveedores.deletedCount

    return borrados
}

// ---------------------------------------------------------------------------
// PRINCIPAL
// ---------------------------------------------------------------------------

async function sembrar({ forzar } = {}) {
    const uri = process.env.MONGODB_URI

    if (!uri) {
        console.error('[SEMILLA] Falta MONGODB_URI en backend/.env.')
        process.exit(1)
    }

    await mongoose.connect(uri)
    console.log('[SEMILLA] Conectado a MongoDB.')

    try {
        const yaSembrada = await mongoose.connection
            .collection('semillas')
            .findOne({ _id: MARCA_SEMILLA })

        if (yaSembrada && !forzar) {
            console.log('[SEMILLA] Los datos de ejemplo ya existen.')
            console.log('[SEMILLA] Usa "npm run semilla -- --force" para volver a crearlos.')
            return
        }

        if (forzar) {
            const borrados = await borrarDatosDeLaSemilla()
            console.log(`[SEMILLA] --force: borrados ${borrados} registros anteriores de la semilla.`)
        }

        // --- CATEGORÍAS -----------------------------------------------------
        // Se apoya en lo que YA exista en la base: si el usuario ya tiene
        // "bebidas", no se vuelve a crear "Bebidas" (el índice único no
        // distingue mayúsculas y rechazaría el duplicado). Las que sí faltan
        // se insertan en bloque para poder guardar su _id.
        const cat = await separarExistentes(Categoria, CATEGORIAS)

        const creadas = cat.faltantes.length > 0
            ? await Categoria.insertMany(cat.faltantes.map((nombre) => ({ nombre, activo: true })))
            : []

        // Se ordenan por nombre para que el reparto en los productos sea
        // estable, haya o no categorías preexistentes.
        const categorias = [...cat.existentes, ...creadas]
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))

        console.log(
            `[SEMILLA] Categorías: ${creadas.length} creadas, `
            + `${cat.existentes.length} reutilizadas (${categorias.length} en total).`
        )

        // --- PROVEEDORES ----------------------------------------------------
        // El _id es un UUID que genera el propio modelo, igual que en la app.
        const prov = await separarExistentes(Proveedor, PROVEEDORES.map((p) => p.nombre))

        // Se recuperan los completos de los que ya existían (se guardó sólo
        // el nombre) para poder reutilizarlos igual que los nuevos.
        const proveedoresExistentes = prov.existentes.length > 0
            ? await Proveedor.find({ _id: { $in: prov.existentes.map((p) => p._id) } }).lean()
            : []

        const proveedoresCreados = prov.faltantes.length > 0
            ? await Proveedor.insertMany(
                PROVEEDORES
                    .filter((p) => prov.faltantes.includes(p.nombre))
                    .map((datos) => ({ ...datos, activo: true }))
            )
            : []

        const proveedores = [...proveedoresExistentes, ...proveedoresCreados]
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))

        console.log(
            `[SEMILLA] Proveedores: ${proveedoresCreados.length} creados, `
            + `${proveedoresExistentes.length} reutilizados (${proveedores.length} en total).`
        )

        // --- PRODUCTOS ------------------------------------------------------
        // Los códigos PRD-### se encadenan EN MEMORIA a partir del mayor que
        // ya exista en la base. Generarlos consultando la base dentro de un
        // bucle sin insertar daría el MISMO código a los 15 y el índice único
        // rechazaría el resto.
        const prod = await separarExistentes(Producto, PRODUCTOS.map((p) => p.nombre))

        let numeroProducto = await obtenerUltimoNumero(Producto, 'PRD-')

        // Sólo se crean y se mueven los productos NUEVOS. Los que ya existían
        // son datos del usuario: la semilla no les agrega stock ni historial.
        const productosNuevos = []

        for (let i = 0; i < PRODUCTOS.length; i += 1) {
            const datos = PRODUCTOS[i]

            // Si el usuario ya cargó un producto con ese nombre, se respeta:
            // la semilla no pisa datos reales.
            if (!prod.faltantes.includes(datos.nombre)) {
                continue
            }

            numeroProducto += 1

            // El stock arranca en 0: se carga con MOVIMIENTOS, así la
            // `cantidad` del producto queda explicada por el historial.
            const producto = await Producto.create({
                codigo: formarCodigo(numeroProducto, 'PRD-'),
                nombre: datos.nombre,
                categoriaId: categorias[i % categorias.length]._id,
                proveedorId: proveedores[i % proveedores.length]._id,
                precioCompra: datos.compra,
                precioVenta: datos.venta,
                cantidad: 0,
                stockMinimo: datos.stockMinimo
            })

            productosNuevos.push(producto)
        }

        console.log(
            `[SEMILLA] Productos: ${productosNuevos.length} creados, `
            + `${prod.existentes.length} reutilizados sin tocar.`
        )

        // --- MOVIMIENTOS ----------------------------------------------------
        // Mismo criterio que con los productos: el número MOV-### se encadena
        // en memoria y sólo al final se insertan todos de una sola vez.
        let numeroMovimiento = await obtenerUltimoNumero(Movimiento, 'MOV-')

        const movimientos = []
        let indiceFecha = 0

        for (let i = 0; i < productosNuevos.length; i += 1) {
            const producto = productosNuevos[i]

            // Se busca el plan por NOMBRE: la lista `productosNuevos` puede
            // contener menos elementos que PRODUCTOS (si alguno ya existía),
            // así que nunca se empareja por posición.
            const plan = PRODUCTOS.find((p) => p.nombre === producto.nombre)

            if (!plan) {
                continue
            }

            // Una ENTRADA inicial con todo el stock disponible
            numeroMovimiento += 1

            movimientos.push({
                codigo: formarCodigo(numeroMovimiento, 'MOV-'),
                productoId: producto._id,
                tipo: 'entrada',
                cantidad: plan.entrada,
                fecha: fechaReciente(indiceFecha)
            })
            indiceFecha += 1

            let stock = plan.entrada

            // Unas salidas repartidas: cuántas depende del propio índice, para
            // que el resultado sea determinista y distinto entre productos.
            // Nunca se sale más de lo que hay en stock.
            const salidas = 1 + (i % 3)

            for (let s = 0; s < salidas && stock > 0; s += 1) {
                // 1..4 unidades por salida, acotadas al stock disponible
                const cantidad = Math.min(1 + ((i + s) % 4), stock)

                numeroMovimiento += 1

                movimientos.push({
                    codigo: formarCodigo(numeroMovimiento, 'MOV-'),
                    productoId: producto._id,
                    tipo: 'salida',
                    cantidad,
                    fecha: fechaReciente(indiceFecha)
                })
                indiceFecha += 1

                stock -= cantidad
            }

            // El stock final del producto es lo que quedó tras sus movimientos
            producto.cantidad = stock
        }

        if (movimientos.length > 0) {
            await Movimiento.insertMany(movimientos)

            // Se guardan los stock finales ya calculados. Sin esto, el
            // historial diría "entrada 60 - salidas 7" pero el producto
            // mostraría 0. Sólo se tocan los productos creados aquí (son
            // documentos de Mongoose, los preexistentes son objetos planos).
            await Promise.all(productosNuevos.map((producto) => producto.save()))
        }

        console.log(
            `[SEMILLA] ${movimientos.length} movimientos creados `
            + '(códigos MOV-###, entrada inicial y salidas).'
        )

        // Marca de control: evita duplicar en la próxima corrida.
        await mongoose.connection.collection('semillas').updateOne(
            { _id: MARCA_SEMILLA },
            { $set: { creadaEn: new Date(), detalle: 'semilla de ejemplo' } },
            { upsert: true }
        )

        console.log('[SEMILLA] Listo. El stock de cada producto cuadra con sus movimientos.')
    } finally {
        await mongoose.disconnect()
        console.log('[SEMILLA] Conexión cerrada.')
    }
}

// node scripts/semillero.mjs [--force]
const forzar = process.argv.includes('--force')

sembrar({ forzar }).catch((error) => {
    console.error('[SEMILLA] Falló el semillero:', error.message)
    process.exit(1)
})
