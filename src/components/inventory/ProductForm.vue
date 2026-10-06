<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="product-form">
      <q-card-section>
        <h2 class="form-title">
          {{ product ? 'Editar producto' : 'Nuevo producto' }}
        </h2>

        <p class="form-description">
          Completa la información del producto.
        </p>
      </q-card-section>

      <q-card-section>
        <q-banner v-if="mensajeError" class="form-error bg-red-1 text-negative" rounded>
          <template #avatar>
            <q-icon name="error" color="negative" size="24px" />
          </template>

          {{ mensajeError }}
        </q-banner>

        <div class="form-grid">
          <q-input v-model="form.nombre" outlined label="Nombre del producto" required />

          <q-select v-model="form.categoriaId" :options="categories" option-label="nombre" option-value="id" emit-value
            map-options outlined label="Categoría" required />

          <q-select v-model="form.proveedorId" :options="suppliers" option-label="nombre" option-value="id" emit-value
            map-options outlined label="Proveedor" required />

          <q-input :model-value="formatPrice(form.precioCompra)" outlined label="Precio de compra" prefix="$" required
            @update:model-value="updatePrice('precioCompra', $event)" />

          <q-input :model-value="formatPrice(form.precioVenta)" outlined label="Precio de venta" prefix="$" required
            @update:model-value="updatePrice('precioVenta', $event)" />

          <q-input v-model.number="form.cantidad" outlined type="number" label="Cantidad" min="0" required />

          <q-input v-model.number="form.stockMinimo" outlined type="number" label="Stock mínimo" min="0" required />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="form-actions">
        <q-btn flat label="Cancelar" @click="closeForm" />

        <q-btn color="primary" label="Guardar producto" @click="saveProduct" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
// Aviso SweetAlert2 cuando la validación local del formulario falla
import { mostrarAdvertencia } from '../../utils/alertas.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },

  product: {
    type: Object,
    default: null
  },

  categories: {
    type: Array,
    default: () => []
  },

  suppliers: {
    type: Array,
    default: () => []
  },

  // Error devuelto por el store (lo envía la vista cuando guardar falla)
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'save'
])

// Error detectado por la validación de ESTE formulario
const localError = ref('')

// Primero el error local; si no hay, el que manda la vista desde el store
const mensajeError = computed(() => localError.value || props.error || '')

const form = reactive({
  nombre: '',
  categoriaId: null,
  proveedorId: null,
  precioCompra: 0,
  precioVenta: 0,
  cantidad: 0,
  stockMinimo: 0
})

function resetForm() {
  form.nombre = ''
  form.categoriaId = null
  form.proveedorId = null
  form.precioCompra = 0
  form.precioVenta = 0
  form.cantidad = 0
  form.stockMinimo = 0
  localError.value = ''
}

function loadProduct(product) {
  form.nombre = product?.nombre || ''

  // Si la categoría/proveedor ya no existen (quedaron huérfanos tras una
  // eliminación), el selector queda vacío en vez de mostrar un id suelto,
  // para que el usuario pueda elegir una referencia válida.
  const categoriaExiste = props.categories.some(
    (categoria) => Number(categoria.id) === Number(product?.categoriaId)
  )
  const proveedorExiste = props.suppliers.some(
    (proveedor) => Number(proveedor.id) === Number(product?.proveedorId)
  )

  form.categoriaId = categoriaExiste ? Number(product.categoriaId) : null
  form.proveedorId = proveedorExiste ? Number(product.proveedorId) : null

  form.precioCompra = product?.precioCompra ?? 0
  form.precioVenta = product?.precioVenta ?? 0
  form.cantidad = product?.cantidad ?? 0
  form.stockMinimo = product?.stockMinimo ?? 0

  localError.value = ''
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return new Intl.NumberFormat('es-CO').format(Number(value))
}

function updatePrice(field, value) {
  const numericValue = String(value).replace(/\D/g, '')

  form[field] = numericValue === ''
    ? 0
    : Number(numericValue)
}

function closeForm() {
  emit('update:modelValue', false)
}

// ---------------------------------------------------------------------------
// VALIDACIÓN
// Devuelve un mensaje vacío si todo está bien.
// Reglas clave:
// - nombre, categoría y proveedor son obligatorios
// - precios, cantidad y stock mínimo deben ser números >= 0
// - REGLA DE STOCK: 0 es válido, negativo nunca.
// ---------------------------------------------------------------------------
function validate() {
  const nombre = String(form.nombre ?? '').trim()

  if (!nombre) {
    return 'Indica el nombre del producto.'
  }

  if (form.categoriaId === null || form.categoriaId === undefined) {
    return 'Selecciona una categoría.'
  }

  if (form.proveedorId === null || form.proveedorId === undefined) {
    return 'Selecciona un proveedor.'
  }

  const precioCompra = Number(form.precioCompra)
  const precioVenta = Number(form.precioVenta)
  const cantidad = Number(form.cantidad)
  const stockMinimo = Number(form.stockMinimo)

  if (!Number.isFinite(precioCompra) || precioCompra < 0) {
    return 'El precio de compra debe ser un número mayor o igual a 0.'
  }

  if (!Number.isFinite(precioVenta) || precioVenta < 0) {
    return 'El precio de venta debe ser un número mayor o igual a 0.'
  }

  // Campo vacío explícito (Number('') es 0, por eso se revisa antes)
  if (form.cantidad === '' || form.cantidad === null || form.cantidad === undefined) {
    return 'Indica la cantidad en stock.'
  }

  if (!Number.isFinite(cantidad)) {
    return 'La cantidad debe ser un número.'
  }

  if (cantidad < 0) {
    return 'El stock no puede ser negativo.'
  }

  if (form.stockMinimo === '' || form.stockMinimo === null || form.stockMinimo === undefined) {
    return 'Indica el stock mínimo.'
  }

  if (!Number.isFinite(stockMinimo) || stockMinimo < 0) {
    return 'El stock mínimo debe ser un número mayor o igual a 0.'
  }

  return ''
}

function saveProduct() {
  const mensaje = validate()

  if (mensaje) {
    localError.value = mensaje
    // SweetAlert2: además del banner del formulario, la validación se
    // comunica con un modal de advertencia (patrón único de alertas)
    mostrarAdvertencia({ titulo: 'Revisa la información', texto: mensaje })
    return
  }

  localError.value = ''

  // Se emiten números para que el store nunca reciba texto
  // (evita bugs como "20" + 5 = "205" en el stock)
  emit('save', {
    nombre: String(form.nombre).trim(),
    categoriaId: Number(form.categoriaId),
    proveedorId: Number(form.proveedorId),
    precioCompra: Number(form.precioCompra),
    precioVenta: Number(form.precioVenta),
    cantidad: Number(form.cantidad),
    stockMinimo: Number(form.stockMinimo)
  })
}

// Recarga el formulario cada vez que se abre el diálogo:
// así no quedan datos viejos si se cancela y se vuelve a entrar.
function sincronizarFormulario() {
  if (props.product) {
    loadProduct(props.product)
  } else {
    resetForm()
  }
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      sincronizarFormulario()
    }
  }
)

// Si cambia el producto mientras el diálogo está abierto, se recarga
watch(
  () => props.product,
  () => {
    if (props.modelValue) {
      sincronizarFormulario()
    }
  }
)
</script>

<style scoped>
.product-form {
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
}

.form-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 600;
}

.form-description {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
}

.form-error {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-actions {
  padding: 16px 24px 24px;
}

@media (max-width: 600px) {
  .product-form {
    max-width: calc(100vw - 32px);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>