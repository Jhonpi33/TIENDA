<template>
    <q-page class="providers-page">
        <PageHeader title="Proveedores" description="Administra los proveedores relacionados con tu inventario">
            <template #actions>
                <q-btn color="primary" icon="add" label="Nuevo proveedor" no-caps @click="openCreateForm" />
            </template>
        </PageHeader>

        <!--
          TOTAL DE PROVEEDORES
          Se lee del getter del store: al crear o eliminar un proveedor
          la tarjeta se actualiza sola por la reactividad de Pinia.
        -->
        <SummaryCard class="summary" title="Total de proveedores" :value="proveedoresStore.totalProveedores"
            icon="local_shipping" description="Proveedores registrados en el sistema" />

        <!-- Búsqueda existente: filtra por nombre, teléfono, correo y dirección -->
        <q-card class="provider-filters">
            <q-card-section>
                <q-input v-model="search" outlined dense clearable label="Buscar proveedor"
                    placeholder="Nombre, contacto, teléfono o correo">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </q-card-section>
        </q-card>

        <ProviderTable :providers="filteredProviders" :no-data-label="emptyLabel" @edit="openEditForm"
            @delete="confirmDelete" />

        <!--
          :providers alimenta la validación de nombres duplicados.
          Se pasa el array reactivo del store: la vista nunca lo modifica.
        -->
        <ProviderForm v-model="showForm" :provider="selectedProvider" :providers="proveedoresStore.proveedores"
            @save="saveProvider" />
    </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SummaryCard from '../components/ui/SummaryCard.vue'
import ProviderTable from '../components/providers/ProviderTable.vue'
import ProviderForm from '../components/providers/ProviderForm.vue'
// Alertas unificadas del sistema (SweetAlert2)
import { confirmarOperacion, mostrarAdvertencia, mostrarError, mostrarExito } from '../utils/alertas'
import { useProveedoresStore } from '../stores/proveedores'
import { useProductosStore } from '../stores/productos'

const proveedoresStore = useProveedoresStore()
// Solo se consulta: permite saber si un proveedor está siendo usado
const productosStore = useProductosStore()

const search = ref('')
const showForm = ref(false)
const selectedProvider = ref(null)

const filteredProviders = computed(() => {
    // El clearable de Quasar entrega null al pulsar la X del campo, por eso
    // se convierte a texto ANTES de llamar a toLowerCase() (con null la vista
    // se caía con "Cannot read properties of null").
    const value = String(search.value ?? '').trim().toLowerCase()

    if (!value) {
        return proveedoresStore.proveedores
    }

    return proveedoresStore.proveedores.filter(provider => {
        return [
            provider.nombre,
            provider.telefono,
            provider.email,
            provider.direccion
        ].some(field =>
            String(field ?? '').toLowerCase().includes(value)
        )
    })
})

// Estado vacío distinto: sin proveedores registrados, o sin coincidencias
const emptyLabel = computed(() => {
    if (String(search.value ?? '').trim()) {
        return 'No se encontraron proveedores con ese criterio'
    }

    return 'No hay proveedores registrados'
})

// Cuenta los productos que usan este proveedor comparando su proveedorId.
// Se convierten ambos ids con Number() porque pueden llegar como texto.
function contarProductosAsociados(proveedor) {
    return productosStore.productos.filter(
        producto => Number(producto.proveedorId) === Number(proveedor.id)
    ).length
}

function openCreateForm() {
    selectedProvider.value = null
    showForm.value = true
}

function openEditForm(provider) {
    selectedProvider.value = provider
    showForm.value = true
}

// Guarda el proveedor: si hay uno seleccionado lo edita, si no lo crea.
// El cierre del diálogo deja la tabla actualizada por la reactividad.
function saveProvider(data) {
    const resultado = selectedProvider.value
        ? proveedoresStore.editarProveedor(
            selectedProvider.value.id,
            data
          )
        : proveedoresStore.crearProveedor(data)

    // El store devuelve null si los datos son inválidos (campo vacío o
    // nombre duplicado): NO se guarda nada y se explica con SweetAlert2.
    // (Los errores de campo del formulario siguen mostrando su propio banner.)
    if (!resultado) {
        mostrarError({
            titulo: 'No se pudo guardar el proveedor',
            texto: 'Revisa los datos e inténtalo de nuevo.'
        })
        return
    }

    // ÉXITO: se guarda el indicador ANTES de limpiar, se cierra el diálogo y
    // SweetAlert2 informa con un toast si fue alta o modificación.
    const esEdicion = Boolean(selectedProvider.value)

    showForm.value = false
    selectedProvider.value = null

    mostrarExito(
        esEdicion
            ? 'Proveedor actualizado correctamente.'
            : 'Proveedor creado correctamente.'
    )
}

// ---------------------------------------------------------------------------
// ELIMINACIÓN
// Flujo completo: validar -> confirmar -> eliminar -> informar el resultado.
// Si el proveedor tiene productos asociados NO se elimina: se explica el
// motivo y no se toca el store (evita productos con proveedor colgante).
// ---------------------------------------------------------------------------
async function confirmDelete(provider) {
    const total = contarProductosAsociados(provider)

    if (total > 0) {
        await mostrarAdvertencia({
            titulo: 'No se puede eliminar el proveedor',
            texto:
                total === 1
                    ? 'No se puede eliminar este proveedor porque existe 1 producto asociado.'
                    : `No se puede eliminar este proveedor porque existen ${total} productos asociados.`
        })

        return
    }

    const confirmado = await confirmarOperacion({
        titulo: '¿Eliminar proveedor?',
        texto: `Se eliminará "${provider.nombre}". Esta acción no se puede deshacer.`,
        confirmar: 'Eliminar'
    })

    if (!confirmado) {
        // Canceló: no se modifica nada
        return
    }

    const id = Number(provider.id)

    // Toda modificación pasa por el store; Number(id) para que funcione
    // aunque el identificador llegue como texto
    proveedoresStore.eliminarProveedor(id)

    mostrarExito('Proveedor eliminado correctamente.')
}

// Al cerrar el diálogo se limpia cualquier estado pendiente
watch(showForm, (abierto) => {
    if (!abierto) {
        selectedProvider.value = null
    }
})
</script>

<style scoped>
.providers-page {
    padding: 24px;
}

.summary {
    width: 100%;
    margin-bottom: 20px;
}

.provider-filters {
    width: 100%;
    margin-bottom: 20px;
    border-radius: 12px;
}

@media (max-width: 600px) {
    .providers-page {
        padding: 16px;
    }
}
</style>