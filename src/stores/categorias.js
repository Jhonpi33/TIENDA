import { defineStore } from "pinia";
import { ref, computed } from 'vue';

export const useCategoriasStore = defineStore(
    'categorias',
    () => {

        //estadop

        const categorias = ref ([
            { 
                id: 1,
                nombre: 'Bebida'
            },
            { 
                id: 2,
                nombre: 'Granos'
            },
            { 
                id: 3,
                nombre: 'Lacteos'
            },
            { 
                id: 4,
                nombre: 'Snacks'
            },
            { 
                id: 5,
                nombre: 'Aseo'
            },
            { 
                id: 6,
                nombre: 'Enlatados'
            },
            { 
                id: 7,
                nombre: 'Panaderia'
            },
            { 
                id: 8,
                nombre: 'Otros'
            },
        ])

        //getters
        const totalCategorias = computed(() => {
            return categorias.value.length
        })
        //buscar id categoria

        function obtenerCategoriaPorId(id) {
            return categorias.value.find(
                categoria => categoria.id === Number(id))
        }

        //crear categoria
        // Devuelve la categoría creada, o null si el nombre no es válido.
        // Aplica EXACTAMENTE las mismas reglas que editarCategoria (nombre
        // obligatorio y sin duplicados): antes un duplicado sí entraba al
        // estado al crearlo, aunque la edición lo rechazaba.
        // El nombre se guarda ya recortado (sin espacios exteriores).

        function crearCategoria(nombre) {
            const nombreLimpio = (nombre ?? '').toString().trim()

            if (!nombreLimpio) {
                return null
            }

            // Duplicado: se comparan en minúsculas y ya sin espacios exteriores
            const yaExiste = categorias.value.some(
                actual =>
                    String(actual.nombre).trim().toLowerCase() === nombreLimpio.toLowerCase()
            )

            if (yaExiste) {
                return null
            }

            const nuevoId = categorias.value.length > 0
            ? Math.max(...categorias.value.map(categoria => categoria.id)) + 1 : 1

            const nuevaCategoria = {
                id: nuevoId,
                nombre: nombreLimpio
            }

            categorias.value.push(nuevaCategoria)

            return nuevaCategoria
        }

        //editar categoria
        //Devuelve la categoría modificada, o null si no se pudo editar
        //(mismo "null" que devuelve crearCategoria, para que quien llama
        // pueda comprobar el resultado con la misma condición).

        function editarCategoria(id, nombre) {

            // Se busca por Number(id) igual que en obtenerCategoriaPorId,
            // así funciona aunque el id llegue como texto ("3")
            const categoria = categorias.value.find(
                categoria => categoria.id === Number(id))

            // Si el id no existe, no se modifica nada
            if (!categoria) {
                return null
            }

            // Se limpian los espacios exteriores del nombre.
            // Si no es string o queda vacío, no se modifica nada
            const nombreLimpio = (nombre ?? '').toString().trim()

            if (!nombreLimpio) {
                return null
            }

            // Evitar duplicados: se comparan en minúsculas (se ignoran
            // mayúsculas/minúsculas) y ya sin espacios exteriores.
            // La categoría que se está editando se EXCLUYE por id, para que
            // pueda conservar su propio nombre sin chocar consigo misma.
            const yaExiste = categorias.value.some(
                actual =>
                    actual.id !== Number(id) &&
                    String(actual.nombre).trim().toLowerCase() === nombreLimpio.toLowerCase()
            )

            if (yaExiste) {
                return null
            }

            // Solo se actualiza el nombre; el id permanece igual
            categoria.nombre = nombreLimpio

            return categoria
        }

        //eliminar categoria

        function eliminarCategoria(id) {
            // Number(id): para que un id llegado como texto ("3") sí se pueda
            // eliminar; antes con !== contra un number nunca coincidía
            categorias.value = categorias.value.filter(
                categoria => categoria.id !== Number(id)
            )
        }

        //retornar store

        return {
            categorias,
            totalCategorias,
            obtenerCategoriaPorId,
            crearCategoria,
            editarCategoria,
            eliminarCategoria
        }
    },
    {
        persist:true
    }
)