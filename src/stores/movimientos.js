    import { defineStore } from "pinia";
import { useProductosStore } from "./productos";

export const useMovimientosStore = defineStore('movimientos', {

    state: () => ({
        movimientos: []
    }),

    getters: {

        totalMovimientos: (state) => {
            return state.movimientos.length
        },

        entradas: (state) => {
            return state.movimientos.filter(
                movimiento => movimiento.tipo === 'entrada'
            )
        },

        salidas: (state) => {
            return state.movimientos.filter(
                movimiento => movimiento.tipo === 'salida'
            )
        },

        ajustes: (state) => {
            return state.movimientos.filter(
                movimiento => movimiento.tipo === 'ajuste'
            )
        }

    },

    actions: {

        registrarMovimiento(datos) {

            const productosStore = useProductosStore()

            const producto = productosStore.obtenerProductos(
                datos.productoId
            )

            if (!producto) {
                return null
            }

            // -----------------------------------------------------------------------
            // VALIDACIÓN DE CANTIDAD (cambia según el tipo)
            // - ajuste  -> fija el stock FINAL, así que 0 sí es válido
            //             (un producto puede quedar agotado), pero JAMÁS negativo.
            // - entrada -> debe sumar algo real, así que tiene que ser mayor a 0.
            // - salida  -> debe restar algo real, así que tiene que ser mayor a 0.
            // En ningún caso se permite stock negativo.
            // -----------------------------------------------------------------------
            const cantidadInvalida = datos.tipo === 'ajuste'
                ? datos.cantidad < 0
                : datos.cantidad <= 0

            if (cantidadInvalida) {
                return null
            }

            if (datos.tipo === 'entrada') {
                producto.cantidad += datos.cantidad
            }

            if (datos.tipo === 'salida') {

                if (producto.cantidad < datos.cantidad) {
                    return null
                }

                producto.cantidad -= datos.cantidad
            }

            if (datos.tipo === 'ajuste') {
                producto.cantidad = datos.cantidad
            }

            const nuevoMovimiento = {
                id: Date.now(),
                fecha: new Date().toISOString(),
                ...datos
            }

            this.movimientos.push(nuevoMovimiento)

            return nuevoMovimiento
        },

        obtenerMovimientoPorId(id) {

            return this.movimientos.find(
                movimiento =>
                    movimiento.id === Number(id)
            )

        }

    },

    persist: true

})