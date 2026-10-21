import mongoose from 'mongoose'

// ---------------------------------------------------------------------------
// MOVIMIENTO DE INVENTARIO
// Registra cada entrada, salida o ajuste. La cantidad del producto se
// actualiza de forma ATÓMICA en el controlador (findOneAndUpdate con
// condición de stock) y luego se crea el movimiento; si la creación falla,
// se revierte el stock. Así nunca queda un movimiento sin su efecto en el
// inventario ni un stock negativo.
//
// - codigo: MOV-### autogenerado por el controlador (máximo existente + 1) y
//   con índice único: cada movimiento, sea entrada, salida o ajuste, tiene un
//   identificador propio e irrepetible, como el PRD-### de los productos.
// ---------------------------------------------------------------------------
const movimientoSchema = new mongoose.Schema(
    {
        codigo: {
            type: String,
            required: [true, 'El código del movimiento es obligatorio.'],
            uppercase: true,
            trim: true
        },
        productoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto',
            required: [true, 'El producto del movimiento es obligatorio.']
        },
        tipo: {
            type: String,
            required: [true, 'El tipo de movimiento es obligatorio.'],
            enum: {
                values: ['entrada', 'salida', 'ajuste'],
                message: 'El tipo debe ser "entrada", "salida" o "ajuste".'
            }
        },
        cantidad: {
            type: Number,
            required: [true, 'La cantidad del movimiento es obligatoria.'],
            min: [0, 'La cantidad no puede ser negativa.']
        },
        fecha: {
            type: Date,
            default: () => new Date()
        }
    },
    {
        versionKey: false
    }
)

// Índice único: dos movimientos nunca pueden compartir código, aunque dos
// peticiones simultáneas lleguen al mismo instante.
movimientoSchema.index({ codigo: 1 }, { unique: true })

export const Movimiento = mongoose.model('Movimiento', movimientoSchema)
