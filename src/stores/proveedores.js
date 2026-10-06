import { defineStore } from "pinia";

// ---------------------------------------------------------------------------
// VALIDACIÓN DE DATOS DEL PROVEEDOR (fuente de verdad)
// Devuelve los datos ya recortados, o null si no son válidos.
//
// Reglas (las mismas que ya imponía el formulario, ahora también en el store):
// - los 4 campos son obligatorios (nombre, teléfono, correo y dirección)
// - el nombre no puede estar duplicado: se ignoran mayúsculas/minúsculas y
//   espacios exteriores. "idExcluido" permite editar un proveedor sin que
//   su propio nombre se tome como duplicado.
// ---------------------------------------------------------------------------
function prepararProveedor(datos, proveedores, idExcluido = null) {
    if (!datos || typeof datos !== 'object') {
        return null
    }

    const limpiar = (valor) => String(valor ?? '').trim()

    const nombre = limpiar(datos.nombre)
    const telefono = limpiar(datos.telefono)
    const email = limpiar(datos.email)
    const direccion = limpiar(datos.direccion)

    if (!nombre || !telefono || !email || !direccion) {
        return null
    }

    const yaExiste = proveedores.some((proveedor) => {
        if (idExcluido !== null && Number(proveedor.id) === Number(idExcluido)) {
            return false
        }

        return String(proveedor.nombre).trim().toLowerCase() === nombre.toLowerCase()
    })

    if (yaExiste) {
        return null
    }

    return { nombre, telefono, email, direccion }
}

export const useProveedoresStore = defineStore('proveedores', {
    state: () => ({
        proveedores: [
            {
                id: 1,
                nombre: 'Distribuciones La Economía',
                telefono: '3001234567',
                email: 'contacto@economia.com',
                direccion: 'Calle 10 # 20-30'
            },
            {
                id: 2,
                nombre: 'Bebidas Colombia',
                telefono: '3019876543',
                email: 'ventas@bebidascolombia.com',
                direccion: 'Carrera 15 # 40-20'
            },
            {
                id: 3,
                nombre: 'Alimentos del Valle',
                telefono: '3104567890',
                email: 'ventas@alimentosvalle.com',
                direccion: 'Calle 25 # 12-15'
            }
        ]
    }),
    getters: {
        totalProveedores: (state) => {
            return state.proveedores.length
        }
    },
    actions: {
        // Devuelve el proveedor creado, o null si los datos no son válidos.
        // Se construyen SOLO los 4 campos permitidos: así un id o una clave
        // extra enviada por error nunca puede pisar el id autogenerado.
        crearProveedor(datos) {
            const datosValidos = prepararProveedor(datos, this.proveedores)

            if (!datosValidos) {
                return null
            }

            const nuevoId = this.proveedores.length > 0
                ? Math.max(...this.proveedores.map(proveedor => proveedor.id)) + 1
                : 1

            const nuevoProveedor = {
                id: nuevoId,
                ...datosValidos
            }
            this.proveedores.push(nuevoProveedor)
            return nuevoProveedor
        },
        obtenerProveedorPorId(id) {
            return this.proveedores.find(proveedor => proveedor.id === Number(id))
        },
        // Devuelve el proveedor actualizado, o null si el id no existe
        // o si los datos no pasan las validaciones (vacíos o duplicados).
        editarProveedor(id, datosActualizados) {
            const indice = this.proveedores.findIndex(proveedor => proveedor.id === Number(id))
            if (indice === -1) {
                return null
            }

            // Se validan los datos FINALES: los originales reemplazados por
            // los nuevos, normalizados (trim) y con el duplicado excluyendo
            // al propio proveedor para que conserve su nombre.
            const datosValidos = prepararProveedor(
                { ...this.proveedores[indice], ...datosActualizados },
                this.proveedores,
                id
            )

            if (!datosValidos) {
                return null
            }

            this.proveedores[indice] = {
                ...this.proveedores[indice],
                ...datosValidos
            }
            return this.proveedores[indice]
        },
        eliminarProveedor(id) {
            const indice = this.proveedores.findIndex(proveedor => proveedor.id === Number(id))
            if (indice === -1) {
                return false
            }
            this.proveedores.splice(indice, 1)
            return true
        }
    },
    persist: true
})