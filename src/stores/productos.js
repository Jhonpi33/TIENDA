import { defineStore } from 'pinia'
import { useCategoriasStore } from './categorias'
import { useProveedoresStore } from './proveedores'

export const useProductosStore = defineStore('productos', {
    state: () => ({
        productos: [
            {
                id: 1,
                codigo: 'PRD-001',
                nombre: 'Jabón en polvo',
                categoriaId: 1,
                proveedorId: 1,
                precioCompra: 8000,
                precioVenta: 10000,
                cantidad: 0,
                stockMinimo: 5
            },
            {
                id: 2,
                codigo: 'PRD-002',
                nombre: 'Blanqueador',
                categoriaId: 1,
                proveedorId: 1,
                precioCompra: 5000,
                precioVenta: 7000,
                cantidad: 0,
                stockMinimo: 4
            },
            {
                id: 3,
                codigo: 'PRD-003',
                nombre: 'Agua botella',
                categoriaId: 2,
                proveedorId: 2,
                precioCompra: 1500,
                precioVenta: 2500,
                cantidad: 3,
                stockMinimo: 5
            },
            {
                id: 4,
                codigo: 'PRD-004',
                nombre: 'Lentejas',
                categoriaId: 3,
                proveedorId: 3,
                precioCompra: 3000,
                precioVenta: 4500,
                cantidad: 2,
                stockMinimo: 5
            },
            {
                id: 5,
                codigo: 'PRD-005',
                nombre: 'Arroz 1 kg',
                categoriaId: 3,
                proveedorId: 3,
                precioCompra: 3500,
                precioVenta: 5000,
                cantidad: 25,
                stockMinimo: 8
            },
            {
                id: 6,
                codigo: 'PRD-006',
                nombre: 'Gaseosa',
                categoriaId: 2,
                proveedorId: 2,
                precioCompra: 2500,
                precioVenta: 4000,
                cantidad: 40,
                stockMinimo: 10
            },
            {
                id: 7,
                codigo: 'PRD-007',
                nombre: 'Papel higiénico',
                categoriaId: 1,
                proveedorId: 1,
                precioCompra: 7000,
                precioVenta: 9500,
                cantidad: 30,
                stockMinimo: 8
            },
            {
                id: 8,
                codigo: 'PRD-008',
                nombre: 'Aceite 1 litro',
                categoriaId: 3,
                proveedorId: 3,
                precioCompra: 6500,
                precioVenta: 8500,
                cantidad: 20,
                stockMinimo: 6
            }
        ]
    }),

    getters: {
        totalProductos: (state) => {
            return state.productos.length
        },

        productosStockBajo: (state) => {
            return state.productos.filter(
                (producto) =>
                    producto.cantidad > 0 &&
                    producto.cantidad <= producto.stockMinimo
            )
        },

        productosAgotados: (state) => {
            return state.productos.filter(
                (producto) => producto.cantidad === 0
            )
        },

        unidadesDisponibles: (state) => {
            return state.productos.reduce(
                (total, producto) => total + producto.cantidad,
                0
            )
        },

        productosConCategoria: (state) => {
            const categoriasStore = useCategoriasStore()

            return state.productos.map((producto) => {
                const categoria = categoriasStore.obtenerCategoriaPorId(
                    producto.categoriaId
                )

                return {
                    ...producto,
                    categoriaNombre: categoria
                        ? categoria.nombre
                        : 'Sin categoría'
                }
            })
        },

        productosConProveedor: (state) => {
            const proveedoresStore = useProveedoresStore()

            return state.productos.map((producto) => {
                const proveedor = proveedoresStore.obtenerProveedorPorId(
                    producto.proveedorId
                )

                return {
                    ...producto,
                    proveedorNombre: proveedor
                        ? proveedor.nombre
                        : 'Sin proveedor'
                }
            })
        },

        productosCompletos: (state) => {
            const categoriasStore = useCategoriasStore()
            const proveedoresStore = useProveedoresStore()

            return state.productos.map((producto) => {
                const categoria = categoriasStore.obtenerCategoriaPorId(
                    producto.categoriaId
                )

                const proveedor = proveedoresStore.obtenerProveedorPorId(
                    producto.proveedorId
                )

                return {
                    ...producto,
                    categoriaNombre: categoria
                        ? categoria.nombre
                        : 'Sin categoría',
                    proveedorNombre: proveedor
                        ? proveedor.nombre
                        : 'Sin proveedor'
                }
            })
        }
    },

    actions: {
        // -----------------------------------------------------------------
        // Genera un código PRD-### único.
        // Antes se usaba productos.length + 1, lo que DUPLICABA códigos al
        // eliminar un producto (ej: borrar PRD-004 y crear otro generaba
        // otro PRD-004 si era el siguiente consecutivo).
        // Ahora se toma el mayor número existente + 1.
        // -----------------------------------------------------------------
        generarCodigo() {
            const prefijo = 'PRD-'

            const numerosExistentes = this.productos
                .map((producto) => String(producto.codigo || ''))
                .filter((codigo) => codigo.startsWith(prefijo))
                .map((codigo) => Number(codigo.slice(prefijo.length)))
                .filter((numero) => Number.isInteger(numero))

            const siguienteNumero =
                (numerosExistentes.length > 0
                    ? Math.max(...numerosExistentes)
                    : 0) + 1

            return `${prefijo}${String(siguienteNumero).padStart(3, '0')}`
        },

        // Genera un id numérico único. Date.now() solo puede chocar si se
        // crean dos productos en el mismo milisegundo, así que se verifica.
        generarId() {
            let id = Date.now()

            while (this.productos.some((producto) => producto.id === id)) {
                id += 1
            }

            return id
        },

        // Normaliza los datos del producto antes de guardarlo:
        // - texto recortado
        // - ids a number (o null cuando no vienen)
        // - números a number (evita que "10" + 5 sea "105")
        normalizarProducto(datos) {
            if (!datos || typeof datos !== 'object') {
                return null
            }

            const normalizarId = (valor) => {
                if (valor === null || valor === undefined || valor === '') {
                    return null
                }

                const numero = Number(valor)

                // "abc" u otros valores no numéricos también quedan como null
                return Number.isFinite(numero) ? numero : null
            }

            return {
                ...datos,
                nombre: String(datos.nombre ?? '').trim(),
                categoriaId: normalizarId(datos.categoriaId),
                proveedorId: normalizarId(datos.proveedorId),
                precioCompra: Number(datos.precioCompra),
                precioVenta: Number(datos.precioVenta),
                cantidad: Number(datos.cantidad),
                stockMinimo: Number(datos.stockMinimo)
            }
        },

        // Reglas de negocio del producto:
        // - nombre obligatorio
        // - precios, stock y stock mínimo deben ser números >= 0
        // - REGLA DE STOCK: stock > 0 válido · stock = 0 válido · stock < 0 inválido
        esProductoValido(producto) {
            if (!producto) {
                return false
            }

            if (!producto.nombre) {
                return false
            }

            const esCantidadValida = (valor) =>
                Number.isFinite(valor) && valor >= 0

            return (
                esCantidadValida(producto.precioCompra) &&
                esCantidadValida(producto.precioVenta) &&
                esCantidadValida(producto.cantidad) &&
                esCantidadValida(producto.stockMinimo)
            )
        },

        // Devuelve el producto creado, o null si los datos no son válidos.
        crearProducto(datos) {
            const productoNormalizado = this.normalizarProducto(datos)

            if (!this.esProductoValido(productoNormalizado)) {
                return null
            }

            // El código identifica al producto y se autogenera cuando viene
            // vacío (el formulario nunca lo envía). Si llegara uno explícito
            // no debe repetirse con el de otro producto.
            const codigoFinal =
                String(productoNormalizado.codigo || '').trim() ||
                this.generarCodigo()

            const codigoDuplicado = this.productos.some(
                (producto) =>
                    String(producto.codigo || '').toUpperCase() ===
                    codigoFinal.toUpperCase()
            )

            if (codigoDuplicado) {
                return null
            }

            const nuevoProducto = {
                id: this.generarId(),
                ...productoNormalizado,
                codigo: codigoFinal
            }

            this.productos.push(nuevoProducto)

            return nuevoProducto
        },

        obtenerProductos(id) {
            return this.productos.find(
                (producto) => producto.id === Number(id)
            )
        },

        // Devuelve el producto actualizado, o null si el id no existe
        // o si los datos actualizados no pasan las validaciones.
        editarProductos(id, datosActualizados) {
            const indice = this.productos.findIndex(
                (producto) => producto.id === Number(id)
            )

            if (indice === -1) {
                return null
            }

            const productoOriginal = this.productos[indice]

            const productoNormalizado = this.normalizarProducto({
                ...productoOriginal,
                ...datosActualizados
            })

            if (!this.esProductoValido(productoNormalizado)) {
                return null
            }

            // El id y el código no se cambian desde el formulario
            const productoActualizado = {
                ...productoNormalizado,
                id: productoOriginal.id,
                codigo: productoOriginal.codigo
            }

            this.productos[indice] = productoActualizado

            return productoActualizado
        },

        eliminarProducto(id) {
            const indice = this.productos.findIndex(
                (producto) => producto.id === Number(id)
            )

            if (indice === -1) {
                return false
            }

            this.productos.splice(indice, 1)

            return true
        },

        // -----------------------------------------------------------------
        // DESASOCIAR CATEGORÍA / PROVEEDOR ELIMINADO
        // Cuando se borra una categoría o un proveedor que estaba en uso, los
        // productos conservarían un id que ya no apunta a nada (referencia
        // inválida). Esta acción deja esos ids en null: la interfaz ya sabe
        // mostrar "Sin categoría"/"Sin proveedor", y al editar el producto el
        // formulario exige volver a elegir una referencia existente.
        // No se borra ni se modifica ningún otro dato del producto.
        // -----------------------------------------------------------------
        desasociarCategoria(categoriaId) {
            const id = Number(categoriaId)

            this.productos.forEach((producto) => {
                if (
                    producto.categoriaId !== null &&
                    producto.categoriaId !== undefined &&
                    Number(producto.categoriaId) === id
                ) {
                    producto.categoriaId = null
                }
            })
        },

        desasociarProveedor(proveedorId) {
            const id = Number(proveedorId)

            this.productos.forEach((producto) => {
                if (
                    producto.proveedorId !== null &&
                    producto.proveedorId !== undefined &&
                    Number(producto.proveedorId) === id
                ) {
                    producto.proveedorId = null
                }
            })
        }
    },

    persist: true
})