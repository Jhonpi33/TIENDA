<template>
  <q-page class="inventory-page">
    <PageHeader title="Inventario" description="Gestiona los productos registrados en el inventario">
      <template #actions>
        <q-btn color="primary" icon="add" label="Agregar producto" no-caps @click="openCreateForm" />
      </template>
    </PageHeader>

    <ProductFilters v-model:search="search" v-model:category="category" v-model:status="status"
      :categories="categoriasStore.categorias" />

    <ProductTable :products="filteredProducts" @view="viewProduct" @edit="openEditForm" @delete="deleteProduct" />

    <ProductForm v-model="showForm" :product="selectedProduct" :categories="categoriasStore.categorias"
      :suppliers="proveedoresStore.proveedores" @save="saveProduct" />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageHeader from '../components/ui/PageHeader.vue'
import ProductFilters from '../components/inventory/ProductFilters.vue'
import ProductTable from '../components/inventory/ProductTable.vue'
import ProductForm from '../components/inventory/ProductForm.vue'

// Alertas unificadas del sistema (SweetAlert2)
import { confirmarOperacion, mostrarError, mostrarExito } from '../utils/alertas'

import { useProductosStore } from '../stores/productos'
import { useCategoriasStore } from '../stores/categorias'
import { useProveedoresStore } from '../stores/proveedores'

const route = useRoute()
const router = useRouter()

const productosStore = useProductosStore()
const categoriasStore = useCategoriasStore()
const proveedoresStore = useProveedoresStore()

const search = ref('')
const category = ref('')
const status = ref('')

const showForm = ref(false)
const selectedProduct = ref(null)

const filteredProducts = computed(() => {
  return productosStore.productosConCategoria.filter((product) => {
    const searchValue = search.value.trim().toLowerCase()

    const nombre = String(product.nombre || '').toLowerCase()
    const codigo = String(product.codigo || '').toLowerCase()

    const matchesSearch =
      !searchValue ||
      nombre.includes(searchValue) ||
      codigo.includes(searchValue)

    const matchesCategory =
      !category.value ||
      (product.categoriaId !== null &&
        product.categoriaId !== undefined &&
        Number(product.categoriaId) === Number(category.value))

    const matchesStatus =
      !status.value ||
      getProductStatus(product) === status.value

    return matchesSearch && matchesCategory && matchesStatus
  })
})

function getProductStatus(product) {
  if (product.cantidad === 0) {
    return 'out'
  }

  if (product.cantidad <= product.stockMinimo) {
    return 'low'
  }

  return 'available'
}

function openCreateForm() {
  selectedProduct.value = null
  showForm.value = true
}

function openEditForm(product) {
  selectedProduct.value = product
  showForm.value = true
}

function viewProduct(product) {
  router.push(`/producto-detalles/${product.id}`)
}

// ---------------------------------------------------------------------------
// ELIMINAR PRODUCTO
// 1. SweetAlert2 pregunta antes (nunca se borra directo desde la tabla).
// 2. Si el usuario cancela, no se modifica nada.
// 3. Si confirma, el store elimina y se informa el resultado.
// ---------------------------------------------------------------------------
async function deleteProduct(product) {
  const confirmado = await confirmarOperacion({
    titulo: '¿Eliminar producto?',
    texto: `Se eliminará "${product.nombre}". Esta acción no se puede deshacer.`,
    confirmar: 'Eliminar'
  })

  if (!confirmado) {
    return
  }

  productosStore.eliminarProducto(product.id)

  mostrarExito('Producto eliminado correctamente.')
}

function saveProduct(productData) {
  const resultado = selectedProduct.value
    ? productosStore.editarProductos(
        selectedProduct.value.id,
        productData
      )
    : productosStore.crearProducto(productData)

  // El store devuelve null cuando los datos no son válidos o el producto ya
  // no existe: NO se guarda nada y el diálogo queda abierto para corregir.
  // El motivo se explica con SweetAlert2 (los errores de campo, en cambio,
  // siguen mostrando el banner propio del formulario).
  if (!resultado) {
    mostrarError({
      titulo: 'No se pudo guardar el producto',
      texto: 'Revisa los datos e inténtalo de nuevo.'
    })
    return
  }

  // ÉXITO: se guarda el indicador ANTES de limpiar, se cierra el diálogo y
  // SweetAlert2 informa con un toast si fue alta o modificación.
  const esEdicion = Boolean(selectedProduct.value)

  showForm.value = false
  selectedProduct.value = null

  mostrarExito(
    esEdicion
      ? 'Producto actualizado correctamente.'
      : 'Producto creado correctamente.'
  )
}

// Al cerrar el diálogo (por guardado, cancelación o X) se limpia la selección
watch(showForm, (abierto) => {
  if (!abierto) {
    selectedProduct.value = null
  }
})

watch(
  () => route.query.editar,
  (productId) => {
    if (!productId) {
      return
    }

    const product = productosStore.obtenerProductos(productId)

    if (!product) {
      router.replace('/inventario')
      return
    }

    selectedProduct.value = product
    showForm.value = true

    router.replace('/inventario')
  },
  { immediate: true }
)
</script>

<style scoped>
.inventory-page {
  padding: 24px;
}

@media (max-width: 600px) {
  .inventory-page {
    padding: 16px;
  }
}
</style>