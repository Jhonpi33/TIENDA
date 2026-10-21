// ---------------------------------------------------------------------------
// GENERADOR DE CÓDIGOS CONSECUTIVOS
// Un único punto de verdad para los identificadores visibles del sistema:
//   Producto  -> PRD-001, PRD-002, ...
//   Movimiento-> MOV-001, MOV-002, ... (entrada, salida o ajuste)
//
// Cómo funciona: se busca el MAYOR número existente para ese prefijo y se
// devuelve el siguiente, con relleno de ceros para que siempre midan lo mismo
// y queden ordenados alfabéticamente. El índice único del modelo es la última
// línea de defensa: si dos altas simultáneas calculan el mismo número, una
// falla con 409 en lugar de dejar dos registros con el mismo código.
// ---------------------------------------------------------------------------

/**
 * Devuelve el número más alto registrado para un prefijo, o 0 si no hay
 * ninguno. Es el punto de partida para encadenar códigos en memoria (útil
 * cuando se insertan varios documentos en bloque y consultar la base entre
 * cada uno devolvería siempre el mismo número).
 * @param {mongoose.Model} Modelo  modelo de Mongoose con el campo `codigo`.
 * @param {string}         prefijo prefijo del código, sin números (ej. 'MOV-').
 * @returns {Promise<number>} el mayor número encontrado, o 0.
 */
export async function obtenerUltimoNumero(Modelo, prefijo) {
    // Se extrae la parte numérica con una agregación y se ordena de forma
    // NUMÉRICA. Un orden alfabético fallaría al pasar de 999: "MOV-999"
    // quedaría por delante de "MOV-1000" y se reasignaría un código ya usado.
    const [resultado] = await Modelo.aggregate([
        {
            $match: {
                codigo: { $regex: `^${prefijo}\\d+$` }
            }
        },
        {
            $project: {
                // Subcadena después del prefijo, convertida a número entero
                numero: {
                    $toInt: { $substrCP: [`$codigo`, prefijo.length, { $strLenCP: '$codigo' }] }
                }
            }
        },
        { $sort: { numero: -1 } },
        { $limit: 1 }
    ])

    const ultimoNumero = resultado?.numero

    return Number.isFinite(ultimoNumero) ? ultimoNumero : 0
}

/**
 * Da formato a un número para que sea un código visible: 'MOV-' + 3 -> 'MOV-014'.
 * @param {number} numero el número consecutivo.
 * @param {string} prefijo prefijo del código.
 * @param {number} ancho   dígitos de relleno (3 por defecto).
 * @returns {string} el código formateado.
 */
export function formarCodigo(numero, prefijo, ancho = 3) {
    return `${prefijo}${String(numero).padStart(ancho, '0')}`
}

/**
 * Devuelve el siguiente código para un prefijo dado, p. ej. 'MOV-' -> 'MOV-014'.
 * Útil para altas de UN ENTE por llamada (los controladores). Para insertar en
 * bloque, usar obtenerUltimoNumero + formarCodigo e ir incrementando en memoria.
 * @param {mongoose.Model} Modelo   modelo de Mongoose con el campo `codigo`.
 * @param {string}         prefijo  prefijo del código, sin números (ej. 'MOV-').
 * @param {number}         ancho    dígitos de relleno (3 por defecto).
 * @returns {Promise<string>} el próximo código único.
 */
export async function generarCodigoConsecutivo(Modelo, prefijo, ancho = 3) {
    const ultimoNumero = await obtenerUltimoNumero(Modelo, prefijo)

    return formarCodigo(ultimoNumero + 1, prefijo, ancho)
}
